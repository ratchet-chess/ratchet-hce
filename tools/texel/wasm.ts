/**
 * The wasm adapter: a subject's tuning build (write.ts buildTuning) run in N worker
 * threads, each with its own instance. Positions and scores live in shared memory;
 * worker k scores positions k, k + N, k + 2N, ..., which spreads uneven search
 * costs. The map's eval form picks the score: `static` is the build's evaluate(),
 * `search` the score of go(depth), both as the host reports them (centipawns for
 * the side to move). A static score keeps the fraction of a centipawn that an
 * engine with a finer unit has.
 */
import { availableParallelism } from "node:os";
import { Worker } from "node:worker_threads";
import type { Adapter } from "./adapter.ts";
import { RECORD } from "./dataset.ts";
import type { LoadedMap } from "./map.ts";
import type { WorkerRequest } from "./wasm-worker.ts";

export class WasmAdapter implements Adapter {
  count = 0;
  private scores: Float64Array<ArrayBufferLike> = new Float64Array(0);
  private readonly workers: Worker[];

  private constructor(workers: Worker[]) {
    this.workers = workers;
  }

  /** starts `workers` threads (default: all cores but one) on the tuning build at `wasm` */
  static async open(
    wasm: string,
    m: LoadedMap,
    workers = Math.max(1, availableParallelism() - 1),
  ): Promise<WasmAdapter> {
    const form = m.map.eval.form;
    const depth = m.map.eval.depth ?? 1;
    const defaults = m.elements.map((e) => e.default);
    const list: Worker[] = [];
    await Promise.all(
      Array.from({ length: workers }, (_, index) => {
        const w = new Worker(new URL("./wasm-worker.ts", import.meta.url), {
          workerData: { wasm, form, depth, defaults, index, workers },
        });
        list.push(w);
        return new Promise<void>((resolve, reject) => {
          w.once("message", () => resolve());
          w.once("error", reject);
        });
      }),
    );
    return new WasmAdapter(list);
  }

  private call(msg: WorkerRequest): Promise<void> {
    return Promise.all(
      this.workers.map(
        (w) =>
          new Promise<void>((resolve, reject) => {
            const onError = (e: Error) => reject(e);
            w.once("error", onError);
            w.once("message", () => {
              w.off("error", onError);
              resolve();
            });
            w.postMessage(msg);
          }),
      ),
    ).then(() => undefined);
  }

  async load(records: Uint8Array, count: number): Promise<void> {
    if (!(records.buffer instanceof SharedArrayBuffer) || records.byteOffset !== 0)
      throw new Error("records must start a shared buffer (dataset.ts readDatasetRaw)");
    if (records.byteLength < count * RECORD)
      throw new Error(`${count} records do not fit in ${records.byteLength} bytes`);
    const scores = new SharedArrayBuffer(count * 8);
    this.scores = new Float64Array(scores);
    this.count = count;
    await this.call({ op: "load", records: records.buffer, count, scores });
  }

  async eval(): Promise<Float64Array> {
    await this.call({ op: "eval" });
    return this.scores.slice();
  }

  set(id: number, value: number): Promise<void> {
    return this.call({ op: "set", id, value });
  }

  reset(): Promise<void> {
    return this.call({ op: "reset" });
  }

  async close(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.terminate()));
  }
}
