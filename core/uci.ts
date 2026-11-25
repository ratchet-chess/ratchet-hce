/**
 * The WASI build's UCI front end: the conversation a GUI or a match runner holds
 * with the engine over stdin and stdout. It is the AssemblyScript form of
 * host/uci/main.ts and host/uci/worker.ts, and says what they say, line for
 * line, so a release plays alike behind either. bin/ratchet starts a release's
 * WASI build when it has one, and host/uci otherwise.
 *
 * A release's `wasi.ts` fills a UciEngine with its functions and calls uciMain.
 * The search reaches this file through core/host.ts: its clock (uciClock), its
 * check for waiting input (uciPoll) and its report after each iteration
 * (uciIteration).
 *
 * Every text is read in place from the input buffer and written byte by byte, so
 * nothing is allocated per line: the stub runtime never frees, and a match runner
 * keeps one process for many games.
 *
 * The command line takes `--nodestime N` (host/uci/main.ts) and `bench [depth]`,
 * which searches bench/positions.txt as bench/search.ts does and prints Stockfish's
 * bench summary.
 */
import { FLAG_CASTLE } from "./constants";
import { BENCH_FENS } from "./bench-fens";
import { IN, arg, argc, cutInput, endLine, exit, fail, inEnd, nowMs, put, putByte, putInt, readArgs, readInput } from "./wasi";

/** a release's functions, as the UCI front end calls them; host/wasm.ts Engine wraps the same exports */
export class UciEngine {
  /** the program's name in `id name` */
  name: string = "Ratchet";
  /** the own engine's version, major << 16 | minor << 8 | patch; -1 for a release, which has none */
  version: i32 = -1;
  /** the depth of each search in `bench`: bench/search.ts DEPTH */
  benchDepth: i32 = 1;
  /** whether the build plays Chess960, which needs setCastleRooks */
  chess960: bool = false;
  /** whether the build reports its table's fill */
  hasHashfull: bool = false;
  /** whether the build keeps a record of its time use */
  hasTimeTrace: bool = false;
  /** whether the build takes a node limit, from `go nodes`, through setNodeLimit */
  hasNodeLimit: bool = false;
  clear!: () => void;
  put!: (s: i32, p: i32) => void;
  setState!: (side: i32, castling: i32, ep: i32, halfmove: i32, fullmove: i32) => void;
  setCastleRooks!: (whiteKing: i32, blackKing: i32, r1: i32, r2: i32, r4: i32, r8: i32) => void;
  playMove!: (m: i32) => void;
  legalMoves!: () => i32;
  rootMove!: (i: i32) => i32;
  /** a fresh search to a depth, as bench/search.ts runs one */
  go!: (depth: i32) => i32;
  /** one `go` of a game; a limit not given is negative */
  goClock!: (timeMs: f64, incMs: f64, movesToGo: i32, moveTimeMs: f64, depth: i32) => i32;
  /** the node limit of the next goClock, which clears it */
  setNodeLimit!: (nodes: f64) => void;
  setHash!: (mb: i32) => void;
  newGame!: () => void;
  pvLength!: () => i32;
  pvMove!: (i: i32) => i32;
  nodes!: () => f64;
  hashfull!: () => i32;
  evaluate!: () => i32;
  timeTrace!: (field: i32) => f64;
}

let engine = changetype<UciEngine>(0);

const MATE = 32000;
const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// ------------------------------------------------------------------ the search's calls

/** nodes per millisecond of the engine's own clock under --nodestime, else 0 (host/uci/worker.ts nodesTime) */
let nodesTime: f64 = 0;
/** whether a stop has arrived since the last go */
let stopped = false;
/** whether the search under way has no limit of its own, so only a stop or the end of input ends it */
let unbounded = false;
/** whether stdin has ended: no more input comes, so a search under way is the last */
let inputEnded = false;
/** the wall clock at the go, for the info lines' time and nps */
let goStart: f64 = 0;
/** set during `bench`, whose searches neither report nor read input */
let quiet = false;

