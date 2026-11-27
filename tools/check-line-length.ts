/**
 * Line-length check over tracked TypeScript sources (code and comments). Excludes vendored code and generated data
 * files. Prints one line per finding and exits 1 if any line exceeds the limit.
 *
 *   bun tools/check-line-length.ts
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MAX_WIDTH = 120;
const EXCLUDED_FILES = new Set(["core/bench-fens.ts"]);
const EXCLUDED_PREFIXES = ["vendor/"];

const root = join(import.meta.dirname, "..");
const files = execFileSync("git", ["ls-files", "--", "*.ts"], { cwd: root, encoding: "utf8" })
  .split("\n")
  .filter((file) => file.length > 0 && !EXCLUDED_FILES.has(file) && !EXCLUDED_PREFIXES.some((p) => file.startsWith(p)))
  .sort();

const findings: string[] = [];
for (const file of files) {
  const lines = readFileSync(join(root, file), "utf8").split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length > MAX_WIDTH) {
      findings.push(`${file}:${i + 1} (${lines[i].length} > ${MAX_WIDTH})`);
    }
  }
}

for (const finding of findings) console.log(finding);
console.error(`${findings.length} line(s) over ${MAX_WIDTH} columns across ${files.length} file(s)`);
process.exit(findings.length ? 1 : 0);
