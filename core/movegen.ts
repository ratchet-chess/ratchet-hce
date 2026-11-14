/**
 * Legal move generation for native 64-bit bitboards: check and pin masks
 * restrict targets, and en passant is tested by making it.
 *
 * With quiets = false only noisy moves are generated: captures, en passant and
 * queen promotions, which a quiescence search can use out of check. For a
 * staged search, generateCaptures() lists the captures, every
 * promotion of a capture included, and generateQuiets() the other moves; each
 * keeps the order the moves have in generateMoves(), so a stage's sort sees the
 * same list a filter of the whole one would give.
 */
import { BISHOP, FILE_A, FLAG_CASTLE, FLAG_DOUBLE, FLAG_EP, KING, KNIGHT, NO_SQ, PAWN, QUEEN, ROOK, movePromo } from "./constants";
import { ROOK_SQ, attackedWith, bb, board, castleIndex, castling, ep, make, side, unmake } from "./position";
import { BETWEEN, KING_ATT, KNIGHT_ATT, LINE, PAWN_ATT, bishopAttacks, bit, rookAttacks } from "./tables";

@inline function pushPromos(out: StaticArray<i32>, n: i32, base: i32): i32 {
  out[n] = base | (QUEEN << 12);
  out[n + 1] = base | (ROOK << 12);
  out[n + 2] = base | (BISHOP << 12);
  out[n + 3] = base | (KNIGHT << 12);
  return n + 4;
}

const FILE_H: u64 = FILE_A << 7;
const RANK_2: u64 = 0xff00;
const RANK_7: u64 = 0xff000000000000;

const GEN_ALL = 0;
const GEN_NOISY = 1;
const GEN_CAPTURES = 2;
const GEN_QUIETS = 3;

/** Writes legal moves into `out` from index `start`; returns the index past the last move. */
export function generateMoves(out: StaticArray<i32>, start: i32, quiets: bool): i32 {
  return quiets ? generate(out, start, GEN_ALL) : generate(out, start, GEN_NOISY);
}

/** Writes the legal captures, en passant and every promotion of a capture included, from `start`; returns the end. */
export function generateCaptures(out: StaticArray<i32>, start: i32): i32 {
  return generate(out, start, GEN_CAPTURES);
}

/** Writes the legal moves that capture nothing, from `start`; returns the end. */
export function generateQuiets(out: StaticArray<i32>, start: i32): i32 {
  return generate(out, start, GEN_QUIETS);
}

