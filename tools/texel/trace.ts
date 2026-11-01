/**
 * The probed trace: for every position, the eval as a linear function of the free
 * elements, measured through an adapter with no code in the subject (decision
 * texel-trace-probed).
 *
 * Each free element is set to its default + Δ and − Δ, every position scored each
 * time. Where the second difference |s+ − 2·s0 + s−| is within `tol` centipawns
 * (the room integer scores need), the position's coefficient is the central
 * difference (s+ − s−) / 2Δ. Otherwise the position responds to the element
 * nonlinearly there: its coefficient stays 0, the effect stays in its offset, and
 * the element's nonlinear count rises. Δ is the element's step times a factor, cut
 * to fit its bounds. The linear eval of a position is then
 *
 *   offset + Σ coefficient · value,   offset = s0 − Σ coefficient · default.
 *
 * A probed coefficient already holds whatever weights the subject applies (game
 * phase, endgame scaling), so the trace needs no field for them.
 *
 * Trace file: "TXTR", a u32 header length, a JSON header, zero padding to 8 bytes,
 * then count+1 u32 row starts, nnz u32 element ids, nnz f32 coefficients, count
 * f64 base scores (NaN for an unusable position) and count f64 offsets.
 */
import { readFileSync, writeFileSync } from "node:fs";
import type { Adapter } from "./adapter.ts";
import type { LoadedMap } from "./map.ts";

export interface ElementReport {
  name: string;
  delta: number;
  /** positions with a nonzero coefficient */
  touched: number;
  /** positions whose second difference broke the tolerance */
  nonlinear: number;
}

export interface TraceHeader {
  format: "texel-trace";
  version: 1;
  subject: string;
  mapHash: string;
  dataset: { name: string; sha256: string; count: number };
  deltaFactor: number;
  tol: number;
  count: number;
  nnz: number;
  usable: number;
  /** by element id; fixed elements are absent */
  elements: Record<number, ElementReport>;
}

export interface Trace {
  header: TraceHeader;
  rowStart: Uint32Array;
  col: Uint32Array;
  val: Float32Array;
  base: Float64Array;
  offset: Float64Array;
}

/**
 * Probes every free element of `m` through `adapter`, whose positions are loaded.
 * `log` gets the time estimate after the base eval and a line per element.
 */
export async function probe(
  adapter: Adapter,
  m: LoadedMap,
  dataset: TraceHeader["dataset"],
  opts: { deltaFactor: number; tol: number },
  log: (line: string) => void,
): Promise<Trace> {
  const count = adapter.count;
  await adapter.reset();
  const t0 = performance.now();
  const base = await adapter.eval();
  const evalMs = performance.now() - t0;
  const free = m.elements.filter((e) => !e.fixed);
  log(`${count} positions, ${free.length} free elements: ${free.length * 2} evals of about ${Math.round(evalMs)} ms, about ${Math.round((free.length * 2 * evalMs) / 60000)} min`);

  // per element, its nonzero coefficients by position
  const perElement: { id: number; pos: Uint32Array; coef: Float32Array }[] = [];
  const elements: Record<number, ElementReport> = {};
  for (const e of free) {
    const up = Math.min(e.step * opts.deltaFactor, e.max - e.default);
    const down = Math.min(e.step * opts.deltaFactor, e.default - e.min);
    const delta = Math.min(up, down);
    if (delta <= 0) {
      elements[e.id] = { name: e.name, delta: 0, touched: 0, nonlinear: 0 };
      log(`${e.name}: no room to probe within its bounds`);
      continue;
    }
    const at = async (v: number) => {
      try {
        await adapter.set(e.id, v);
        return await adapter.eval();
      } catch (err) {
        throw new Error(`${e.name} = ${v} stopped the subject: ${(err as Error).message}; give the element bounds in the map`);
      }
    };
    const plus = await at(e.default + delta);
    const minus = await at(e.default - delta);
    await adapter.set(e.id, e.default);
    const pos: number[] = [];
    const coef: number[] = [];
    let nonlinear = 0;
    for (let i = 0; i < count; i++) {
      const s0 = base[i];
      if (Number.isNaN(s0)) continue;
      const sp = plus[i];
      const sm = minus[i];
      if (Number.isNaN(sp) || Number.isNaN(sm) || Math.abs(sp - 2 * s0 + sm) > opts.tol) {
        if (sp !== s0 || sm !== s0) nonlinear++;
        continue;
      }
      const c = (sp - sm) / (2 * delta);
      if (c !== 0) {
        pos.push(i);
        coef.push(c);
      }
    }
    perElement.push({ id: e.id, pos: Uint32Array.from(pos), coef: Float32Array.from(coef) });
    elements[e.id] = { name: e.name, delta, touched: pos.length, nonlinear };
    log(`${e.name}: Δ ${delta}, ${pos.length} touched, ${nonlinear} nonlinear`);
  }

  // rows by position
  const rowCount = new Uint32Array(count + 1);
  for (const pe of perElement) for (const i of pe.pos) rowCount[i + 1]++;
  const rowStart = new Uint32Array(count + 1);
  for (let i = 0; i < count; i++) rowStart[i + 1] = rowStart[i] + rowCount[i + 1];
  const nnz = rowStart[count];
  const col = new Uint32Array(nnz);
  const val = new Float32Array(nnz);
  const fill = rowStart.slice(0, count);
  for (const pe of perElement) {
    for (let k = 0; k < pe.pos.length; k++) {
      const at = fill[pe.pos[k]]++;
      col[at] = pe.id;
      val[at] = pe.coef[k];
    }
  }
  const defaults = Float64Array.from(m.elements.map((e) => e.default));
  const offset = new Float64Array(count);
  let usable = 0;
  for (let i = 0; i < count; i++) {
    if (Number.isNaN(base[i])) {
      offset[i] = NaN;
      continue;
    }
    usable++;
    let s = base[i];
    for (let k = rowStart[i]; k < rowStart[i + 1]; k++) s -= val[k] * defaults[col[k]];
    offset[i] = s;
  }
  const header: TraceHeader = {
    format: "texel-trace",
    version: 1,
    subject: m.map.subject,
    mapHash: m.hash,
    dataset,
    deltaFactor: opts.deltaFactor,
    tol: opts.tol,
    count,
    nnz,
    usable,
    elements,
  };
  return { header, rowStart, col, val, base, offset };
}

