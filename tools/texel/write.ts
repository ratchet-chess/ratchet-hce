/**
 * The writer: from a map, a copy of the subject's release with its mapped constants
 * changed. Two outputs share the mapping:
 *
 * - a tuning build: each mapped scalar becomes a `let`, and each source file that
 *   holds a slot gets a generated setter, so the build exports
 *   tuneSet(element id, value) and the tuner sets any element at run time. Built
 *   under tmp/texel/builds/, never committed, with tunables.json beside it: the
 *   free elements as UCI spin options (host/uci/main.ts --tunables).
 * - a tuned variant: each slot's literal takes its element's value, rounded to the
 *   storage type and clamped to its bounds, in engines/<release>-<name>/; or, for
 *   the own engine, the same literals in its own files (writeInPlace).
 *
 * A copy's relative imports that leave the release's directory are recomputed for
 * the copy's place, so it compiles anywhere.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { type Element, type LoadedMap, stored } from "./map.ts";
import { applyEdits, type Edit, mutableEdits, valueEdit } from "./source.ts";

const REPO = new URL("../../", import.meta.url).pathname;

/** the release's sources, by file name */
function releaseFiles(m: LoadedMap): Map<string, string> {
  if (!m.releaseDir) throw new Error(`${m.path}: the writer needs a release`);
  const files = new Map<string, string>();
  for (const f of readdirSync(m.releaseDir).filter((f) => f.endsWith(".ts")).sort()) files.set(f, readFileSync(join(m.releaseDir, f), "utf8"));
  return files;
}

