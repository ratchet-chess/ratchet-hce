import type { PerftEngine } from "./suite.ts";
import { Engine } from "../../host/wasm.ts";

const engine = await Engine.load("core");

/** The core's move generator, with the hash updates that search needs. */
export const core: PerftEngine = {
  name: "core-wasm",
  perft: (fen, depth, mode) => engine.perft(fen, depth, mode === "bulk"),
};
