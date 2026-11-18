/**
 * Board geometry that the eval and the history share: file, rank and color masks, the
 * king's distance between two squares, and the squares a color's pawns attack.
 */
import { FILE_A } from "../../core/constants";

export const FILE_H: u64 = FILE_A << 7;
export const RANK_1: u64 = 0xff;
/** the dark squares, a1 among them */
export const DARK: u64 = 0xaa55aa55aa55aa55;

/** the king's distance between two squares: the larger of the file and the rank gap */
@inline export function distance(a: i32, b: i32): i32 {
  return max(abs((a & 7) - (b & 7)), abs((a >> 3) - (b >> 3)));
}

/** a square's rank counted from a color's own side */
@inline export function relRank(s: i32, color: i32): i32 {
  return color == 0 ? s >> 3 : 7 - (s >> 3);
}

/** the squares a color's pawns attack */
@inline export function pawnAttacks(p: u64, color: i32): u64 {
  return color == 0 ? ((p << 7) & ~FILE_H) | ((p << 9) & ~FILE_A) : ((p >> 9) & ~FILE_H) | ((p >> 7) & ~FILE_A);
}

/** the squares a color's pawns attack twice */
@inline export function pawnAttacks2(p: u64, color: i32): u64 {
  return color == 0 ? ((p << 7) & ~FILE_H) & ((p << 9) & ~FILE_A) : ((p >> 9) & ~FILE_H) & ((p >> 7) & ~FILE_A);
}
