/**
 * The optimizer: Texel's loss and the two ways down it (decision texel-local-search).
 *
 * Loss: the mean of (result − σ(score))² over positions with a result label, where
 * σ(s) = 1 / (1 + 10^(−K·s/400)), s in centipawns from White's view and the result
 * from White's view (1, 1/2, 0, or a mean where a position repeated). K is fitted
 * first, at the defaults, and then held.
 *
 * - adam: full-batch Adam over a trace's linear eval (trace.ts). Each element's
 *   learning rate is `alpha` times its step, so elements in different units move
 *   alike. Values are clamped to their bounds every step. The validation loss is
 *   read every epoch; the best epoch's values are kept, and the run stops after
 *   `patience` epochs without a better one.
 * - local: Österlund's local search (2014): for each free element in turn, one
 *   step up, kept if the loss drops, else one step down, kept if it drops; passes
 *   repeat until one changes nothing. Over a trace, a try updates only the positions
 *   the element touches. Through an adapter, a try is one eval of every position.
 */
import type { Adapter } from "./adapter.ts";
import type { LoadedMap } from "./map.ts";
import { type Trace, linearEval } from "./trace.ts";

export interface Labels {
  /** result from White's view, NaN when the position has none or no usable score */
  result: Float64Array;
  valid: Uint8Array;
}

const LN10 = Math.log(10);

export function sigma(s: number, K: number): number {
  return 1 / (1 + Math.pow(10, (-K * s) / 400));
}

/** the loss over training (valid false) or validation (valid true) positions with a label and a score */
export function loss(scores: Float64Array, labels: Labels, K: number, valid: boolean): number {
  let sum = 0;
  let n = 0;
  for (let i = 0; i < scores.length; i++) {
    const r = labels.result[i];
    const s = scores[i];
    if (Number.isNaN(r) || Number.isNaN(s) || (labels.valid[i] === 1) !== valid) continue;
    const e = r - sigma(s, K);
    sum += e * e;
    n++;
  }
  return n ? sum / n : NaN;
}

/** the K that minimizes the training loss of `scores`: golden-section search over log K */
export function fitK(scores: Float64Array, labels: Labels): number {
  let lo = Math.log(0.01);
  let hi = Math.log(10);
  const f = (x: number) => loss(scores, labels, Math.exp(x), false);
  const g = (Math.sqrt(5) - 1) / 2;
  let a = hi - g * (hi - lo);
  let b = lo + g * (hi - lo);
  let fa = f(a);
  let fb = f(b);
  for (let i = 0; i < 80; i++) {
    if (fa < fb) {
      hi = b;
      b = a;
      fb = fa;
      a = hi - g * (hi - lo);
      fa = f(a);
    } else {
      lo = a;
      a = b;
      fa = fb;
      b = lo + g * (hi - lo);
      fb = f(b);
    }
  }
  return Math.exp((lo + hi) / 2);
}

export interface Progress {
  epoch: number;
  train: number;
  valid: number;
}

/** the elements a run tunes: free in the map, and touched by at least `minTouch` positions in the trace */
export function tunable(m: LoadedMap, t: Trace | undefined, minTouch: number): number[] {
  return m.elements.filter((e) => !e.fixed && (!t || (t.header.elements[e.id]?.touched ?? 0) >= minTouch)).map((e) => e.id);
}

export function adam(
  t: Trace,
  m: LoadedMap,
  labels: Labels,
  K: number,
  ids: number[],
  opts: { alpha: number; epochs: number; patience: number },
  log: (p: Progress) => void,
): { theta: Float64Array; best: Progress } {
  const n = t.header.count;
  const theta = Float64Array.from(m.elements.map((e) => e.default));
  const lr = Float64Array.from(m.elements.map((e) => opts.alpha * e.step));
  const tuned = new Uint8Array(m.elements.length);
  for (const id of ids) tuned[id] = 1;
  const mom = new Float64Array(m.elements.length);
  const vel = new Float64Array(m.elements.length);
  const grad = new Float64Array(m.elements.length);
  const scores = new Float64Array(n);
  const b1 = 0.9;
  const b2 = 0.999;
  let best: Progress = { epoch: 0, train: Infinity, valid: Infinity };
  let bestTheta = theta.slice();
  for (let epoch = 1; epoch <= opts.epochs; epoch++) {
    linearEval(t, theta, scores);
    grad.fill(0);
    let count = 0;
    for (let i = 0; i < n; i++) {
      const r = labels.result[i];
      if (Number.isNaN(r) || Number.isNaN(scores[i]) || labels.valid[i]) continue;
      count++;
      const sg = sigma(scores[i], K);
      // d/ds of (r − σ)²
      const g = -2 * (r - sg) * sg * (1 - sg) * LN10 * (K / 400);
      for (let k = t.rowStart[i]; k < t.rowStart[i + 1]; k++) grad[t.col[k]] += g * t.val[k];
    }
    for (const id of ids) {
      const gr = grad[id] / count;
      mom[id] = b1 * mom[id] + (1 - b1) * gr;
      vel[id] = b2 * vel[id] + (1 - b2) * gr * gr;
      const mh = mom[id] / (1 - Math.pow(b1, epoch));
      const vh = vel[id] / (1 - Math.pow(b2, epoch));
      const e = m.elements[id];
      theta[id] = Math.min(e.max, Math.max(e.min, theta[id] - (lr[id] * mh) / (Math.sqrt(vh) + 1e-12)));
    }
    linearEval(t, theta, scores);
    const p = { epoch, train: loss(scores, labels, K, false), valid: loss(scores, labels, K, true) };
    if (p.valid < best.valid) {
      best = p;
      bestTheta = theta.slice();
    }
    if (epoch % 50 === 0 || epoch === 1) log(p);
    if (epoch - best.epoch >= opts.patience) break;
  }
  return { theta: bestTheta, best };
}

