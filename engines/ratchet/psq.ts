/**
 * Material and piece-square tables: each piece's packed value on each square, read
 * from params.ts, and the board's sum of them. state.ts keeps the sum incrementally;
 * scratchPsq recomputes it, so a tuning build that sets a table at run time is scored
 * with its new values.
 */
import { BISHOP, KING, KNIGHT, PAWN, QUEEN, ROOK } from "../../core/constants";
import { board } from "../../core/position";
import {
  BISHOP_EG, BISHOP_MG, KING_EG, KING_MG, KNIGHT_EG, KNIGHT_MG, MAT_EG, MAT_MG, PAWN_EG, PAWN_MG, QUEEN_EG, QUEEN_MG, ROOK_EG, ROOK_MG,
} from "./params";
import { S } from "./score";

/** material plus PSQT per piece code and square, White's view: piece code << 6 | square */
export const PSQ = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * 16 * 64));

function tableMg(type: i32, s: i32): i32 {
  switch (type) {
    case PAWN: return PAWN_MG[s];
    case KNIGHT: return KNIGHT_MG[s];
    case BISHOP: return BISHOP_MG[s];
    case ROOK: return ROOK_MG[s];
    case QUEEN: return QUEEN_MG[s];
    default: return KING_MG[s];
  }
}

function tableEg(type: i32, s: i32): i32 {
  switch (type) {
    case PAWN: return PAWN_EG[s];
    case KNIGHT: return KNIGHT_EG[s];
    case BISHOP: return BISHOP_EG[s];
    case ROOK: return ROOK_EG[s];
    case QUEEN: return QUEEN_EG[s];
    default: return KING_EG[s];
  }
}

/** a piece's packed value on a square, read from params.ts: White's at s, Black's mirrored and negated */
function pieceValue(p: i32, s: i32): i32 {
  const type = p & 7;
  const rel = p & 8 ? s ^ 56 : s;
  const v = S(MAT_MG[type] + tableMg(type, rel), MAT_EG[type] + tableEg(type, rel));
  return p & 8 ? -v : v;
}

/** fills PSQ from params.ts */
export function initPsq(): void {
  for (let type = PAWN; type <= KING; type++) {
    for (let s = 0; s < 64; s++) {
      PSQ[(type << 6) + s] = pieceValue(type, s);
      PSQ[((8 | type) << 6) + s] = pieceValue(8 | type, s);
    }
  }
}

/** the packed material and PSQT sum of the board, from params.ts */
export function scratchPsq(): i32 {
  let v = 0;
  for (let s = 0; s < 64; s++) {
    const p = <i32>board[s];
    if (p) v += pieceValue(p, s);
  }
  return v;
}