/** the search's clock: wall time, or under --nodestime its nodes as time */
@global export function uciClock(nodes: f64): f64 {
  return nodesTime > 0 ? nodes / nodesTime : nowMs();
}

/**
 * Reads waiting input during a search, answers isready, and returns 1 once the
 * search must end: on a stop, or at the end of input when the search is unbounded.
 * A bounded search runs on at the end of input, so its `go` still gets a bestmove.
 */
@global export function uciPoll(): i32 {
  if (quiet) return 0;
  if (!inputEnded && readInput(false) < 0) {
    inputEnded = true;
    if (unbounded) stopped = true;
  }
  scanWhileSearching();
  return stopped ? 1 : 0;
}

/** the info line of an iteration's line, finished or cut and kept (host/uci/worker.ts onIteration) */
@global export function uciIteration(depth: i32, score: i32, nodes: f64): i32 {
  if (quiet) return 0;
  const ms = nowMs() - goStart;
  put("info depth ");
  putInt(depth);
  put(" score ");
  putScore(score);
  put(" nodes ");
  putInt(<i64>nodes);
  put(" nps ");
  putInt(<i64>Math.round((nodes * 1000) / Math.max(ms, 1)));
  if (engine.hasHashfull) {
    put(" hashfull ");
    putInt(engine.hashfull());
  }
  put(" time ");
  putInt(<i64>Math.round(ms));
  put(" pv");
  const n = engine.pvLength();
  if (n == 0) putByte(32);
  for (let i = 0; i < n; i++) {
    putByte(32);
    putMove(engine.pvMove(i));
  }
  endLine();
  return 0;
}

function putScore(s: i32): void {
  if (s > MATE - 256) {
    put("mate ");
    putInt((MATE - s + 1) / 2);
  } else if (s < -MATE + 256) {
    put("mate -");
    putInt((MATE + s + 1) / 2);
  } else {
    put("cp ");
    putInt(s);
  }
}

// ------------------------------------------------------------------ reading lines

/** the end of the command being run: during its search, the lines in [queueFrom, scanFrom) wait for the main loop */
let queueFrom = 0;
/** the start of input not yet scanned during a search */
let scanFrom = 0;
/** the token cursor: the line ends at lineEnd; the current token is [tokStart, tokStart + tokLen) */
let cursor = 0;
let lineEnd = 0;
let tokStart = 0;
let tokLen = 0;

function byteAt(i: i32): i32 {
  return <i32>load<u8>(IN + <usize>i);
}

function isSpace(b: i32): bool {
  return b == 32 || b == 9 || b == 13;
}

/** the index of the next newline at or after `from`, or -1 */
function newlineFrom(from: i32): i32 {
  for (let i = from; i < inEnd; i++) if (byteAt(i) == 10) return i;
  return -1;
}

/** points the cursor at the line [from, to) */
function startLine(from: i32, to: i32): void {
  cursor = from;
  lineEnd = to;
  tokLen = 0;
}

/** moves to the line's next token; false at its end */
function nextToken(): bool {
  while (cursor < lineEnd && isSpace(byteAt(cursor))) cursor++;
  tokStart = cursor;
  while (cursor < lineEnd && !isSpace(byteAt(cursor))) cursor++;
  tokLen = cursor - tokStart;
  return tokLen > 0;
}

/** whether the current token is `s` */
function tokenIs(s: string): bool {
  if (tokLen != s.length) return false;
  for (let i = 0; i < tokLen; i++) if (byteAt(tokStart + i) != s.charCodeAt(i)) return false;
  return true;
}

