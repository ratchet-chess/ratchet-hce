/**
 * A tuned constant's declaration in an AssemblyScript source file: found by its
 * symbol, read, and patched in place. Two forms are understood, each a numeric
 * literal or a list of them:
 *
 *   [export] const NAME[: T] = <number>;
 *   [export] const NAME: StaticArray<T> = [<number>, ...];
 *
 * A patch rewrites only the literals it changes, so a file written back with every
 * value at its default is byte for byte the same.
 */

/** one numeric literal's place in the file text */
export interface Literal {
  start: number;
  end: number;
  value: number;
}

export interface Declaration {
  symbol: string;
  kind: "scalar" | "array";
  /** the declared type: T, or StaticArray's element type; "" when a scalar has none */
  type: string;
  /** the `const` keyword's place, which a tuning build turns into `let` */
  constAt: number;
  /** where a scalar with no type annotation gets one: just after its name */
  nameEnd: number;
  literals: Literal[];
}

const NUMBER = /^-?(0x[0-9a-fA-F]+|\d+(\.\d+)?)$/;

function parseNumber(text: string): number {
  const negative = text.startsWith("-");
  const body = negative ? text.slice(1) : text;
  const value = body.startsWith("0x") ? parseInt(body, 16) : Number(body);
  return negative ? -value : value;
}

/** `symbol`'s declaration in `text`; throws if it is missing or not one of the two forms */
export function findDeclaration(text: string, symbol: string, file: string): Declaration {
  const head = new RegExp(`^[ \\t]*(?:export[ \\t]+)?(const)[ \\t]+${symbol}\\b[ \\t]*(:[ \\t]*([A-Za-z0-9_<>]+))?[ \\t]*=[ \\t]*`, "m");
  const m = head.exec(text);
  if (!m) throw new Error(`${file}: no const ${symbol}`);
  const constAt = m.index + m[0].indexOf("const");
  const nameEnd = text.indexOf(symbol, constAt) + symbol.length;
  const bodyAt = m.index + m[0].length;
  const array = /^StaticArray<\s*([A-Za-z0-9_]+)\s*>$/.exec(m[3] ?? "");
  if (array) {
    if (text[bodyAt] !== "[") throw new Error(`${file}: ${symbol} is not an array literal`);
    const close = text.indexOf("]", bodyAt);
    if (close < 0) throw new Error(`${file}: ${symbol} has no closing ]`);
    return { symbol, kind: "array", type: array[1], constAt, nameEnd, literals: arrayLiterals(text, bodyAt + 1, close, symbol, file) };
  }
  const semi = text.indexOf(";", bodyAt);
  const raw = text.slice(bodyAt, semi);
  const token = raw.trim();
  if (!NUMBER.test(token)) throw new Error(`${file}: ${symbol} = ${token} is not a numeric literal`);
  const start = bodyAt + raw.indexOf(token);
  return { symbol, kind: "scalar", type: m[3] ?? "", constAt, nameEnd, literals: [{ start, end: start + token.length, value: parseNumber(token) }] };
}

/** the literals between `from` and `to`, comments skipped; every element must be one */
function arrayLiterals(text: string, from: number, to: number, symbol: string, file: string): Literal[] {
  const out: Literal[] = [];
  let i = from;
  let element = "";
  let elementStart = -1;
  const flush = () => {
    const token = element.trim();
    if (token) {
      if (!NUMBER.test(token)) throw new Error(`${file}: ${symbol} has an element ${token}, not a numeric literal`);
      const start = elementStart + element.indexOf(token);
      out.push({ start, end: start + token.length, value: parseNumber(token) });
    }
    element = "";
    elementStart = -1;
  };
  while (i < to) {
    if (text.startsWith("//", i)) { i = text.indexOf("\n", i); if (i < 0 || i > to) i = to; continue; }
    if (text.startsWith("/*", i)) { i = text.indexOf("*/", i) + 2; continue; }
    const c = text[i];
    if (c === ",") { flush(); i++; continue; }
    if (/\s/.test(c) && !element.trim()) { i++; continue; }
    if (elementStart < 0) elementStart = i;
    element += c;
    i++;
  }
  flush();
  return out;
}

/** a value as the literal it replaces would write it: the old text when equal, else decimal */
function format(value: number, old: string, type: string): string {
  if (Number.isInteger(value) ? parseNumber(old) === value : Number(old) === value) return old;
  if (type === "f64" || type === "f32") return String(value);
  return String(Math.round(value));
}

/** one edit of the file text */
export interface Edit {
  start: number;
  end: number;
  text: string;
}

/** the edit that writes `value` into literal `index` of `decl` */
export function valueEdit(text: string, decl: Declaration, index: number, value: number): Edit {
  const lit = decl.literals[index];
  return { start: lit.start, end: lit.end, text: format(value, text.slice(lit.start, lit.end), decl.type) };
}

/** the edits that turn a scalar `const` into a typed `let`, so a tuning build can set it */
export function mutableEdits(decl: Declaration, type: string): Edit[] {
  const edits: Edit[] = [{ start: decl.constAt, end: decl.constAt + 5, text: "let" }];
  if (!decl.type) edits.push({ start: decl.nameEnd, end: decl.nameEnd, text: `: ${type}` });
  return edits;
}

/** applies non-overlapping edits */
export function applyEdits(text: string, edits: Edit[]): string {
  const sorted = [...edits].sort((a, b) => b.start - a.start);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].end > sorted[i - 1].start) throw new Error("overlapping source edits");
  }
  let out = text;
  for (const e of sorted) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  return out;
}
