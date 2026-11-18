/**
 * The Texel tuner, general over its subjects: a parameter map (tools/texel/maps/)
 * names what is tuned, and an adapter reaches the subject over wasm or UCI. Each
 * step's output is a file under tmp/texel/, the next step's input.
 *
 *   bun tools/texel/main.ts map <map.json>                  the map's elements, checked
 *   bun tools/texel/main.ts build <map.json>                the tuning build; prints its wasm
 *   bun tools/texel/main.ts write <map.json> --name <name> [--values <values.json>]
 *                                                           the tuned variant engines/<release>-<name>/
 *   bun tools/texel/main.ts write <map.json> --in-place --values <values.json>
 *                                                           the own engine's values, written into its own files
 *   bun tools/texel/main.ts dataset --set <name> [--valid <permille>] [--limit <n>]
 *                                                           tmp/texel/datasets/<set>.bin
 *   bun tools/texel/main.ts dataset --pgn <file> --name <name> [--opt <key>=<value> ...] [--valid <permille>] [--limit <n>]
 *                                                           the same from games Ratchet played itself, such
 *                                                           as self-play (pgn reader options, dataset.ts)
 *   bun tools/texel/main.ts resolve <dataset.bin>           <set>.resolved.bin, by the neutral resolver
 *   bun tools/texel/main.ts join <a.bin> <b.bin>... --name <name>
 *                                                           one dataset from several of one resolver and
 *                                                           validation share, repeats merged as in dataset
 *   bun tools/texel/main.ts info <dataset.bin>              a dataset's header and label counts
 * eval, trace and tune take this host's cores, so each runs under a batch allocation
 * of the CPU manager's queue (tools/queue.ts alloc, decision batch-hold): it starts
 * once no wall-clock match plays here, and none starts beside it. An allocation waits
 * behind the jobs queued before it; QUEUE_PRIORITY above 0 puts it ahead, which
 * needs the user's word or the CPU owner's.
 *
 * eval, trace and tune take --adapter wasm (default; --workers <n>) or uci
 * (--processes <n>, default 8; the map's uci section, uci.ts).
 *
 *   bun tools/texel/main.ts eval <map.json> <dataset.bin> [--workers <n>] [--limit <n>]
 *                                                           scores every position at the map's defaults, timed
 *   bun tools/texel/main.ts trace <map.json> <dataset.bin> [--workers <n>] [--sample <permille>] [--limit <n>] [--delta <factor>] [--tol <cp>]
 *                                                           the probed trace, tmp/texel/traces/; reused when present
 *   bun tools/texel/main.ts tune <map.json> <dataset.bin> --optimizer adam|local [--over trace|adapter]
 *       [--workers <n>] [--sample <permille>] [--limit <n>] [--delta <factor>] [--tol <cp>] [--min-touch <n>]
 *       [--alpha <a>] [--epochs <n>] [--patience <n>] [--passes <n>] [--grow <steps>] [--from <values.json>] [--k <K>]
 *                                                           a run: K, the optimizer, the rounded values verified
 *                                                           through the adapter; tmp/texel/runs/ and results/tuning.md.
 *                                                           local saves its values after every pass, so a stopped
 *                                                           run keeps them, and --from resumes from them
 *
 * A tune fits K at the defaults, unless --k or the map's `k` gives it. A subject whose
 * search margins depend on its eval's scale holds K, so a retune does not move the scale.
 *
 * --sample keeps an even share of a dataset's positions, chosen by a hash of each
 * record; --limit then takes the first n of those.
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
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { Engine } from "../../host/wasm.ts";
import { type Position, RECORD, type SetEntry, blankPosition, decodeRecord, mergeAndSplit, readDataset, readDatasetRaw, readSet, resolveAll, sampleRecords, sha256, writeDataset } from "./dataset.ts";
import type { Adapter } from "./adapter.ts";
import type { LoadedMap } from "./map.ts";
import { loadMap } from "./map.ts";
import { type Labels, adam, adapterTarget, fitK, localSearch, loss, traceTarget, tunable } from "./optimize.ts";
import { type Trace, linearEval, probe, readTrace, writeTrace } from "./trace.ts";
import { UciAdapter } from "./uci.ts";
import { WasmAdapter } from "./wasm.ts";
import { buildTuning, storable, writeInPlace, writeVariant } from "./write.ts";

const REPO = new URL("../../", import.meta.url).pathname;
const DATASETS = join(REPO, "tmp", "texel", "datasets");
const DOWNLOADS = "/ws/downloads";

/** the testing platform's checkout, which holds the queue: BENCH in the gitignored tools/local.env */
function bench(): string {
  const m = /^BENCH=(.+)$/m.exec(readFileSync(join(REPO, "tools", "local.env"), "utf8"));
  if (!m) throw new Error("tools/local.env has no BENCH, the path of the testing platform's checkout");
  return m[1].trim();
}