/** the current token as a number, as JavaScript's Number reads a whole or decimal one; NaN if it is not one */
function tokenNumber(): f64 {
  let i = 0;
  let sign: f64 = 1;
  if (i < tokLen && (byteAt(tokStart) == 45 || byteAt(tokStart) == 43)) {
    if (byteAt(tokStart) == 45) sign = -1;
    i++;
  }
  let v: f64 = 0;
  let digits = 0;
  while (i < tokLen && byteAt(tokStart + i) >= 48 && byteAt(tokStart + i) <= 57) {
    v = v * 10 + <f64>(byteAt(tokStart + i++) - 48);
    digits++;
  }
  if (i < tokLen && byteAt(tokStart + i) == 46) {
    i++;
    let scale: f64 = 0.1;
    while (i < tokLen && byteAt(tokStart + i) >= 48 && byteAt(tokStart + i) <= 57) {
      v += <f64>(byteAt(tokStart + i++) - 48) * scale;
      scale /= 10;
      digits++;
    }
  }
  return digits > 0 && i == tokLen ? sign * v : NaN;
}

/** the next token as a number; NaN if there is none */
function nextNumber(): f64 {
  return nextToken() ? tokenNumber() : NaN;
}

/**
 * During a search: acts on each complete waiting `stop` and `quit` and removes
 * it; leaves any other line for the main loop, in order. An `isready` is answered
 * only when no line waits ahead of it, since its `readyok` tells a GUI that the
 * earlier lines were handled.
 */
function scanWhileSearching(): void {
  for (;;) {
    const nl = newlineFrom(scanFrom);
    if (nl < 0) return;
    startLine(scanFrom, nl);
    nextToken();
    if (tokenIs("isready") && scanFrom == queueFrom) {
      put("readyok");
      endLine();
      cutInput(scanFrom, nl + 1);
    } else if (tokenIs("stop")) {
      stopped = true;
      cutInput(scanFrom, nl + 1);
    } else if (tokenIs("quit")) {
      exit(0);
    } else {
      scanFrom = nl + 1;
    }
  }
}

/** after a `go infinite` search: waits until a stop, a quit or the end of input arrives, answering isready meanwhile */
function waitForStop(): void {
  while (!stopped && !inputEnded) {
    if (readInput(true) < 0) inputEnded = true;
    scanWhileSearching();
  }
}

// ------------------------------------------------------------------ positions

/** the loaded position's rook square per right (K, Q, k, q), as move text reads them (host/wasm.ts Engine.rooks) */
const rooks = new StaticArray<i32>(4);
/** the FEN's fields, as host/fen.ts parseFen reads them */
const board = new StaticArray<i32>(64);
const fenRooks = new StaticArray<i32>(4);
let fenSide = 0;
let fenRights = 0;
let fenEp = -1;
let fenHalfmove = 0;
let fenFullmove = 1;
/** the side to move after the position's moves */
let sideToMove = 0;
/** whether castles are written as the king taking its own rook (UCI_Chess960) */
let chess960 = false;

/** right r's rook square in a standard start: K, Q, k, q */
function standardRook(r: i32): i32 {
  return r == 0 ? 7 : r == 1 ? 0 : r == 2 ? 63 : 56;
}

/** the file of `color`'s king on its back rank, the e-file if it is elsewhere (host/fen.ts kingFile) */
function kingFile(color: i32): i32 {
  for (let f = 0; f < 8; f++) if (board[color * 56 + f] == ((color << 3) | 6)) return f;
  return 4;
}

/** `color`'s outermost back-rank rook beyond the king's file in direction `dir`; the corner if none (host/fen.ts outerRook) */
function outerRook(color: i32, dir: i32, king: i32): i32 {
  const rook = (color << 3) | 4;
  for (let f = dir > 0 ? 7 : 0; f != king; f -= dir) if (board[color * 56 + f] == rook) return color * 56 + f;
  return color * 56 + (dir > 0 ? 7 : 0);
}

const FEN_PIECES = "pnbrqk";

