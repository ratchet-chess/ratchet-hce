/**
 * Prints the core's leaf count for one position, as one line of digits. The own engine plays with the core's move
 * generator, so this is its perft. The testing platform's perft check asks it through the tree's launcher
 * (engine.json's perft entry).
 *
 *   bun host/perft.ts <depth> "<fen>"     (or node)
 */
import { Engine } from "./wasm.ts";

const [depth, fen] = process.argv.slice(2);
if (!fen || !/^\d+$/.test(depth ?? "")) throw new Error('usage: host/perft.ts <depth> "<fen>"');
const core = await Engine.load("core");
console.log(core.perft(fen, Number(depth), true));
