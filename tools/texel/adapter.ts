/**
 * The adapter: the only part of the tuner that knows a subject. The tuner reaches
 * every subject through this interface, whatever it runs on (wasm or UCI).
 *
 * Scores are centipawns from White's view. A position the subject cannot score
 * usefully, a mate score among them, is NaN, and the tuner leaves it out.
 */
import { MATE } from "../../host/wasm.ts";

export interface Adapter {
  /** the positions loaded, which every eval scores in order */
  readonly count: number;
  /** loads `count` packed dataset records (tools/texel/dataset.ts), replacing any loaded before */
  load(records: Uint8Array, count: number): Promise<void>;
  /** scores every loaded position with the elements as set now */
  eval(): Promise<Float64Array>;
  /** sets tuned element `id` (tools/texel/map.ts) to `value` */
  set(id: number, value: number): Promise<void>;
  /** sets every element back to its default */
  reset(): Promise<void>;
  close(): Promise<void>;
}

/** a host score (centipawns for the side to move, mates near ±MATE) as the adapter's White-view score */
export function whiteScore(hostScore: number, side: number): number {
  if (Math.abs(hostScore) >= MATE - 1000) return NaN;
  return side ? -hostScore : hostScore;
}