/** reads one FEN field, the `field`th, from the bytes [at, at + len) (host/fen.ts parseFen) */
function fenField(field: i32, at: usize, len: i32): void {
  if (field == 0) {
    let rank = 7;
    let file = 0;
    for (let i = 0; i < len; i++) {
      const c = <i32>load<u8>(at + <usize>i);
      if (c == 47) {
        rank--;
        file = 0;
      } else if (c >= 49 && c <= 56) {
        file += c - 48;
      } else {
        const lower = c >= 65 && c <= 90 ? c + 32 : c;
        let type = 0;
        for (let k = 0; k < 6; k++) if (FEN_PIECES.charCodeAt(k) == lower) type = k + 1;
        if (type == 0) fail("bad FEN piece");
        const color = c == lower ? 1 : 0;
        const s = rank * 8 + file;
        if (s >= 0 && s < 64) board[s] = (color << 3) | type;
        file++;
      }
    }
  } else if (field == 1) {
    fenSide = len == 1 && load<u8>(at) == 98 ? 1 : 0;
  } else if (field == 2) {
    for (let i = 0; i < len; i++) {
      const c = <i32>load<u8>(at + <usize>i);
      const lower = c >= 65 && c <= 90 ? c + 32 : c;
      const color = c == lower ? 1 : 0;
      const k = kingFile(color);
      let r = -1;
      let sq = -1;
      if (lower == 107 || lower == 113) {
        r = (color << 1) | (lower == 113 ? 1 : 0);
        sq = outerRook(color, r & 1 ? -1 : 1, k);
      } else if (lower >= 97 && lower <= 104) {
        const file = lower - 97;
        r = (color << 1) | (file < k ? 1 : 0);
        sq = color * 56 + file;
      }
      // a right whose king or rook is not home is dropped (host/fen.ts parseFen)
      if (r < 0 || board[color * 56 + k] != ((color << 3) | 6) || board[sq] != ((color << 3) | 4)) continue;
      fenRights |= 1 << r;
      fenRooks[r] = sq;
    }
  } else if (field == 3) {
    if (len >= 2) fenEp = (<i32>load<u8>(at, 1) - 49) * 8 + (<i32>load<u8>(at) - 97);
  } else if (field == 4 || field == 5) {
    let v = 0;
    let ok = len > 0;
    for (let i = 0; i < len; i++) {
      const c = <i32>load<u8>(at + <usize>i);
      if (c < 48 || c > 57) ok = false;
      else v = v * 10 + c - 48;
    }
    if (field == 4) fenHalfmove = ok ? v : 0;
    else fenFullmove = ok && v != 0 ? v : 1;
  }
}

/** reads the FEN in the bytes [at, at + len) into the fields above */
function readFen(at: usize, len: i32): void {
  for (let s = 0; s < 64; s++) board[s] = 0;
  for (let r = 0; r < 4; r++) fenRooks[r] = -1;
  fenSide = 0;
  fenRights = 0;
  fenEp = -1;
  fenHalfmove = 0;
  fenFullmove = 1;
  let field = 0;
  let i = 0;
  while (i < len && field < 6) {
    while (i < len && isSpace(<i32>load<u8>(at + <usize>i))) i++;
    const start = i;
    while (i < len && !isSpace(<i32>load<u8>(at + <usize>i))) i++;
    if (i > start) fenField(field++, at + <usize>start, i - start);
  }
}

/** loads the FEN just read into the engine, as host/wasm.ts Engine.setPosition does before the moves */
function loadFen(): void {
  engine.clear();
  for (let s = 0; s < 64; s++) if (board[s]) engine.put(s, board[s]);
  engine.setState(fenSide, fenRights, fenEp, fenHalfmove, fenFullmove);
  sideToMove = fenSide;
  if (!engine.chess960) return;
  let whiteKing = 4;
  let blackKing = 60;
  for (let s = 63; s >= 0; s--) {
    if (board[s] == 6) whiteKing = s;
    if (board[s] == 14) blackKing = s;
  }
  for (let r = 0; r < 4; r++) {
    const sq = fenRights & (1 << r) ? fenRooks[r] : -1;
    rooks[r] = sq < 0 ? standardRook(r) : sq;
  }
  engine.setCastleRooks(
    whiteKing, blackKing,
    fenRights & 1 ? fenRooks[0] : 64, fenRights & 2 ? fenRooks[1] : 64, fenRights & 4 ? fenRooks[2] : 64, fenRights & 8 ? fenRooks[3] : 64,
  );
}