/** `text` with each relative import that leaves `from` pointed at the same file from `to` */
function rehome(text: string, from: string, to: string): string {
  return text.replace(/(\bfrom\s+|\bimport\s+)(["'])(\.{1,2}\/[^"']*)\2/g, (whole, lead, q, spec) => {
    const target = resolve(from, spec);
    if (target.startsWith(from + "/")) return whole;
    let moved = relative(to, target);
    if (!moved.startsWith(".")) moved = `./${moved}`;
    return `${lead}${q}${moved}${q}`;
  });
}

/** an element's value as its storage holds it: rounded for an integer type, clamped to the bounds */
export function storable(e: Element, v: number): number {
  const r = e.type === "f64" ? v : Math.round(v);
  return Math.min(e.max, Math.max(e.min, r));
}

/** writes `files` into `dir`, rehomed from the release's directory */
function emit(m: LoadedMap, files: Map<string, string>, dir: string): void {
  mkdirSync(dir, { recursive: true });
  for (const [f, text] of files) writeFileSync(join(dir, f), rehome(text, m.releaseDir!, resolve(dir)));
}

/**
 * The tuned variant engines/<release>-<name>/ with `values` (element name to
 * value; an element not named keeps its default). Refuses to overwrite.
 */
export function writeVariant(m: LoadedMap, name: string, values: Record<string, number>): string {
  const dir = join(REPO, "engines", `${m.map.release}-${name}`);
  if (existsSync(dir)) throw new Error(`${dir} exists`);
  const byName = new Map(m.elements.map((e) => [e.name, e]));
  for (const n of Object.keys(values)) if (!byName.has(n)) throw new Error(`${m.path}: no element ${n}`);
  const files = releaseFiles(m);
  const edits = new Map<string, Edit[]>();
  const changed: Record<string, number> = {};
  for (const e of m.elements) {
    if (!(e.name in values)) continue;
    if (e.fixed) throw new Error(`${e.name} is fixed in ${m.path}`);
    const v = storable(e, values[e.name]);
    if (v !== e.default) changed[e.name] = v;
    for (const s of e.slots) {
      const decl = m.declarations.get(s.file)!.get(s.symbol)!;
      const list = edits.get(s.file) ?? [];
      list.push(valueEdit(files.get(s.file)!, decl, s.index < 0 ? 0 : s.index, stored(v, s.transform)));
      edits.set(s.file, list);
    }
  }
  for (const [f, list] of edits) files.set(f, applyEdits(files.get(f)!, list));
  emit(m, files, dir);
  writeFileSync(join(dir, "variant.json"), `${JSON.stringify({ release: m.map.release, map: relative(REPO, m.path), values: changed }, null, 2)}\n`);
  return dir;
}

/**
 * Writes `values` into the subject's own files, for the own engine, whose tuned
 * values are committed in place (AGENTS.md § Own engine). Refuses a release: one
 * with a fidelity reference stays untouched. Returns the files changed.
 */
export function writeInPlace(m: LoadedMap, values: Record<string, number>): string[] {
  if (!m.releaseDir) throw new Error(`${m.path}: the writer needs a release`);
  if (existsSync(join(m.releaseDir, "fidelity"))) throw new Error(`${m.releaseDir} is a release: write a variant instead`);
  const byName = new Map(m.elements.map((e) => [e.name, e]));
  for (const n of Object.keys(values)) if (!byName.has(n)) throw new Error(`${m.path}: no element ${n}`);
  const files = releaseFiles(m);
  const edits = new Map<string, Edit[]>();
  for (const e of m.elements) {
    if (!(e.name in values)) continue;
    if (e.fixed) throw new Error(`${e.name} is fixed in ${m.path}`);
    const v = storable(e, values[e.name]);
    for (const s of e.slots) {
      const decl = m.declarations.get(s.file)!.get(s.symbol)!;
      const list = edits.get(s.file) ?? [];
      list.push(valueEdit(files.get(s.file)!, decl, s.index < 0 ? 0 : s.index, stored(v, s.transform)));
      edits.set(s.file, list);
    }
  }
  const changed: string[] = [];
  for (const [f, list] of edits) {
    const text = applyEdits(files.get(f)!, list);
    if (text === files.get(f)) continue;
    writeFileSync(join(m.releaseDir, f), text);
    changed.push(join(relative(REPO, m.releaseDir), f));
  }
  return changed;
}

/** the AssemblyScript statement that stores element value `v` in slot `s` */
function store(e: Element, s: { symbol: string; index: number; transform: string }): string {
  const value = e.type === "f64" ? "v" : `<${e.type}>Math.round(v)`;
  const signed = s.transform === "negate" || s.transform === "flip-negate" ? `-(${value})` : value;
  return s.index < 0 ? `${s.symbol} = ${signed};` : `${s.symbol}[${s.index}] = ${signed};`;
}

/**
 * The tuning build: the release with every slot settable through tuneSet, written
 * and compiled under tmp/texel/builds/<subject>-<hash>/. Returns the wasm's path;
 * an existing build of the same map and sources is reused.
 */
export function buildTuning(m: LoadedMap): string {
  const dir = join(REPO, "tmp", "texel", "builds", `${m.map.subject}-${m.hash}`);
  const wasm = join(dir, `${m.map.subject}.wasm`);
  // the elements as UCI spin options, for host/uci/main.ts --tunables
  const tunables = m.elements.filter((e) => !e.fixed).map((e) => ({ name: e.name, id: e.id, value: e.default, min: Math.max(e.min, -(2 ** 31)), max: Math.min(e.max, 2 ** 31 - 1) }));
  const writeTunables = () => writeFileSync(join(dir, "tunables.json"), `${JSON.stringify(tunables, null, 1)}\n`);
  if (existsSync(wasm)) {
    if (!existsSync(join(dir, "tunables.json"))) writeTunables();
    return wasm;
  }
  rmSync(dir, { recursive: true, force: true });
  const src = join(dir, "src");
  const files = releaseFiles(m);
  const edits = new Map<string, Edit[]>();
  const setters = new Map<string, string[]>();
  for (const [file, decls] of m.declarations) {
    for (const decl of decls.values()) {
      if (decl.kind !== "scalar") continue;
      const e = m.elements.find((x) => x.slots.some((s) => s.file === file && s.symbol === decl.symbol))!;
      edits.set(file, [...(edits.get(file) ?? []), ...mutableEdits(decl, e.type)]);
    }
  }
  for (const e of m.elements) {
    for (const s of e.slots) {
      const cases = setters.get(s.file) ?? [];
      cases.push(`    case ${e.id}: ${store(e, s)} break;`);
      setters.set(s.file, cases);
    }
  }
  const imports: string[] = [];
  const calls: string[] = [];
  for (const [f, cases] of setters) {
    let text = applyEdits(files.get(f)!, edits.get(f) ?? []);
    const fn = `__texelSet_${f.replace(/\W/g, "_")}`;
    text += `\n// Generated by tools/texel/write.ts: the tuning build's setter for this file's slots.\nexport function ${fn}(id: i32, v: f64): void {\n  switch (id) {\n${cases.join("\n")}\n    default: break;\n  }\n}\n`;
    files.set(f, text);
    if (f !== "index.ts") imports.push(`import { ${fn} } from "./${f.replace(/\.ts$/, "")}";`);
    calls.push(`  ${fn}(id, value);`);
  }
  const index = files.get("index.ts");
  if (!index) throw new Error(`${m.releaseDir}: no index.ts`);
  // a table the release fills once from a tuned constant is filled again after each set
  const refresh = m.map.refresh ? `  ${m.map.refresh}();\n` : "";
  files.set("index.ts", `${index}\n${imports.join("\n")}\n\n/** sets tuned element \`id\` of ${relative(REPO, m.path)} to \`value\` */\nexport function tuneSet(id: i32, value: f64): void {\n${calls.join("\n")}\n${refresh}}\n`);
  emit(m, files, src);
  const flags = ["-O3", "--converge", "--noAssert", "--uncheckedBehavior", "always", "--runtime", "stub"];
  const r = spawnSync("bunx", ["--bun", "asc", join(src, "index.ts"), "-o", wasm, ...flags], { cwd: REPO, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`asc failed for ${dirname(wasm)}:\n${r.stdout}${r.stderr}`);
  writeTunables();
  return wasm;
}
