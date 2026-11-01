/**
 * The Texel tuner, general over its subjects: a parameter map (tools/texel/maps/)
 * names what is tuned, and an adapter reaches the subject over wasm or UCI. Each
 * step's output is a file, the next step's input.
 *
 *   bun tools/texel/main.ts map <map.json>                  the map's elements, checked
 *   bun tools/texel/main.ts build <map.json>                the tuning build; prints its wasm
 *   bun tools/texel/main.ts write <map.json> --name <name> [--values <values.json>]
 *                                                           the tuned variant engines/<release>-<name>/
 *
 * values.json maps element names, as `map` prints them, to values.
 */
import { readFileSync } from "node:fs";
import { loadMap } from "./map.ts";
import { buildTuning, writeVariant } from "./write.ts";

const [step, mapPath, ...rest] = process.argv.slice(2);
const opt = (name: string) => (rest.includes(name) ? rest[rest.indexOf(name) + 1] : undefined);
const usage = "usage: bun tools/texel/main.ts map|build <map.json> | write <map.json> --name <name> [--values <values.json>]";
if (!step || !mapPath) {
  console.error(usage);
  process.exit(2);
}
const m = loadMap(mapPath);

if (step === "map") {
  for (const e of m.elements) {
    const slots = e.slots.map((s) => `${s.file}:${s.symbol}${s.index < 0 ? "" : `[${s.index}]`}${s.transform === "identity" ? "" : ` ${s.transform}`}`).join(" ");
    console.log(`${String(e.id).padStart(4)} ${e.name.padEnd(14)} ${String(e.default).padStart(7)} ${e.fixed ? "fixed" : `step ${e.step}`.padEnd(7)} ${e.type} ${slots}`);
  }
  const free = m.elements.filter((e) => !e.fixed).length;
  console.log(`${m.map.subject}: ${m.elements.length} elements, ${free} free, eval ${m.map.eval.form}${m.map.eval.depth ? ` ${m.map.eval.depth}` : ""}, hash ${m.hash}`);
} else if (step === "build") {
  console.log(buildTuning(m));
} else if (step === "write") {
  const name = opt("--name");
  if (!name) {
    console.error(usage);
    process.exit(2);
  }
  const valuesPath = opt("--values");
  const values = valuesPath ? (JSON.parse(readFileSync(valuesPath, "utf8")) as Record<string, number>) : {};
  console.log(writeVariant(m, name, values));
} else {
  console.error(usage);
  process.exit(2);
}
