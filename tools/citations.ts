/**
 * Citation check for the own engine: lists each comment in engines/ratchet/ that names a cited engine without a
 * revision, or with a revision that engines/ratchet/SOURCES.md does not map to a commit. A citation is engine,
 * revision and symbol ("Ethereal v12.75 LateMovePruningCounts"); the symbol is not checked here. A bare mention of an
 * engine is covered when the same comment cites it with a revision. Run by hand; not part of CI.
 *
 *   bun tools/citations.ts            one line per finding, as file:line; exits 1 if any
 *   bun tools/citations.ts --census   also every engine and revision cited, with its count
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const dir = join(root, "engines/ratchet");

/** engine -> revisions the table maps */
const table = new Map<string, Set<string>>();
for (const line of readFileSync(join(dir, "SOURCES.md"), "utf8").split("\n")) {
  const cells = line.split("|").map((c) => c.trim());
  if (cells.length < 6 || cells[1] === "engine" || cells[1].startsWith("-")) continue;
  const [engine, revision] = [cells[1], cells[2].replace(/`/g, "")];
  if (!table.has(engine)) table.set(engine, new Set());
  table.get(engine)!.add(revision);
}

/** a token that reads as a revision: a commit prefix, or a version such as v12.75, 37 or 2.0 */
const isRevision = (t: string) => /^[0-9a-f]{7,40}$/.test(t) || /^v?\d+(\.\d+)*$/.test(t);

/** each comment of a source file, with the line it starts on */
function comments(text: string): { line: number; body: string }[] {
  const out: { line: number; body: string }[] = [];
  const re = /\/\*[\s\S]*?\*\/|\/\/[^\n]*/g;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    const before = text.slice(0, m.index);
    // a "//" inside a string is rare in this tree; a line comment after code is still a comment
    if (m[0].startsWith("//") && (before.split("\n").pop()!.match(/"/g)?.length ?? 0) % 2 === 1) continue;
    out.push({ line: before.split("\n").length, body: m[0] });
  }
  // consecutive line comments read as one comment
  const merged: { line: number; body: string }[] = [];
  for (const c of out) {
    const last = merged[merged.length - 1];
    if (last && c.body.startsWith("//") && last.body.startsWith("//") && c.line === last.line + last.body.split("\n").length) {
      last.body += "\n" + c.body;
    } else merged.push({ ...c });
  }
  return merged;
}

const names = [...table.keys()].sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
// a possessive ("Stash's 98") names a value of the engine's, not a revision
const mention = new RegExp(`\\b(${names.join("|")})\\b(?:'s|(?:\\s+([\\w.]+)))?`, "g");
const unknown = /\b([A-Z][\w-]+) ([0-9a-f]{7,40})\b/g;

const findings: string[] = [];
const census = new Map<string, number>();
for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts")).sort()) {
  const text = readFileSync(join(dir, file), "utf8");
  for (const c of comments(text)) {
    const lines = c.body.split("\n");
    const cited = new Set<string>();
    for (const m of c.body.matchAll(mention)) {
      const token = (m[2] ?? "").replace(/[.,;:]+$/, "");
      if (token && table.get(m[1])!.has(token)) cited.add(m[1]);
    }
    lines.forEach((l, i) => {
      const at = `engines/ratchet/${file}:${c.line + i}`;
      for (const m of l.matchAll(mention)) {
        const [engine, token] = [m[1], (m[2] ?? "").replace(/[.,;:]+$/, "")];
        if (token && isRevision(token)) {
          census.set(`${engine} ${token}`, (census.get(`${engine} ${token}`) ?? 0) + 1);
          if (!table.get(engine)!.has(token)) findings.push(`${at}: ${engine} ${token}: revision not in SOURCES.md`);
        } else if (!cited.has(engine)) findings.push(`${at}: ${engine}: no revision`);
      }
      for (const m of l.matchAll(unknown)) {
        if (!table.has(m[1]) && !/^(Ratchet|Merge)$/.test(m[1])) findings.push(`${at}: ${m[1]} ${m[2]}: engine not in SOURCES.md`);
      }
    });
  }
}

for (const f of findings) console.log(f);
if (process.argv.includes("--census")) {
  for (const [k, n] of [...census].sort()) console.log(`census ${k} ${n}`);
}
console.error(`${findings.length} finding(s)`);
process.exit(findings.length ? 1 : 0);
