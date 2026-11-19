/**
 * Makes a map's tuning build for the testing platform (tools/tree.sh): build/ratchet-spsa.wasm, and
 * tunables.json at the root, which ratchet-bench's tools/spsa.ts reads in place of the map. Each entry has the
 * element's name, id, value and bounds, and for a flag its off value and its block, which a screen moves together.
 *
 *   bun tools/tuning-build.ts <map.json>
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { loadMap } from "./texel/map.ts";
import { buildTuning } from "./texel/write.ts";

const [mapPath] = process.argv.slice(2);
if (!mapPath) throw new Error("usage: bun tools/tuning-build.ts <map.json>");
const map = loadMap(mapPath);
const wasm = buildTuning(map);
const root = join(import.meta.dirname, "..");
mkdirSync(join(root, "build"), { recursive: true });
copyFileSync(wasm, join(root, "build/ratchet-spsa.wasm"));
const tunables: { name: string }[] = JSON.parse(readFileSync(join(dirname(wasm), "tunables.json"), "utf8"));
const flags = new Map(map.elements.map((e) => [e.name, e]));
writeFileSync(join(root, "tunables.json"), `${JSON.stringify(tunables.map((t) => {
  const e = flags.get(t.name)!;
  return { ...t, ...(e.off === undefined ? {} : { off: e.off }), ...(e.block === undefined ? {} : { block: e.block }) };
}), null, 1)}\n`);