@inline function generate(out: StaticArray<i32>, start: i32, mode: i32): i32 {
  const quiets = mode == GEN_ALL || mode == GEN_QUIETS;
  const captures = mode != GEN_QUIETS;
  const us = side;
  const them = us ^ 1;
  const us8 = us << 3;
  const th8 = them << 3;
  const usOcc = bb[us8];
  const thOcc = bb[th8];
  const occ = usOcc | thOcc;
  const ksq = <i32>ctz(bb[us8 | KING]);
  let n = start;

  // King moves, tested against occupancy without the king.
  {
    const o = occ ^ bit(ksq);
    let t = KING_ATT[ksq] & (mode == GEN_ALL ? ~usOcc : mode == GEN_QUIETS ? ~occ : thOcc);
    while (t) {
      const to = <i32>ctz(t);
      t &= t - 1;
      if (!attackedWith(to, them, o)) out[n++] = ksq | (to << 6);
    }
  }

  const thQ = bb[th8 | QUEEN];
  const thRQ = bb[th8 | ROOK] | thQ;
  const thBQ = bb[th8 | BISHOP] | thQ;
  const checkers =
    (PAWN_ATT[(us << 6) + ksq] & bb[th8 | PAWN]) |
    (KNIGHT_ATT[ksq] & bb[th8 | KNIGHT]) |
    (rookAttacks(ksq, occ) & thRQ) |
    (bishopAttacks(ksq, occ) & thBQ);

  let target = ~usOcc;
  if (checkers) {
    if (checkers & (checkers - 1)) return n; // double check
    target = BETWEEN[ksq * 64 + <i32>ctz(checkers)] | checkers;
  }
  const pieceTarget = mode == GEN_ALL ? target : mode == GEN_QUIETS ? target & ~occ : target & thOcc;

  // Pinned pieces: enemy sliders that see the king through their own pieces only,
  // with exactly one of our pieces between.
  let pinned: u64 = 0;
  {
    let snipers = (rookAttacks(ksq, thOcc) & thRQ) | (bishopAttacks(ksq, thOcc) & thBQ);
    while (snipers) {
      const s = <i32>ctz(snipers);
      snipers &= snipers - 1;
      const b = BETWEEN[ksq * 64 + s] & occ;
      if (b && !(b & (b - 1)) && b & usOcc) pinned |= b;
    }
  }

  // Knights, bishops, rooks, queens.
  for (let type = KNIGHT; type <= QUEEN; type++) {
    let pieces = bb[us8 | type];
    while (pieces) {
      const from = <i32>ctz(pieces);
      pieces &= pieces - 1;
      let a: u64;
      if (type == KNIGHT) a = KNIGHT_ATT[from];
      else if (type == BISHOP) a = bishopAttacks(from, occ);
      else if (type == ROOK) a = rookAttacks(from, occ);
      else a = bishopAttacks(from, occ) | rookAttacks(from, occ);
      a &= pieceTarget;
      if (pinned & bit(from)) a &= LINE[ksq * 64 + from];
      while (a) {
        const to = <i32>ctz(a);
        a &= a - 1;
        out[n++] = from | (to << 6);
      }
    }
  }

  // Pawns, one at a time.
  {
    const fwd = us == 0 ? 8 : -8;
    const startRank = us == 0 ? 1 : 6;
    let pawns = bb[us8 | PAWN];
    // Noisy modes skip pawns with nothing to take or promote, keeping square order.
    if (!quiets) {
      const reach = us == 0
        ? ((thOcc & ~FILE_H) >> 7) | ((thOcc & ~FILE_A) >> 9)
        : ((thOcc & ~FILE_A) << 7) | ((thOcc & ~FILE_H) << 9);
      let able = reach;
      if (ep != NO_SQ) able |= PAWN_ATT[(them << 6) + ep];
      if (mode == GEN_NOISY) able |= us == 0 ? RANK_7 : RANK_2;
      pawns &= able;
    } else if (mode == GEN_QUIETS) {
      pawns &= us == 0 ? ~(occ >> 8) : ~(occ << 8);
    }
    while (pawns) {
      const from = <i32>ctz(pawns);
      pawns &= pawns - 1;
      let ok = target;
      if (pinned & bit(from)) ok &= LINE[ksq * 64 + from];
      const to = from + fwd;
      const promo = to >= 56 || to < 8;
      if (!board[to]) {
        if (ok & bit(to)) {
          if (promo) {
            if (quiets) n = pushPromos(out, n, from | (to << 6));
            else if (mode == GEN_NOISY) out[n++] = from | (to << 6) | (QUEEN << 12);
          } else if (quiets) {
            out[n++] = from | (to << 6);
          }
        }
        const to2 = to + fwd;
        if (quiets && from >> 3 == startRank && !board[to2] && ok & bit(to2)) {
          out[n++] = from | (to2 << 6) | FLAG_DOUBLE;
        }
      }
      const pa = PAWN_ATT[(us << 6) + from];
      let caps = captures ? pa & thOcc & ok : 0;
      while (caps) {
        const t = <i32>ctz(caps);
        caps &= caps - 1;
        if (promo) {
          if (mode != GEN_NOISY) n = pushPromos(out, n, from | (t << 6));
          else out[n++] = from | (t << 6) | (QUEEN << 12);
        } else {
          out[n++] = from | (t << 6);
        }
      }
      if (captures && ep != NO_SQ && pa & bit(ep)) {
        const m = from | (ep << 6) | FLAG_EP;
        make(m);
        if (!attackedWith(ksq, them, bb[0] | bb[8])) out[n++] = m;
        unmake(m);
      }
    }
  }

  // Castling: rights imply king and rook are home; not out of, through or into check. The h-side first.
  if (quiets && !checkers) {
    const cr = castling >> (us << 1);
    const base = us == 0 ? 0 : 56;
    if (cr & 1 && castleOk(us << 1, ksq, base + 6, them, occ)) out[n++] = ksq | ((base + 6) << 6) | FLAG_CASTLE;
    if (cr & 2 && castleOk((us << 1) | 1, ksq, base + 2, them, occ)) out[n++] = ksq | ((base + 2) << 6) | FLAG_CASTLE;
  }

  return n;
}

/**
 * Whether m is a legal move here: one generateMoves() would list. It checks a
 * move from elsewhere in the tree, such as a table move or a killer, before
 * any generation.
 */