const [step, ...rest] = process.argv.slice(2);
if (["eval", "trace", "tune"].includes(step) && !process.env.QUEUE_ALLOC) {
  const held = spawnSync("bun", [join(bench(), "tools", "queue.ts"), "alloc", "--kind", "batch", "--name", `texel-${step}`,
    "--priority", process.env.QUEUE_PRIORITY ?? "0", "--", process.execPath, ...process.argv.slice(1)], { stdio: "inherit" });
  process.exit(held.status ?? 1);
}
const opt = (name: string) => (rest.includes(name) ? rest[rest.indexOf(name) + 1] : undefined);
const positional = rest[0] && !rest[0].startsWith("--") ? rest[0] : undefined;
const usage = "usage: bun tools/texel/main.ts map|build <map.json> | write <map.json> --name <name> | --in-place [--values <values.json>] | dataset --set <name> | --pgn <file> --name <name> [--opt <key>=<value> ...] [--valid <permille>] [--limit <n>] | resolve <dataset.bin> | join <a.bin> <b.bin>... --name <name> | info <dataset.bin> | eval|trace <map.json> <dataset.bin> [--workers <n>] [--limit <n>] [--delta <factor>] [--tol <cp>] | tune <map.json> <dataset.bin> --optimizer adam|local [...] (see the header)";
const die = (msg: string): never => {
  console.error(msg);
  process.exit(2);
};

/**
 * The adapter --adapter names (wasm, the default, or uci), with the first `count`
 * records loaded. A uci adapter starts --processes engines from the map's uci
 * section; for a Ratchet release, {build} and {tunables} are its tuning build.
 */
async function openAdapter(m: LoadedMap, records: Uint8Array, count: number): Promise<Adapter> {
  const kind = opt("--adapter") ?? "wasm";
  let a: Adapter;
  if (kind === "uci") {
    const wasm = m.map.release ? buildTuning(m) : "";
    a = await UciAdapter.open(m, Number(opt("--processes") ?? 8), wasm ? { build: wasm, tunables: join(dirname(wasm), "tunables.json") } : {});
  } else if (kind === "wasm") {
    a = await WasmAdapter.open(buildTuning(m), m, opt("--workers") ? Number(opt("--workers")) : undefined);
  } else return die("--adapter wasm or uci");
  await a.load(records, count);
  return a;
}

