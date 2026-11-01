/**
 * The UCI adapter: a subject reached as N engine processes speaking UCI. It needs
 * nothing from the subject but its options and a way to score a position, which
 * the map's `uci` section declares:
 *
 *   "uci": {
 *     "command": ["bun", "host/uci/main.ts", "--release", "{build}", "--tunables", "{tunables}"],
 *     "options": { "Hash": 16 },
 *     "eval": { "form": "command", "command": "eval", "pattern": "^eval cp (-?\\d+)", "view": "side" }
 *   }
 *
 * - command: the argv, run from the repo; {build} and {tunables} are a tuning
 *   build's wasm and options file, for a subject that is a Ratchet release.
 * - options: set once at start, before any element.
 * - eval: `{ "form": "search", "depth": d }` scores a position by `go depth d`,
 *   reading the last `info ... score cp` (a mate score is NaN), from a fresh
 *   `ucinewgame`; or `{ "form": "command", ... }` sends an engine's own eval
 *   command and reads the first line matching `pattern`, its first group in
 *   centipawns times `scale` (default 1), from the side to move's view or White's.
 *
 * A block's option name is its `uci` field with {i} as the element's first index,
 * or the element's name. A value is sent rounded, as UCI spin options take
 * integers. A command-form eval is pipelined in batches, since it answers at once;
 * a search waits for its bestmove before the next position, as UCI requires.
 */
import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { type Adapter, whiteScore } from "./adapter.ts";
import { blankPosition, decodeRecord, fenOf } from "./dataset.ts";
import type { LoadedMap } from "./map.ts";

export interface UciSection {
  command: string[];
  options?: Record<string, string | number>;
  eval: { form: "search"; depth: number } | { form: "command"; command: string; pattern: string; view?: "side" | "white"; scale?: number };
}

const REPO = new URL("../../", import.meta.url).pathname;
const BATCH = 64;

/** one engine process: lines in, lines out */
class UciProcess {
  private readonly child: ChildProcessWithoutNullStreams;
  private readonly lines: string[] = [];
  private waiter: (() => void) | undefined;
  private closed = false;

  constructor(argv: string[]) {
    this.child = spawn(argv[0], argv.slice(1), { cwd: REPO, stdio: ["pipe", "pipe", "pipe"] });
    this.child.stderr.on("data", () => {});
    this.child.on("exit", () => {
      this.closed = true;
      this.waiter?.();
    });
    createInterface({ input: this.child.stdout }).on("line", (l) => {
      this.lines.push(l);
      this.waiter?.();
    });
  }

  send(line: string): void {
    this.child.stdin.write(`${line}\n`);
  }

  /** the next line; throws if the process has exited */
  async next(): Promise<string> {
    while (!this.lines.length) {
      if (this.closed) throw new Error("the engine exited");
      await new Promise<void>((r) => (this.waiter = r));
      this.waiter = undefined;
    }
    return this.lines.shift()!;
  }

  /** lines until one matches `re`, which is returned */
  async until(re: RegExp): Promise<string> {
    for (;;) {
      const l = await this.next();
      if (re.test(l)) return l;
    }
  }

  async ready(): Promise<void> {
    this.send("isready");
    await this.until(/^readyok/);
  }

  close(): void {
    if (!this.closed) this.send("quit");
    setTimeout(() => this.child.kill("SIGKILL"), 2000).unref();
  }
}

export class UciAdapter implements Adapter {
  count = 0;
  private records: Uint8Array<ArrayBufferLike> = new Uint8Array(0);
  private readonly engines: UciProcess[];
  private readonly section: UciSection;
  private readonly optionName: string[];
  private readonly defaults: number[];

  private constructor(engines: UciProcess[], section: UciSection, m: LoadedMap) {
    this.engines = engines;
    this.section = section;
    const blocks = new Map(m.map.blocks.map((b) => [b.name, b as { uci?: string }]));
    this.optionName = m.elements.map((e) => blocks.get(e.block)?.uci?.replace("{i}", String(e.indices[0])) ?? e.name);
    this.defaults = m.elements.map((e) => e.default);
  }

  /** starts `processes` engines from the map's uci section; `subst` fills {build} and {tunables} */
  static async open(m: LoadedMap, processes: number, subst: Record<string, string> = {}): Promise<UciAdapter> {
    const section = (m.map as { uci?: UciSection }).uci;
    if (!section) throw new Error(`${m.path} has no uci section`);
    const argv = section.command.map((a) => a.replace(/\{(\w+)\}/g, (w, k) => subst[k] ?? w));
    const engines = Array.from({ length: processes }, () => new UciProcess(argv));
    await Promise.all(
      engines.map(async (e) => {
        e.send("uci");
        await e.until(/^uciok/);
        for (const [k, v] of Object.entries(section.options ?? {})) e.send(`setoption name ${k} value ${v}`);
        await e.ready();
      }),
    );
    return new UciAdapter(engines, section, m);
  }

  async load(records: Uint8Array, count: number): Promise<void> {
    this.records = records;
    this.count = count;
  }

  async eval(): Promise<Float64Array> {
    const scores = new Float64Array(this.count);
    const ev = this.section.eval;
    const n = this.engines.length;
    await Promise.all(
      this.engines.map(async (e, k) => {
        const p = blankPosition();
        if (ev.form === "search") {
          for (let i = k; i < this.count; i += n) {
            decodeRecord(this.records, i, p);
            e.send("ucinewgame");
            e.send(`position fen ${fenOf(p)}`);
            e.send(`go depth ${ev.depth}`);
            let last = NaN;
            for (;;) {
              const l = await e.next();
              const cp = / score cp (-?\d+)/.exec(l);
              if (cp) last = Number(cp[1]);
              else if (/ score mate /.test(l)) last = NaN;
              if (l.startsWith("bestmove")) break;
            }
            scores[i] = Number.isNaN(last) ? NaN : whiteScore(last, p.side);
          }
          return;
        }
        const re = new RegExp(ev.pattern);
        const scale = ev.scale ?? 1;
        const mine: number[] = [];
        for (let i = k; i < this.count; i += n) mine.push(i);
        for (let at = 0; at < mine.length; at += BATCH) {
          const batch = mine.slice(at, at + BATCH);
          const sides: number[] = [];
          for (const i of batch) {
            decodeRecord(this.records, i, p);
            sides.push(p.side);
            e.send(`position fen ${fenOf(p)}`);
            e.send(ev.command);
          }
          for (let j = 0; j < batch.length; j++) {
            const m = re.exec(await e.until(re))!;
            const s = Number(m[1]) * scale;
            scores[batch[j]] = ev.view === "white" ? s : whiteScore(s, sides[j]);
          }
        }
      }),
    );
    return scores;
  }

  async set(id: number, value: number): Promise<void> {
    await Promise.all(
      this.engines.map(async (e) => {
        e.send(`setoption name ${this.optionName[id]} value ${Math.round(value)}`);
        await e.ready();
      }),
    );
  }

  async reset(): Promise<void> {
    await Promise.all(
      this.engines.map(async (e) => {
        for (let id = 0; id < this.defaults.length; id++) e.send(`setoption name ${this.optionName[id]} value ${Math.round(this.defaults[id])}`);
        await e.ready();
      }),
    );
  }

  async close(): Promise<void> {
    for (const e of this.engines) e.close();
  }
}