const TEXT_CAP = 256;
const TEXT = memory.data(TEXT_CAP);

/** reads the FEN in `s`, a static string such as START_FEN, and loads it */
function loadFenText(s: string): void {
  const n = min(s.length, TEXT_CAP);
  for (let i = 0; i < n; i++) store<u8>(TEXT + <usize>i, <u8>s.charCodeAt(i));
  readFen(TEXT, n);
  loadFen();
}

/** `position [startpos | fen <fen>] [moves <m>...]`, the cursor after `position` (host/uci/main.ts parsePosition) */
function position(): void {
  const at = cursor;
  let movesAt = -1;
  while (nextToken()) {
    if (tokenIs("moves")) {
      movesAt = cursor;
      break;
    }
  }
  const headEnd = movesAt < 0 ? lineEnd : tokStart;
  cursor = at;
  nextToken();
  if (tokenIs("fen")) {
    readFen(IN + <usize>cursor, headEnd - cursor);
    loadFen();
  } else {
    loadFenText(START_FEN);
  }
  if (movesAt < 0) return;
  cursor = movesAt;
  let played = 0;
  while (nextToken()) {
    const n = engine.legalMoves();
    let found = 0;
    for (let i = 0; i < n; i++) {
      const m = engine.rootMove(i);
      if (moveMatches(m)) {
        found = m;
        break;
      }
    }
    if (!found) fail("illegal move");
    engine.playMove(found);
    played++;
  }
  sideToMove = fenSide ^ (played & 1);
}

// ------------------------------------------------------------------ move text

const MOVE = memory.data(8);
const FILES = "abcdefgh";
const PROMO = " pnbrqk";

/**
 * writes move m's UCI text into MOVE and returns its length: a castle as the
 * king's move to its destination, or under UCI_Chess960 as the king taking its
 * own rook (host/wasm.ts moveToUci and Engine.uci)
 */
function moveText(m: i32): i32 {
  const from = m & 63;
  let to = (m >>> 6) & 63;
  if (chess960 && m & FLAG_CASTLE) to = rooks[((to >> 4) & 2) | ((to & 7) == 2 ? 1 : 0)];
  const promo = (m >>> 12) & 7;
  store<u8>(MOVE, <u8>FILES.charCodeAt(from & 7));
  store<u8>(MOVE, <u8>((from >> 3) + 49), 1);
  store<u8>(MOVE, <u8>FILES.charCodeAt(to & 7), 2);
  store<u8>(MOVE, <u8>((to >> 3) + 49), 3);
  if (!promo) return 4;
  store<u8>(MOVE, <u8>PROMO.charCodeAt(promo), 4);
  return 5;
}

function putMove(m: i32): void {
  const n = moveText(m);
  for (let i = 0; i < n; i++) putByte(<i32>load<u8>(MOVE + <usize>i));
}

/** whether the current token is move m's text */
function moveMatches(m: i32): bool {
  const n = moveText(m);
  if (n != tokLen) return false;
  for (let i = 0; i < n; i++) if (<i32>load<u8>(MOVE + <usize>i) != byteAt(tokStart + i)) return false;
  return true;
}

// ------------------------------------------------------------------ go

/** the engine's own remaining time under --nodestime, from the game's first go; NaN before it (host/uci/worker.ts ownMs) */
let ownMs: f64 = NaN;
/**
 * The TimeRecord option: each search then prints the engine's record of its time use as one
 * `info string pgncomment tm ...` line, which fastchess copies into the move's PGN comment under
 * -pgnout match_line (host/uci/worker.ts timeRecord).
 */