/** the trace of `m` over the positions of a dataset the adapter holds, read when present, else probed through `adapter`; `subset` names a sample or limit */
async function ensureTrace(m: LoadedMap, dsPath: string, name: string, count: number, subset: string, adapter: Adapter, deltaFactor: number, tol: number): Promise<Trace> {
  // a trace depends on the build (m.hash), the dataset, and the code that probes and scores
  const code = createHash("sha256");
  for (const f of ["trace.ts", "adapter.ts", "wasm.ts", "wasm-worker.ts", "uci.ts", "dataset.ts"]) code.update(readFileSync(join(REPO, "tools", "texel", f)));
  const dir = join(REPO, "tmp", "texel", "traces");
  const out = join(dir, `${m.map.subject}-${m.hash}-${code.digest("hex").slice(0, 8)}-${opt("--adapter") ?? "wasm"}-${name}${subset}-d${deltaFactor}-t${tol}.trace`);
  if (existsSync(out)) {
    const t = readTrace(out);
    console.log(`${out}: reused, ${t.header.usable} usable positions, ${t.header.nnz} coefficients`);
    return t;
  }
  const t = await probe(adapter, m, { name, sha256: sha256(dsPath), count }, { deltaFactor, tol }, (l) => console.log(l));
  mkdirSync(dir, { recursive: true });
  writeTrace(out, t);
  console.log(`${out}: ${t.header.usable} usable positions, ${t.header.nnz} coefficients`);
  return t;
}

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
    const valuesPath = opt("--values");
    const values = valuesPath ? (JSON.parse(readFileSync(valuesPath, "utf8")) as Record<string, number>) : {};
    if (rest.includes("--in-place")) console.log(writeInPlace(m, values).join("\n"));
    else console.log(writeVariant(m, opt("--name") ?? die(usage), values));
  }
} else if (step === "dataset") {
  let set: SetEntry;
  let file: string;
  const pgn = opt("--pgn");
  if (pgn) {
    // A set Ratchet made itself, such as a release's self-play games: it has no
    // outside terms, so it is not on the allow-list.
    file = resolve(pgn);
    const options = Object.fromEntries(rest.flatMap((a, i) => (a === "--opt" ? [rest[i + 1].split("=")] : [])).map(([k, v]) => [k, Number.isNaN(Number(v)) ? v : Number(v)]));
    set = { name: opt("--name") ?? die(usage), url: `file:${relative(REPO, file)}`, sha256: sha256(file), license: "Ratchet's own games", archive: basename(file), format: "pgn", options };
  } else {
    const sets = JSON.parse(readFileSync(join(REPO, "tools", "texel", "sets.json"), "utf8")) as SetEntry[];
    const name = opt("--set") ?? die(usage);
    set = sets.find((s) => s.name === name) ?? die(`${name} is not in tools/texel/sets.json, the allow-list`);
    const archive = join(DOWNLOADS, set.archive);
    if (!existsSync(archive)) die(`${archive} is missing: bun tools/ws.ts fetch ${set.url} ${set.sha256}`);
    const seen = sha256(archive);
    if (seen !== set.sha256) die(`${archive} has sha256 ${seen}, not the pinned ${set.sha256}`);
    file = archive;
  }
  if (set.member) {
    const archive = file;
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
} else if (step === "join") {
  const name = opt("--name") ?? die(usage);
  const paths = rest.filter((a, i) => !a.startsWith("--") && rest[i - 1] !== "--name");
  if (paths.length < 2) die(usage);
  const parts = paths.map((path) => ({ path, ...readDataset(path) }));
  const { resolver, validPermille } = parts[0].header;
  for (const p of parts) {
    if (p.header.resolver !== resolver || p.header.validPermille !== validPermille) die(`${p.path}: its resolver or validation share differs from ${parts[0].path}'s`);
  }
  const { positions, merged } = mergeAndSplit(parts.flatMap((p) => p.positions), validPermille);
  const digest = createHash("sha256");
  for (const p of parts) digest.update(p.header.source.sha256);
  const out = join(DATASETS, `${name}.bin`);
  mkdirSync(DATASETS, { recursive: true });
  writeDataset(out, {
    name,
    source: { set: name, url: "join", sha256: digest.digest("hex"), license: parts.map((p) => `${p.header.source.set}: ${p.header.source.license}`).join("; "), reader: parts[0].header.source.reader },
    parts: parts.map((p) => ({ name: p.header.name, source: p.header.source, count: p.header.count })),
    validPermille,
    resolver,
    counts: { input: parts.reduce((a, p) => a + p.positions.length, 0), mergedAway: merged, output: positions.length, validation: positions.filter((p) => p.valid).length },
  }, positions);
  console.log(`${out}: ${parts.map((p) => `${p.header.name} ${p.positions.length}`).join(" + ")}, ${merged} merged away, ${positions.length} kept`);
} else if (step === "info") {
  const { header, positions } = readDataset(positional ?? die(usage));
  const results = new Map<number, number>();
  for (const p of positions) results.set(p.result, (results.get(p.result) ?? 0) + 1);
  console.log(JSON.stringify(header, null, 2));
  console.log(`results: ${[...results].sort((a, b) => a[0] - b[0]).map(([r, n]) => `${Number.isNaN(r) ? "none" : r}: ${n}`).join(", ")}`);
  console.log(`scores: ${positions.filter((p) => !Number.isNaN(p.score)).length}; validation: ${positions.filter((p) => p.valid).length}`);
} else if (step === "eval") {
  const m = loadMap(positional ?? die(usage));
  const { header, records } = readDatasetRaw(rest[1] ?? die(usage));
  const count = Math.min(header.count, Number(opt("--limit") ?? header.count));
  const adapter = await openAdapter(m, records, count);
  const t = performance.now();
  const scores = await adapter.eval();
  const ms = performance.now() - t;
  await adapter.close();
  const usable = scores.filter((s) => !Number.isNaN(s));
  const mean = usable.reduce((a, s) => a + Math.abs(s), 0) / usable.length;
  console.log(`${count} positions, ${count - usable.length} unusable, mean |score| ${mean.toFixed(1)} cp, ${Math.round(ms)} ms, ${Math.round((count / ms) * 1000)} positions/s`);
} else if (step === "trace" || step === "tune") {
  const m = loadMap(positional ?? die(usage));
  const dsPath = rest[1] ?? die(usage);
  const raw = readDatasetRaw(dsPath);
  const header = raw.header;
  const sample = opt("--sample") ? Number(opt("--sample")) : undefined;
  const records = sample === undefined ? raw.records : sampleRecords(raw.records, sample);
  const limit = opt("--limit") ? Number(opt("--limit")) : undefined;
  const count = Math.min(records.length / RECORD, limit ?? Infinity);
  const subset = `${sample !== undefined ? `-s${sample}` : ""}${limit !== undefined ? `-${count}` : ""}`;
  if (sample !== undefined) console.log(`sample ${sample}‰: ${records.length / RECORD} of ${header.count} positions`);
  const deltaFactor = Number(opt("--delta") ?? 4);
  const tol = Number(opt("--tol") ?? 2);
  const adapter = await openAdapter(m, records, count);
  if (step === "trace") {
    await ensureTrace(m, dsPath, header.name, count, subset, adapter, deltaFactor, tol);
  } else {
    const optimizer = opt("--optimizer") ?? die(usage);
    const over = opt("--over") ?? "trace";
    if (!["adam", "local"].includes(optimizer) || !["trace", "adapter"].includes(over) || (optimizer === "adam" && over !== "trace")) die("--optimizer adam (over the trace) or local (over the trace or the adapter)");
    const minTouch = Number(opt("--min-touch") ?? 100);
    const trace = over === "trace" ? await ensureTrace(m, dsPath, header.name, count, subset, adapter, deltaFactor, tol) : undefined;
    const base = trace ? trace.base : await adapter.eval();
    const labels: Labels = { result: new Float64Array(count), valid: new Uint8Array(count) };
    const p = blankPosition();
    for (let i = 0; i < count; i++) {
      decodeRecord(records, i, p);
      labels.result[i] = p.result;
      labels.valid[i] = p.valid ? 1 : 0;
    }
    const givenK = opt("--k") ?? m.map.k;
    if (givenK !== undefined && !(Number(givenK) > 0)) die(`--k needs a positive number: ${givenK}`);
    const K = givenK !== undefined ? Number(givenK) : fitK(base, labels);
    const train0 = loss(base, labels, K, false);
    const valid0 = loss(base, labels, K, true);
    console.log(`K ${K.toFixed(4)}${givenK !== undefined ? " (held)" : ""}; at defaults: train ${train0.toFixed(6)}, valid ${valid0.toFixed(6)}`);
    const ids = tunable(m, trace, minTouch);
    const held = m.elements.filter((e) => !e.fixed && !ids.includes(e.id)).map((e) => e.name);
    console.log(`${ids.length} elements tuned${held.length ? `; held for fewer than ${minTouch} positions touched: ${held.join(" ")}` : ""}`);
    const runs = join(REPO, "tmp", "texel", "runs");
    mkdirSync(runs, { recursive: true });
    const id = `${m.map.subject}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    // the values as the subject stores them, only those off their defaults
    const valuesOf = (theta: Float64Array) => {
      const values: Record<string, number> = {};
      for (const i of ids) {
        const e = m.elements[i];
        const v = storable(e, theta[i]);
        if (v !== e.default) values[e.name] = v;
      }
      return values;
    };
    let theta: Float64Array;
    let protocol: string;
    if (optimizer === "adam") {
      const alpha = Number(opt("--alpha") ?? 0.1);
      const epochs = Number(opt("--epochs") ?? 2000);
      const patience = Number(opt("--patience") ?? 100);
      const r = adam(trace!, m, labels, K, ids, { alpha, epochs, patience }, (q) => console.log(`epoch ${q.epoch}: train ${q.train.toFixed(6)}, valid ${q.valid.toFixed(6)}`));
      theta = r.theta;
      console.log(`best epoch ${r.best.epoch}: valid ${r.best.valid.toFixed(6)} (linear)`);
      protocol = `adam α ${alpha}, at most ${epochs} epochs, patience ${patience}`;
    } else {
      const passes = Number(opt("--passes") ?? 20);
      const grow = Number(opt("--grow") ?? 16);
      const from = opt("--from");
      let start: Float64Array | undefined;
      if (from) {
        start = Float64Array.from(m.elements.map((e) => e.default));
        for (const [name, v] of Object.entries(JSON.parse(readFileSync(from, "utf8")) as Record<string, number>)) {
          const e = m.elements.find((x) => x.name === name) ?? die(`${from}: ${name} is not in the map`);
          if (!ids.includes(e.id)) die(`${from}: ${name} is not tuned in this run`);
          start[e.id] = v;
        }
      }
      const saved = join(runs, `${id}.pass.values.json`);
      console.log(`values after each pass: ${saved}`);
      const target = trace ? traceTarget(trace, m, labels, K) : adapterTarget(adapter, m, labels, K);
      theta = await localSearch(target, m, ids, { maxPasses: passes, grow, start, onPass: (t) => writeFileSync(saved, `${JSON.stringify(valuesOf(t), null, 2)}\n`) }, (l) => console.log(l));
      protocol = `local over the ${over}, at most ${passes} passes${grow > 1 ? `, steps grow to ×${grow}` : ""}${from ? `, from ${basename(from)}` : ""}`;
    }
    // the values as the subject stores them, verified through the adapter
    const values = valuesOf(theta);
    const rounded = Float64Array.from(m.elements.map((e) => e.default));
    for (const i of ids) rounded[i] = storable(m.elements[i], theta[i]);
    const linear = trace ? linearEval(trace, rounded) : undefined;
    await adapter.reset();
    for (const i of ids) await adapter.set(i, rounded[i]);
    const truth = await adapter.eval();
    const result = {
      subject: m.map.subject,
      map: m.path,
      mapHash: m.hash,
      dataset: header.name,
      positions: count,
      K,
      train0,
      valid0,
      train1: loss(truth, labels, K, false),
      valid1: loss(truth, labels, K, true),
      linearTrain1: linear ? loss(linear, labels, K, false) : null,
      linearValid1: linear ? loss(linear, labels, K, true) : null,
      tuned: ids.length,
      changed: Object.keys(values).length,
      protocol: `${header.name}${sample !== undefined ? `, sample ${sample}‰` : ""}${limit !== undefined ? `, first ${count}` : ""}; ${givenK !== undefined ? "K held; " : ""}${protocol}${trace ? `; trace Δ ×${deltaFactor}, tol ${tol} cp; touched ≥ ${minTouch}` : ""}`,
      values,
    };
    console.log(`after (true, rounded): train ${result.train1.toFixed(6)}, valid ${result.valid1.toFixed(6)}${linear ? `; linear: train ${result.linearTrain1!.toFixed(6)}, valid ${result.linearValid1!.toFixed(6)}` : ""}; ${result.changed} values changed`);
    writeFileSync(join(runs, `${id}.json`), `${JSON.stringify(result, null, 2)}\n`);
    writeFileSync(join(runs, `${id}.values.json`), `${JSON.stringify(values, null, 2)}\n`);
    console.log(`${join(runs, id)}.json; values for write: ${join(runs, id)}.values.json`);
    const commit = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO, encoding: "utf8" }).stdout.trim();
    const r = spawnSync("bun", [join(REPO, "tools", "results.ts"), "tuning", m.map.subject, commit, result.protocol], { input: JSON.stringify(result), encoding: "utf8" });
    if (r.status !== 0) console.error(`results.ts tuning failed: ${r.stderr}`);
  }
  await adapter.close();
} else {
  die(usage);
}
