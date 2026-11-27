/**
 * Citation check for the own engine. It lists each comment in engines/ratchet/ that names a cited engine without a
 * revision, or with a revision that engines/ratchet/SOURCES.md does not map to its source. A citation is engine,
 * revision and symbol ("Ethereal v12.75 LateMovePruningCounts"); the symbol is not checked here. A bare mention of an
 * engine is covered when the same comment cites it with a revision.
 *
 * It also checks engines/ratchet/FEATURES.md against the comments. A comment names the features it implements as
 * "Feature: Delta_Pruning." or "Features: A, B.", each a CPW page name or "Page#Section". FEATURES.md has one
 * section per feature: a "Used in" line this tool writes from those keys, and dated implementations, each of which
 * cites an engine and revision of SOURCES.md, or a publication in italics. CI runs it after the gates.
 *
 *   bun tools/citations.ts            one line per finding, as file:line; exits 1 if any
 *   bun tools/citations.ts --census   also every engine and revision cited, with its count
 *   bun tools/citations.ts --write    first rewrites every "Used in" line of FEATURES.md from the keys
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const dir = join(root, "engines/ratchet");

/** engine -> revisions the table maps */
const table = new Map<string, Set<string>>();
/** a disputed clone -> the program it is assumed to copy, from its row: "a disputed clone, assumed Rybka 3:" */
const assumed = new Map<string, string>();
for (const line of readFileSync(join(dir, "SOURCES.md"), "utf8").split("\n")) {
  const cells = line.split("|").map((c) => c.trim());
  if (cells.length < 6 || cells[1] === "engine" || cells[1].startsWith("-")) continue;
  const [engine, revision] = [cells[1], cells[2].replace(/`/g, "")];
  if (!table.has(engine)) table.set(engine, new Set());
  table.get(engine)!.add(revision);
  const label = /disputed clone, assumed ([^:;]+?):/.exec(cells[3]);
  if (label) assumed.set(engine, label[1]);
}

/** a token that reads as a revision: a commit prefix, a version such as v12.75, 37 or 2.0, or one the table names */
const isRevision = (engine: string, t: string) =>
  /^[0-9a-f]{7,40}$/.test(t) || /^v?\d+(\.\d+)*$/.test(t) || table.get(engine)!.has(t);

/** one comment: the line it starts on, its text, and where it starts and ends in the file */
type Comment = { line: number; body: string; start: number; end: number };

/** each comment of a source file */
function comments(text: string): Comment[] {
  const out: Comment[] = [];
  const re = /\/\*[\s\S]*?\*\/|\/\/[^\n]*/g;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    const before = text.slice(0, m.index);
    // a "//" inside a string is rare in this tree; a line comment after code is still a comment
    if (m[0].startsWith("//") && (before.split("\n").pop()!.match(/"/g)?.length ?? 0) % 2 === 1) continue;
    out.push({ line: before.split("\n").length, body: m[0], start: m.index, end: m.index + m[0].length });
  }
  // consecutive line comments read as one comment
  const merged: Comment[] = [];
  for (const c of out) {
    const last = merged[merged.length - 1];
    if (
      last &&
      c.body.startsWith("//") &&
      last.body.startsWith("//") &&
      c.line === last.line + last.body.split("\n").length
    ) {
      last.body += "\n" + c.body;
      last.end = c.end;
    } else merged.push({ ...c });
  }
  return merged;
}

const names = [...table.keys()]
  .sort((a, b) => b.length - a.length)
  .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
// a possessive ("Stash's 98") names a value of the engine's, not a revision
const mention = new RegExp(`\\b(${names.join("|")})\\b(?:'s|(?:\\s+([\\w.]+)))?`, "g");
const unknown = /\b([A-Z][\w-]+) ([0-9a-f]{7,40})\b/g;
/** the feature keys a comment names, on one line: "Feature: Delta_Pruning." or "Features: A, B#C." */
const keyList = /\bFeatures?: (\S+(?:, \S+)*?)\.(?=\s|$)/g;

/**
 * The citations of one line, checked against the table; findings go to `findings`
 * with `at`. `count` marks a comment's line, which adds to the census and requires
 * a bare engine name to carry a revision.
 */
function citationsOf(line: string, at: string, cited: Set<string>, count = true): string[] {
  // FEATURES.md's prose names engines without a revision ("Computer Chess Club"); only its citations are checked
  const out: string[] = [];
  for (const m of line.matchAll(mention)) {
    const [engine, token] = [m[1], (m[2] ?? "").replace(/[.,;:)]+$/, "")];
    if (token && isRevision(engine, token)) {
      if (count) census.set(`${engine} ${token}`, (census.get(`${engine} ${token}`) ?? 0) + 1);
      if (table.get(engine)!.has(token)) out.push(`${engine} ${token}`);
      else findings.push(`${at}: ${engine} ${token}: revision not in SOURCES.md`);
    } else if (count && !cited.has(engine)) findings.push(`${at}: ${engine}: no revision`);
  }
  for (const m of line.matchAll(unknown)) {
    if (!table.has(m[1]) && !/^(Ratchet|Merge)$/.test(m[1]))
      findings.push(`${at}: ${m[1]} ${m[2]}: engine not in SOURCES.md`);
  }
  return out;
}

/** the declaration a comment documents, or else the function it sits in; only an unindented comment documents one */
function declaration(text: string, c: Comment): string {
  const indented = text.lastIndexOf("\n", c.start - 1) + 1 < c.start;
  const after = indented
    ? null
    : /^\s*(?:@inline\s+)?(?:export\s+)?(?:declare\s+)?(?:function|const|let|var|class|type|interface)\s+(\w+)/.exec(
        text.slice(c.end),
      );
  if (after) return after[1];
  const fns = [...text.slice(0, c.start).matchAll(/^(?:@inline\s+)?(?:export\s+)?function\s+(\w+)/gm)];
  if (!text.slice(0, c.start).trim()) return "header";
  return fns.length ? fns[fns.length - 1][1] : "(file)";
}

const findings: string[] = [];
const census = new Map<string, number>();
/** feature key -> file -> declarations that name it */
const used = new Map<string, Map<string, Set<string>>>();
for (const file of readdirSync(dir)
  .filter((f) => f.endsWith(".ts"))
  .sort()) {
  const text = readFileSync(join(dir, file), "utf8");
  for (const c of comments(text)) {
    const cited = new Set<string>();
    for (const m of c.body.matchAll(mention)) {
      const token = (m[2] ?? "").replace(/[.,;:)]+$/, "");
      if (token && table.get(m[1])!.has(token)) cited.add(m[1]);
    }
    const found = c.body.split("\n").flatMap((l, i) => citationsOf(l, `engines/ratchet/${file}:${c.line + i}`, cited));
    const keys = [...c.body.matchAll(keyList)].flatMap((m) => m[1].split(", "));
    for (const key of keys) {
      if (!used.has(key)) used.set(key, new Map());
      const byFile = used.get(key)!;
      if (!byFile.has(file)) byFile.set(file, new Set());
      byFile.get(file)!.add(declaration(text, c));
    }
    if (found.length && !keys.length)
      findings.push(`engines/ratchet/${file}:${c.line}: cites ${found[0]} and names no feature`);
  }
}

/** the "Used in" line of one feature, from the keys */
const usedIn = (key: string) =>
  "Used in: " +
  [...(used.get(key) ?? new Map<string, Set<string>>())]
    .map(([file, decls]) => `\`${file}\` ${[...decls].join(", ")}`)
    .join("; ") +
  ".";

const featuresPath = join(dir, "FEATURES.md");
if (existsSync(featuresPath)) {
  let doc = readFileSync(featuresPath, "utf8");
  if (process.argv.includes("--write")) {
    // a block holds only the lines between its two markers, never a heading, so an empty block does not run on
    doc = doc.replace(
      /^## (.+)\n<!-- used-in -->\n(?:(?!## |<!-- \/used-in -->)[^\n]*\n)*<!-- \/used-in -->/gm,
      (_, key: string) => `## ${key}\n<!-- used-in -->\n${usedIn(key.trim())}\n<!-- /used-in -->`,
    );
    writeFileSync(featuresPath, doc);
  }
  const sections = new Set<string>();
  let key = "";
  // a list item and its indented continuation lines read as one line, starting where the item starts
  const lines: { l: string; n: number }[] = [];
  doc.split("\n").forEach((l, n) => {
    const last = lines[lines.length - 1];
    if (/^ {2}\S/.test(l) && last?.l.startsWith("- ")) last.l += " " + l.trim();
    else lines.push({ l, n });
  });
  const withUsedIn = new Set<string>();
  lines.forEach(({ l, n: i }) => {
    const at = `engines/ratchet/FEATURES.md:${i + 1}`;
    if (l.startsWith("## ")) {
      key = l.slice(3).trim();
      sections.add(key);
      if (!used.has(key)) findings.push(`${at}: ${key}: no comment names this feature`);
    } else if (l.startsWith("Used in: ") && key) {
      withUsedIn.add(key);
      if (l !== usedIn(key)) findings.push(`${at}: ${key}: "Used in" is stale; run with --write`);
    } else if (l.startsWith("- ") && key) {
      // the line's own source is the text before its first ": " outside a title in italics
      const bare = l.replace(/\*[^*]+\*/g, (t) => "*" + "x".repeat(t.length - 2) + "*");
      const source = l.slice(0, bare.includes(": ") ? bare.indexOf(": ") : l.length);
      const cites = citationsOf(l, at, new Set(), false);
      if (!citationsOf(source, at, new Set(), false).length && !/\*[^*]+\*/.test(source)) {
        findings.push(
          `${at}: the line's source is neither an engine revision of SOURCES.md nor a publication in italics`,
        );
      }
      for (const c of cites) {
        const label = assumed.get(c.slice(0, c.lastIndexOf(" ")));
        if (label && !l.includes(`assumed ${label}`))
          findings.push(`${at}: ${c} is a disputed clone; the line names "assumed ${label}"`);
      }
    }
  });
  for (const k of sections)
    if (!withUsedIn.has(k)) findings.push(`engines/ratchet/FEATURES.md: ${k}: no "Used in" block`);
  for (const k of used.keys())
    if (!sections.has(k)) findings.push(`engines/ratchet/FEATURES.md: ${k}: named in a comment, no section`);
}

for (const f of findings) console.log(f);
if (process.argv.includes("--census")) {
  for (const [k, n] of [...census].sort((a, b) => a[0].localeCompare(b[0]))) console.log(`census ${k} ${n}`);
}
console.error(`${findings.length} finding(s)`);
process.exit(findings.length ? 1 : 0);
