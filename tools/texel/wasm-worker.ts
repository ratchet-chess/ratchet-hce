/**
 * One worker of the wasm adapter (wasm.ts): its own instance of a subject's build,
 * scoring every N-th loaded position into shared memory.
 */
import { parentPort, workerData } from "node:worker_threads";
import { Engine } from "../../host/wasm.ts";
import { whiteScore } from "./adapter.ts";
import { blankPosition, decodeRecord } from "./dataset.ts";

export type WorkerRequest =
  | { op: "load"; records: SharedArrayBuffer; count: number; scores: SharedArrayBuffer }
  | { op: "eval" }
  | { op: "set"; id: number; value: number }
  | { op: "reset" };

const { wasm, form, depth, defaults, index, workers } = workerData as {
  wasm: string;
  form: "static" | "search";
  depth: number;
  defaults: number[];
  index: number;
  workers: number;
};

const engine = await Engine.load(wasm);
let records: Uint8Array = new Uint8Array(0);
let scores: Float64Array = new Float64Array(0);
let count = 0;
const p = blankPosition();

parentPort!.on("message", (msg: WorkerRequest) => {
  if (msg.op === "load") {
    records = new Uint8Array(msg.records);
    scores = new Float64Array(msg.scores);
    count = msg.count;
  } else if (msg.op === "set") {
    engine.tune(msg.id, msg.value);
  } else if (msg.op === "reset") {
    for (let id = 0; id < defaults.length; id++) engine.tune(id, defaults[id]);
  } else {
    for (let n = index; n < count; n += workers) {
      decodeRecord(records, n, p);
      engine.setBoard(p.board, p.side, p.castling, p.ep, p.halfmove, p.fullmove);
      let s: number;
      if (form === "static") s = engine.evaluateCp();
      else {
        engine.go(depth);
        s = engine.score();
      }
      scores[n] = whiteScore(s, p.side);
    }
  }
  parentPort!.postMessage("done");
});
parentPort!.postMessage("ready");
