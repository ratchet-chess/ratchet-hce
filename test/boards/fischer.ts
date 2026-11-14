/**
 * The Chess960 perft set (fischer.epd, see fischer.md): one position per start, with leaf counts to depth 6. Only
 * the core plays Chess960, so test/perft.ts runs this set on the core alone.
 */
import { readFileSync } from "node:fs";
import type { PerftCase } from "./suite.ts";

export const FISCHER_SUITE: PerftCase[] = readFileSync(new URL("./fischer.epd", import.meta.url), "utf8")
  .split("\n")
  .filter((l) => l.trim())
  .map((line, i) => {
    const [fen, ...depths] = line.split(";").map((s) => s.trim());
    return { name: `fischer-${i + 1}`, fen, counts: depths.map((d) => Number(d.split(/\s+/)[1])) };
  });