let timeRecord = false;

/**
 * `go`, the cursor after it: the side to move's limits pass to the release, which
 * times itself (host/uci/worker.ts go). A node limit goes to a build that takes one;
 * any other ignores it and says so, since no original takes one. In an infinite
 * search the move waits for the GUI's stop.
 */
function go(): void {
  let wtime = NaN, btime = NaN, winc = NaN, binc = NaN, movestogo = NaN, movetime = NaN, depth = NaN, nodes = NaN;
  let infinite = false;
  while (nextToken()) {
    if (tokenIs("wtime")) wtime = nextNumber();
    else if (tokenIs("btime")) btime = nextNumber();
    else if (tokenIs("winc")) winc = nextNumber();
    else if (tokenIs("binc")) binc = nextNumber();
    else if (tokenIs("movestogo")) movestogo = nextNumber();
    else if (tokenIs("movetime")) movetime = nextNumber();
    else if (tokenIs("depth")) depth = nextNumber();
    else if (tokenIs("nodes")) nodes = nextNumber();
    else if (tokenIs("infinite")) infinite = true;
  }
  const nodeLimited = !isNaN(nodes) && engine.hasNodeLimit;
  if (nodeLimited) engine.setNodeLimit(Math.max(0, nodes));
  else if (!isNaN(nodes)) {
    put("info string a release takes no node limit; this one is ignored");
    endLine();
  }
  stopped = false;
  const white = sideToMove == 0;
  // unbounded in the release's own terms: it acts on its own side's clock, a movetime, a depth and a node limit it takes, and on no other limit
  unbounded = infinite || (isNaN(white ? wtime : btime) && isNaN(movetime) && isNaN(depth) && !nodeLimited);
  if (nodesTime > 0) {
    const own = white ? wtime : btime;
    if (!isNaN(own)) {
      if (isNaN(ownMs)) ownMs = own;
      if (white) wtime = ownMs;
      else btime = ownMs;
    }
  }
  const time = white ? wtime : btime;
  const inc = white ? winc : binc;
  goStart = nowMs();
  const best = engine.goClock(
    infinite || isNaN(time) ? -1 : Math.max(0, time),
    isNaN(inc) ? -1 : inc,
    isNaN(movestogo) ? -1 : <i32>movestogo,
    infinite || isNaN(movetime) ? -1 : Math.max(0, movetime),
    isNaN(depth) ? -1 : <i32>depth,
  );
  if (infinite) waitForStop();
  if (nodesTime > 0 && !isNaN(ownMs)) ownMs = Math.max(1, ownMs - engine.nodes() / nodesTime + (isNaN(inc) ? 0 : inc));
  if (timeRecord && engine.hasTimeTrace) timeTrace();
  put("bestmove ");
  if (best) putMove(best);
  else put("0000");
  endLine();
}

const RULES = ["none", "soft", "hard-between", "hard-inside", "host", "nodes"];

/**
 * `info string pgncomment tm ...`: the rule that ended the search, the clock's milliseconds it took, the two
 * limits, the soft limit's score and node factors, and the iterations the veto carried past the soft limit
 * (host/uci/worker.ts go).
 */
function timeTrace(): void {
  const rule = <i32>engine.timeTrace(0);
  put("info string pgncomment tm rule=");
  put(rule >= 0 && rule < RULES.length ? RULES[rule] : "none");
  put(" el=");
  putRounded(engine.timeTrace(1), 1);
  put(" soft=");
  putRounded(engine.timeTrace(2), 1);
  put(" hard=");
  putRounded(engine.timeTrace(3), 1);
  put(" score=");
  putRounded(engine.timeTrace(4), 3);
  put(" node=");
  putRounded(engine.timeTrace(5), 3);
  put(" veto=");
  putInt(<i64>engine.timeTrace(6));
  endLine();
}

