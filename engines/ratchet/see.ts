/**
 * Static exchange evaluation against a threshold: whether a move wins at least
 * `threshold` once every capture on its square is played out, least valuable
 * attacker first. The form is Stockfish 15 Position::see_ge: a swap list
 * kept as one running balance, with x-rays added as pieces leave the board.
 * Pins are ignored. Castling, en passant and promotions score as an even trade.
 */
import { BISHOP, FLAG_CASTLE, FLAG_EP, KING, KNIGHT, PAWN, QUEEN, ROOK, moveFrom, movePromo, moveTo } from "../../core/constants";
import { bb, board, side } from "../../core/position";
import { KING_ATT, KNIGHT_ATT, PAWN_ATT, bishopAttacks, bit, rookAttacks } from "../../core/tables";
import { SEE_VALUE } from "./params";

/** every piece of either color attacking square `s`, sliders through occupancy `occ` */
@inline function attackersTo(s: i32, occ: u64): u64 {
  const bishops = bb[BISHOP] | bb[8 | BISHOP] | bb[QUEEN] | bb[8 | QUEEN];
  const rooks = bb[ROOK] | bb[8 | ROOK] | bb[QUEEN] | bb[8 | QUEEN];
  return (
    (PAWN_ATT[64 + s] & bb[PAWN]) |
    (PAWN_ATT[s] & bb[8 | PAWN]) |
    (KNIGHT_ATT[s] & (bb[KNIGHT] | bb[8 | KNIGHT])) |
    (KING_ATT[s] & (bb[KING] | bb[8 | KING])) |
    (bishopAttacks(s, occ) & bishops) |
    (rookAttacks(s, occ) & rooks)
  );
}

export function seeGe(m: i32, threshold: i32): bool {
  if (m & (FLAG_CASTLE | FLAG_EP) || movePromo(m)) return 0 >= threshold;
  const from = moveFrom(m);
  const to = moveTo(m);
  let swap = SEE_VALUE[<i32>board[to] & 7] - threshold;
  if (swap < 0) return false;
  swap = SEE_VALUE[<i32>board[from] & 7] - swap;
  if (swap <= 0) return true;

  let occ = (bb[0] | bb[8]) ^ bit(from) ^ bit(to);
  let attackers = attackersTo(to, occ);
  const bishops = bb[BISHOP] | bb[8 | BISHOP] | bb[QUEEN] | bb[8 | QUEEN];
  const rooks = bb[ROOK] | bb[8 | ROOK] | bb[QUEEN] | bb[8 | QUEEN];
  let stm = side;
  let res = 1;
  while (true) {
    stm ^= 1;
    attackers &= occ;
    const mine = attackers & bb[stm << 3];
    if (!mine) break;
    res ^= 1;
    const c8 = stm << 3;
    let b: u64;
    if ((b = mine & bb[c8 | PAWN])) {
      if ((swap = SEE_VALUE[PAWN] - swap) < res) break;
      occ ^= b & -b;
      attackers |= bishopAttacks(to, occ) & bishops;
    } else if ((b = mine & bb[c8 | KNIGHT])) {
      if ((swap = SEE_VALUE[KNIGHT] - swap) < res) break;
      occ ^= b & -b;
    } else if ((b = mine & bb[c8 | BISHOP])) {
      if ((swap = SEE_VALUE[BISHOP] - swap) < res) break;
      occ ^= b & -b;
      attackers |= bishopAttacks(to, occ) & bishops;
    } else if ((b = mine & bb[c8 | ROOK])) {
      if ((swap = SEE_VALUE[ROOK] - swap) < res) break;
      occ ^= b & -b;
      attackers |= rookAttacks(to, occ) & rooks;
    } else if ((b = mine & bb[c8 | QUEEN])) {
      if ((swap = SEE_VALUE[QUEEN] - swap) < res) break;
      occ ^= b & -b;
      attackers |= (bishopAttacks(to, occ) & bishops) | (rookAttacks(to, occ) & rooks);
    } else {
      // the king takes last: it cannot if the other side still attacks the square
      return (attackers & ~bb[c8]) != 0 ? res == 0 : res != 0;
    }
  }
  return res != 0;
}