/** a loss that a local search can probe: the loss after setting element `id` to `value` */
export interface LocalTarget {
  /** the training loss with `id` at `value` and every other element as kept so far */
  tryValue(id: number, value: number): Promise<number>;
  /** keeps `id` at `value` */
  keep(id: number, value: number): Promise<void>;
  /** the training and validation losses as kept */
  losses(): Promise<{ train: number; valid: number }>;
}

/** the local search over a trace: a try updates only the positions element `id` touches */
export function traceTarget(t: Trace, m: LoadedMap, labels: Labels, K: number): LocalTarget {
  const n = t.header.count;
  const theta = Float64Array.from(m.elements.map((e) => e.default));
  const scores = linearEval(t, theta);
  // columns: for each element, the positions and coefficients it touches
  const colStart = new Uint32Array(m.elements.length + 1);
  for (let k = 0; k < t.col.length; k++) colStart[t.col[k] + 1]++;
  for (let e = 0; e < m.elements.length; e++) colStart[e + 1] += colStart[e];
  const colPos = new Uint32Array(t.col.length);
  const colVal = new Float32Array(t.col.length);
  const fill = colStart.slice(0, m.elements.length);
  for (let i = 0; i < n; i++) {
    for (let k = t.rowStart[i]; k < t.rowStart[i + 1]; k++) {
      const at = fill[t.col[k]]++;
      colPos[at] = i;
      colVal[at] = t.val[k];
    }
  }
  const term = (i: number, s: number) => {
    const r = labels.result[i];
    if (Number.isNaN(r) || Number.isNaN(s) || labels.valid[i]) return 0;
    const e = r - sigma(s, K);
    return e * e;
  };
  let trainCount = 0;
  let total = 0;
  for (let i = 0; i < n; i++) {
    if (!Number.isNaN(labels.result[i]) && !Number.isNaN(scores[i]) && !labels.valid[i]) trainCount++;
    total += term(i, scores[i]);
  }
  const delta = (id: number, value: number) => {
    const d = value - theta[id];
    let change = 0;
    for (let k = colStart[id]; k < colStart[id + 1]; k++) {
      const i = colPos[k];
      change += term(i, scores[i] + colVal[k] * d) - term(i, scores[i]);
    }
    return change;
  };
  return {
    tryValue: async (id, value) => (total + delta(id, value)) / trainCount,
    keep: async (id, value) => {
      total += delta(id, value);
      const d = value - theta[id];
      for (let k = colStart[id]; k < colStart[id + 1]; k++) scores[colPos[k]] += colVal[k] * d;
      theta[id] = value;
    },
    losses: async () => ({ train: total / trainCount, valid: loss(scores, labels, K, true) }),
  };
}

/** the local search through an adapter: every try is one true eval of every position */
export function adapterTarget(adapter: Adapter, m: LoadedMap, labels: Labels, K: number): LocalTarget {
  const kept = Float64Array.from(m.elements.map((e) => e.default));
  return {
    tryValue: async (id, value) => {
      await adapter.set(id, value);
      const l = loss(await adapter.eval(), labels, K, false);
      await adapter.set(id, kept[id]);
      return l;
    },
    keep: async (id, value) => {
      kept[id] = value;
      await adapter.set(id, value);
    },
    losses: async () => {
      const s = await adapter.eval();
      return { train: loss(s, labels, K, false), valid: loss(s, labels, K, true) };
    },
  };
}

export async function localSearch(
  target: LocalTarget,
  m: LoadedMap,
  ids: number[],
  opts: { maxPasses: number },
  log: (line: string) => void,
): Promise<Float64Array> {
  const theta = Float64Array.from(m.elements.map((e) => e.default));
  let best = (await target.losses()).train;
  for (let pass = 1; pass <= opts.maxPasses; pass++) {
    let changed = 0;
    for (const id of ids) {
      const e = m.elements[id];
      for (const dir of [1, -1]) {
        const v = theta[id] + dir * e.step;
        if (v > e.max || v < e.min) continue;
        const l = await target.tryValue(id, v);
        if (l < best) {
          best = l;
          theta[id] = v;
          await target.keep(id, v);
          changed++;
          break;
        }
      }
    }
    const { train, valid } = await target.losses();
    log(`pass ${pass}: ${changed} changed, train ${train.toFixed(6)}, valid ${valid.toFixed(6)}`);
    if (!changed) break;
  }
  return theta;
}
