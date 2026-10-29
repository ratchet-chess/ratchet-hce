/**
 * Move budget: turns UCI `go` limits into a hard limit, and decides after each
 * iteration of the search whether the next one fits it.
 */

export interface GoLimits {
  wtime?: number;
  btime?: number;
  winc?: number;
  binc?: number;
  movestogo?: number;
  movetime?: number;
  depth?: number;
  nodes?: number;
  infinite?: boolean;
}

export interface Budget {
  /** abort the search after this many ms; no iteration starts that is predicted to end past it */
  hardMs: number;
}

/** reserved per move for process and pipe latency */
const OVERHEAD_MS = 20;

export function budget(l: GoLimits, side: number): Budget {
  if (l.infinite) return { hardMs: Infinity };
  if (l.movetime !== undefined) {
    const t = Math.max(1, l.movetime - OVERHEAD_MS);
    return { hardMs: t };
  }
  const time = side === 0 ? l.wtime : l.btime;
  if (time === undefined) return { hardMs: Infinity };
  const inc = (side === 0 ? l.winc : l.binc) ?? 0;
  const left = Math.max(1, time - OVERHEAD_MS);
  const mtg = Math.min(l.movestogo ?? 30, 30);
  // the time a move should take on average
  const target = Math.min(left / mtg + inc * 0.75, left * 0.4);
  return { hardMs: Math.max(1, Math.min(target * 4, left * 0.5)) };
}

export const MAX_DEPTH = 126;

/**
 * Tech's iteration test (Gillogly 1978): start the next iteration only if it is
 * predicted to finish within the time limit and the node limit. An iteration
 * costs its predecessor times the growth seen between the last two iterations
 * of the same parity, because odd and even depths grow by different factors
 * under alpha-beta (Tech measured seven or eight times, then three).
 */
export class IterationClock {
  /** nodes searched by the end of each iteration, from depth 1 */
  private ends: number[] = [];
  private readonly limitMs: number;
  private readonly maxNodes: number;

  constructor(limitMs: number, maxNodes: number) {
    this.limitMs = limitMs;
    this.maxNodes = maxNodes;
  }

  /** the rule that ended the search, once stopAfter has returned true, for the time log */
  reason = "";

  /** true if the search should stop after the iteration that just ended */
  stopAfter(nodes: number, ms: number): boolean {
    const e = this.ends;
    e.push(nodes);
    const n = e.length;
    const cost = (i: number) => Math.max(1, e[i] - (i > 0 ? e[i - 1] : 0));
    if (n < 2) return this.stop(nodes >= this.maxNodes || ms >= this.limitMs, "limit");
    const growth = n >= 3 ? cost(n - 2) / cost(n - 3) : cost(n - 1) / cost(n - 2);
    const next = cost(n - 1) * Math.max(2, growth);
    const perMs = nodes / Math.max(ms, 1);
    return this.stop(nodes + next > this.maxNodes || ms + next / perMs > this.limitMs, "predicted");
  }

  private stop(yes: boolean, reason: string): boolean {
    if (yes) this.reason = reason;
    return yes;
  }
}
