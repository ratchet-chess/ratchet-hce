/**
 * The eval's packed score: a (middlegame, endgame) pair in one i32, the endgame in the
 * high half (Stockfish 11 Score). Sums and differences of packed pairs stay exact while
 * each half stays within i16.
 */

/** a packed pair */
@inline export function S(mg: i32, eg: i32): i32 {
  return (eg << 16) + mg;
}

@inline export function mgOf(s: i32): i32 {
  return <i32><i16>s;
}

@inline export function egOf(s: i32): i32 {
  return <i32><i16>((s + 0x8000) >> 16);
}