/** x to `places` decimals (1 or 3) as JavaScript prints Math.round(x * 10 ** places) / 10 ** places, or "none" beyond 1e15 */
function putRounded(x: f64, places: i32): void {
  if (x > 1e15) {
    put("none");
    return;
  }
  const scale: f64 = places == 1 ? 10 : 1000;
  let k = Math.round(x * scale);
  if (k < 0) {
    putByte(45);
    k = -k;
  }
  const whole = <i64>Math.floor(k / scale);
  let frac = <i32>(k - <f64>whole * scale);
  putInt(whole);
  if (frac == 0) return;
  putByte(46);
  let digits = places;
  while (frac % 10 == 0) {
    frac /= 10;
    digits--;
  }
  for (let d = digits - 1; d >= 0; d--) putByte(<i32>(frac / <i32>Math.pow(10, d)) % 10 + 48);
}

// ------------------------------------------------------------------ the loop

/** the option name after `setoption name`, lowercased, its words joined by one space */
const NAME_CAP = 64;
const NAME = memory.data(NAME_CAP);
let nameLen = 0;

function nameIs(s: string): bool {
  if (nameLen != s.length) return false;
  for (let i = 0; i < nameLen; i++) if (<i32>load<u8>(NAME + <usize>i) != s.charCodeAt(i)) return false;
  return true;
}

/** `setoption name <name> value <value>`, the cursor after `setoption` (host/uci/main.ts) */
function setOption(): void {
  nameLen = 0;
  let inName = false;
  let value: f64 = NaN;
  let valueTrue = false;
  while (nextToken()) {
    if (tokenIs("name")) {
      inName = true;
    } else if (tokenIs("value")) {
      if (nextToken()) {
        value = tokenNumber();
        valueTrue = tokenIs("true");
      }
      break;
    } else if (inName) {
      if (nameLen > 0 && nameLen < NAME_CAP) store<u8>(NAME + <usize>(nameLen++), 32);
      for (let i = 0; i < tokLen && nameLen < NAME_CAP; i++) {
        const c = byteAt(tokStart + i);
        store<u8>(NAME + <usize>(nameLen++), <u8>(c >= 65 && c <= 90 ? c + 32 : c));
      }
    }
  }
  if (nameIs("hash") && !isNaN(value)) engine.setHash(<i32>value);
  if (nameIs("uci_chess960") && engine.chess960) chess960 = valueTrue;
  if (nameIs("timerecord") && engine.hasTimeTrace) timeRecord = valueTrue;
}

function idName(): void {
  put("id name ");
  put(engine.name);
  const v = engine.version;
  if (v < 0) return;
  putByte(32);
  putInt(v >> 16);
  putByte(46);
  putInt((v >> 8) & 255);
  putByte(46);
  putInt(v & 255);
}

/** handles one line, [from, to) of the input */
function command(from: i32, to: i32): void {
  startLine(from, to);
  if (!nextToken()) return;
  if (tokenIs("uci")) {
    idName();
    endLine();
    put("id author the Ratchet contributors");
    endLine();
    put("option name Hash type spin default 16 min 1 max 1024");
    endLine();
    put("option name Threads type spin default 1 min 1 max 1");
    endLine();
    if (engine.chess960) {
      put("option name UCI_Chess960 type check default false");
      endLine();
    }
    if (engine.hasTimeTrace) {
      put("option name TimeRecord type check default false");
      endLine();
    }
    put("uciok");
    endLine();
  } else if (tokenIs("isready")) {
    put("readyok");
    endLine();
  } else if (tokenIs("ucinewgame")) {
    engine.newGame();
    ownMs = NaN;
  } else if (tokenIs("setoption")) {
    setOption();
  } else if (tokenIs("position")) {
    position();
  } else if (tokenIs("go")) {
    go();
  } else if (tokenIs("eval")) {
    put("eval cp ");
    putInt(engine.evaluate());
    endLine();
  } else if (tokenIs("stop")) {
    stopped = true;
  } else if (tokenIs("quit")) {
    exit(0);
  }
}