export function isLegal(m: i32): bool {
  if (m <= 0 || m >= 1 << 18) return false;
  const from = m & 63;
  const to = (m >>> 6) & 63;
  const promo = movePromo(m);
  const us = side;
  const us8 = us << 3;
  const p = <i32>board[from];
  if (!p || (p & 8) != us8) return false;
  const type = p & 7;
  const occ = bb[0] | bb[8];
  // a castle's king may end on its own rook's square, so it is judged before the capture test
  if (m & FLAG_CASTLE) return type == KING && castleLegal(m, occ);
  const victim = <i32>board[to];
  if (victim && ((victim & 8) == us8 || (victim & 7) == KING)) return false;
  if (type == PAWN) {
    const fwd = us == 0 ? 8 : -8;
    if ((to >= 56 || to < 8) != (promo != 0)) return false;
    if (promo && (promo < KNIGHT || promo > QUEEN)) return false;
    const pa = PAWN_ATT[(us << 6) + from];
    if (m & FLAG_EP) {
      if (m & FLAG_DOUBLE || to != ep || !(pa & bit(to))) return false;
    } else if (m & FLAG_DOUBLE) {
      if (from >> 3 != (us == 0 ? 1 : 6) || to != from + 2 * fwd || board[from + fwd] || victim) return false;
    } else if (to == from + fwd) {
      if (victim) return false;
    } else if (!(pa & bit(to)) || !victim) {
      return false;
    }
  } else {
    if (promo || m & (FLAG_EP | FLAG_DOUBLE)) return false;
    let a: u64;
    if (type == KNIGHT) a = KNIGHT_ATT[from];
    else if (type == BISHOP) a = bishopAttacks(from, occ);
    else if (type == ROOK) a = rookAttacks(from, occ);
    else if (type == QUEEN) a = bishopAttacks(from, occ) | rookAttacks(from, occ);
    else a = KING_ATT[from];
    if (!(a & bit(to))) return false;
  }
  if (m & FLAG_EP) {
    make(m);
    const ok = !attackedWith(<i32>ctz(bb[us8 | KING]), us ^ 1, bb[0] | bb[8]);
    unmake(m);
    return ok;
  }
  // The board after the move, without making it: a piece on `to` is captured.
  const th8 = (us ^ 1) << 3;
  const after = (occ ^ bit(from)) | bit(to);
  const left = ~bit(to);
  const ksq = type == KING ? to : <i32>ctz(bb[us8 | KING]);
  if (PAWN_ATT[(us << 6) + ksq] & bb[th8 | PAWN] & left) return false;
  if (KNIGHT_ATT[ksq] & bb[th8 | KNIGHT] & left) return false;
  if (KING_ATT[ksq] & bb[th8 | KING]) return false;
  const q = bb[th8 | QUEEN];
  if (bishopAttacks(ksq, after) & (bb[th8 | BISHOP] | q) & left) return false;
  return (rookAttacks(ksq, after) & (bb[th8 | ROOK] | q) & left) == 0;
}

/** whether castling move m is legal: generateMoves()'s castling test */
function castleLegal(m: i32, occ: u64): bool {
  if (m & ~(4095 | FLAG_CASTLE)) return false;
  const from = m & 63;
  const to = (m >>> 6) & 63;
  const base = side == 0 ? 0 : 56;
  if (from != <i32>ctz(bb[(side << 3) | KING]) || (to != base + 6 && to != base + 2)) return false;
  const i = castleIndex(to);
  if (!(castling & (1 << i)) || attackedWith(from, side ^ 1, occ)) return false;
  return castleOk(i, from, to, side ^ 1, occ);
}

/**
 * Whether the castle of right index i is open, the king not in check: every square the king and rook cross or land
 * on is empty but for the two of them, and no square the king crosses or lands on is attacked. Attacks are read
 * with the rook gone, so a rook that shields the king's destination does not count; in a standard start that
 * changes nothing. Weiss c735b8f CastleLegal, which reads only the destination with the rook gone; on the first rank
 * a square the king crosses can be seen through the rook's square only if its destination can.
 */
function castleOk(i: i32, ksq: i32, kto: i32, them: i32, occ: u64): bool {
  const rf = <i32>ROOK_SQ[i];
  const rto = (kto & 7) == 6 ? kto - 1 : kto + 1;
  const path = (BETWEEN[(ksq << 6) + kto] | bit(kto) | BETWEEN[(rf << 6) + rto] | bit(rto)) & ~(bit(ksq) | bit(rf));
  if (occ & path) return false;
  const o = occ ^ bit(rf);
  let cross = BETWEEN[(ksq << 6) + kto] | bit(kto);
  while (cross) {
    if (attackedWith(<i32>ctz(cross), them, o)) return false;
    cross &= cross - 1;
  }
  return true;
}
