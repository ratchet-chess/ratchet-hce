/**
 * The Texel tuner, general over its subjects: a parameter map (tools/texel/maps/)
 * names what is tuned, and an adapter reaches the subject over wasm or UCI. Each
 * step's output is a file under tmp/texel/, the next step's input.
 *
 *   bun tools/texel/main.ts map <map.json>                  the map's elements, checked
 *   bun tools/texel/main.ts build <map.json>                the tuning build; prints its wasm
 *   bun tools/texel/main.ts write <map.json> --name <name> [--values <values.json>]
 *                                                           the tuned variant engines/<release>-<name>/
 *   bun tools/texel/main.ts dataset --set <name> [--valid <permille>] [--limit <n>]
 *                                                           tmp/texel/datasets/<set>.bin
 *   bun tools/texel/main.ts resolve <dataset.bin>           <set>.resolved.bin, by the neutral resolver
 *   bun tools/texel/main.ts info <dataset.bin>              a dataset's header and label counts
 *
 * values.json maps element names, as `map` prints them, to values.
 *
 * `dataset` reads only sets in tools/texel/sets.json, the allow-list of sets with
 * open terms. Their downloads are in the workspace volume, so it runs there:
 *
 *   bun tools/ws.ts fetch <url> <sha256>          once per set, as sets.json pins it
 *   bun tools/ws.ts run -- bun tools/texel/main.ts dataset --set <name>
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { Engine } from "../../host/wasm.ts";
import { type Position, type SetEntry, mergeAndSplit, readDataset, readSet, resolveAll, sha256, writeDataset } from "./dataset.ts";
import { loadMap } from "./map.ts";
import { buildTuning, writeVariant } from "./write.ts";

const REPO = new URL("../../", import.meta.url).pathname;
const DATASETS = join(REPO, "tmp", "texel", "datasets");
const DOWNLOADS = "/ws/downloads";

const [step, ...rest] = process.argv.slice(2);
const opt = (name: string) => (rest.includes(name) ? rest[rest.indexOf(name) + 1] : undefined);
const positional = rest[0] && !rest[0].startsWith("--") ? rest[0] : undefined;
const usage = "usage: bun tools/texel/main.ts map|build <map.json> | write <map.json> --name <name> [--values <values.json>] | dataset --set <name> [--valid <permille>] [--limit <n>] | resolve <dataset.bin> | info <dataset.bin>";
const die = (msg: string): never => {
  console.error(msg);
  process.exit(2);
};

if (step === "map" || step === "build" || step === "write") {
  const m = loadMap(positional ?? die(usage));
  if (step === "map") {
    for (const e of m.elements) {
      const slots = e.slots.map((s) => `${s.file}:${s.symbol}${s.index < 0 ? "" : `[${s.index}]`}${s.transform === "identity" ? "" : ` ${s.transform}`}`).join(" ");
      console.log(`${String(e.id).padStart(4)} ${e.name.padEnd(14)} ${String(e.default).padStart(7)} ${e.fixed ? "fixed" : `step ${e.step}`.padEnd(7)} ${e.type} ${slots}`);
    }
    const free = m.elements.filter((e) => !e.fixed).length;
    console.log(`${m.map.subject}: ${m.elements.length} elements, ${free} free, eval ${m.map.eval.form}${m.map.eval.depth ? ` ${m.map.eval.depth}` : ""}, hash ${m.hash}`);
  } else if (step === "build") {
    console.log(buildTuning(m));
  } else {
    const name = opt("--name") ?? die(usage);
    const valuesPath = opt("--values");
    const values = valuesPath ? (JSON.parse(readFileSync(valuesPath, "utf8")) as Record<string, number>) : {};
    console.log(writeVariant(m, name, values));
  }
} else if (step === "dataset") {
  const sets = JSON.parse(readFileSync(join(REPO, "tools", "texel", "sets.json"), "utf8")) as SetEntry[];
  const name = opt("--set") ?? die(usage);
  const set = sets.find((s) => s.name === name) ?? die(`${name} is not in tools/texel/sets.json, the allow-list`);
  const archive = join(DOWNLOADS, set.archive);
  if (!existsSync(archive)) die(`${archive} is missing: bun tools/ws.ts fetch ${set.url} ${set.sha256}`);
  const seen = sha256(archive);
  if (seen !== set.sha256) die(`${archive} has sha256 ${seen}, not the pinned ${set.sha256}`);
  let file = archive;
  if (set.member) {
    const dir = join(DOWNLOADS, set.name);
    file = join(dir, set.member);
    if (!existsSync(file)) {
      mkdirSync(dir, { recursive: true });
      const r = spawnSync("bsdtar", ["-xf", archive, "-C", dir, set.member], { encoding: "utf8" });
      if (r.status !== 0) die(`bsdtar failed: ${r.stderr}`);
    }
  }
  const validPermille = Number(opt("--valid") ?? 100);
  const limit = Number(opt("--limit") ?? Infinity);
  const core = await Engine.load("core");
  const read: Position[] = [];
  for await (const p of readSet(file, set.format, set.options ?? {}, core)) {
    read.push(p);
    if (read.length >= limit) break;
  }
  const { positions, merged } = mergeAndSplit(read, validPermille);
  mkdirSync(DATASETS, { recursive: true });
  const out = join(DATASETS, `${set.name}${Number.isFinite(limit) ? `-${limit}` : ""}.bin`);
  writeDataset(out, {
    name: basename(out, ".bin"),
    source: { set: set.name, url: set.url, sha256: set.sha256, license: set.license, member: set.member, reader: set.format, options: set.options },
    validPermille,
    resolver: "none",
    counts: { read: read.length, mergedAway: merged, output: positions.length, validation: positions.filter((p) => p.valid).length },
  }, positions);
  console.log(`${out}: ${read.length} read, ${merged} merged away, ${positions.length} kept`);
} else if (step === "resolve") {
  const path = positional ?? die(usage);
  const { header, positions } = readDataset(path);
  if (header.resolver !== "none") die(`${path} is already resolved`);
  const core = await Engine.load("core");
  const { positions: resolved, counts } = resolveAll(positions, header.validPermille, core);
  const out = path.replace(/\.bin$/, ".resolved.bin");
  writeDataset(out, { ...header, name: `${header.name}.resolved`, resolver: "neutral", counts: { ...header.counts, ...Object.fromEntries(Object.entries(counts).map(([k, v]) => [`resolve.${k}`, v])) } }, resolved);
  console.log(`${out}: ${JSON.stringify(counts)}`);
} else if (step === "info") {
  const { header, positions } = readDataset(positional ?? die(usage));
  const results = new Map<number, number>();
  for (const p of positions) results.set(p.result, (results.get(p.result) ?? 0) + 1);
  console.log(JSON.stringify(header, null, 2));
  console.log(`results: ${[...results].sort((a, b) => a[0] - b[0]).map(([r, n]) => `${Number.isNaN(r) ? "none" : r}: ${n}`).join(", ")}`);
  console.log(`scores: ${positions.filter((p) => !Number.isNaN(p.score)).length}; validation: ${positions.filter((p) => p.valid).length}`);
} else {
  die(usage);
}