/** whether command-line argument `i` is `s` */
function argIs(i: i32, s: string): bool {
  const p = arg(i);
  for (let k = 0; k < s.length; k++) if (<i32>load<u8>(p + <usize>k) != s.charCodeAt(k)) return false;
  return load<u8>(p + <usize>s.length) == 0;
}

/**
 * Command-line argument `i` as a number written in digits, with a point and a fraction if it has one; -1 if it
 * is not one. The digits are read as one whole number and divided once by the fraction's power of ten, so the
 * value is the one JavaScript's Number reads from the same text: ratchet-bench's tools/pool.ts passes a node clock's
 * rate in hundredths, and both front ends must count one clock from it.
 */
function argNumber(i: i32): f64 {
  const p = arg(i);
  let v: f64 = 0;
  let scale: f64 = 0;
  let digits = 0;
  for (let k = 0; load<u8>(p + <usize>k) != 0; k++) {
    const c = <i32>load<u8>(p + <usize>k);
    if (c == 46 && scale == 0) {
      scale = 1;
      continue;
    }
    if (c < 48 || c > 57) return -1;
    v = v * 10 + <f64>(c - 48);
    scale *= 10;
    digits++;
  }
  if (digits == 0) return -1;
  return scale > 1 ? v / scale : v;
}

/**
 * `bench [depth]`: a fresh search of every position in bench/positions.txt, as
 * bench/search.ts runs one, so its node count is the build's node signature; then
 * Stockfish's summary lines.
 */
function bench(depth: i32): void {
  quiet = true;
  let nodes: f64 = 0;
  const start = nowMs();
  let at = 0;
  while (at < BENCH_FENS.length) {
    let end = BENCH_FENS.indexOf("\n", at);
    if (end < 0) end = BENCH_FENS.length;
    const n = min(end - at, TEXT_CAP);
    for (let i = 0; i < n; i++) store<u8>(TEXT + <usize>i, <u8>BENCH_FENS.charCodeAt(at + i));
    readFen(TEXT, n);
    loadFen();
    engine.go(depth);
    nodes += engine.nodes();
    at = end + 1;
  }
  const ms = nowMs() - start;
  put("===========================");
  endLine();
  put("Total time (ms) : ");
  putInt(<i64>Math.round(ms));
  endLine();
  put("Nodes searched  : ");
  putInt(<i64>nodes);
  endLine();
  put("Nodes/second    : ");
  putInt(<i64>Math.round((nodes * 1000) / Math.max(ms, 1)));
  endLine();
}

/** runs the UCI conversation until quit or the end of input; the release has run its init */
export function uciMain(e: UciEngine): void {
  engine = e;
  for (let r = 0; r < 4; r++) rooks[r] = standardRook(r);
  readArgs();
  for (let i = 1; i < argc; i++) {
    if (argIs(i, "--nodestime") && i + 1 < argc) {
      nodesTime = argNumber(++i);
      if (!(nodesTime >= 0)) fail("--nodestime needs nodes per millisecond");
    } else if (argIs(i, "bench")) {
      const d = i + 1 < argc ? argNumber(i + 1) : -1;
      bench(d > 0 ? <i32>d : e.benchDepth);
      exit(0);
    }
  }
  loadFenText(START_FEN);
  for (;;) {
    const nl = newlineFrom(0);
    if (nl < 0) {
      if (readInput(true) >= 0) continue;
      queueFrom = scanFrom = inEnd;
      if (inEnd > 0) command(0, inEnd);
      exit(0);
    }
    // a search scans only the input after this line, and cuts only lines there, so [0, nl] stays in place
    queueFrom = scanFrom = nl + 1;
    command(0, nl);
    cutInput(0, nl + 1);
  }
}