/** the linear eval of every position at element values `theta` (indexed by element id), into `out` */
export function linearEval(t: Trace, theta: Float64Array, out = new Float64Array(t.header.count)): Float64Array {
  const { rowStart, col, val, offset } = t;
  for (let i = 0; i < t.header.count; i++) {
    let s = offset[i];
    for (let k = rowStart[i]; k < rowStart[i + 1]; k++) s += val[k] * theta[col[k]];
    out[i] = s;
  }
  return out;
}

export function writeTrace(path: string, t: Trace): void {
  const json = Buffer.from(JSON.stringify(t.header));
  const start = Math.ceil((8 + json.length) / 8) * 8;
  const parts = [t.rowStart, t.col, t.val, t.base, t.offset].map((a) => Buffer.from(a.buffer, a.byteOffset, a.byteLength));
  const head = Buffer.alloc(start);
  head.write("TXTR", 0, "latin1");
  head.writeUInt32LE(json.length, 4);
  json.copy(head, 8);
  // f64 arrays must start on 8 bytes; pad after the u32 and f32 parts
  const pad = (n: number) => Buffer.alloc((8 - (n % 8)) % 8);
  const out: Buffer[] = [head];
  let at = start;
  for (const p of parts) {
    out.push(p);
    at += p.length;
    const z = pad(at);
    out.push(z);
    at += z.length;
  }
  writeFileSync(path, Buffer.concat(out));
}

export function readTrace(path: string): Trace {
  const buf = readFileSync(path);
  if (buf.toString("latin1", 0, 4) !== "TXTR") throw new Error(`${path} is not a Texel trace`);
  const len = buf.readUInt32LE(4);
  const header = JSON.parse(buf.toString("utf8", 8, 8 + len)) as TraceHeader;
  let at = Math.ceil((8 + len) / 8) * 8;
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const take = <T>(make: (b: ArrayBuffer, o: number, n: number) => T, n: number, bytes: number): T => {
    const a = make(ab, at, n);
    at += n * bytes;
    at += (8 - (at % 8)) % 8;
    return a;
  };
  const rowStart = take((b, o, n) => new Uint32Array(b, o, n), header.count + 1, 4);
  const col = take((b, o, n) => new Uint32Array(b, o, n), header.nnz, 4);
  const val = take((b, o, n) => new Float32Array(b, o, n), header.nnz, 4);
  const base = take((b, o, n) => new Float64Array(b, o, n), header.count, 8);
  const offset = take((b, o, n) => new Float64Array(b, o, n), header.count, 8);
  return { header, rowStart, col, val, base, offset };
}
