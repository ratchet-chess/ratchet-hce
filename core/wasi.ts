/**
 * The WASI build's system calls: the seven `wasi_snapshot_preview1` functions it
 * imports, and the input and output buffers the UCI loop reads and writes. Every
 * buffer is static memory, because the stub runtime never frees.
 *
 * The layouts are WASI preview 1's (WebAssembly/WASI, legacy/preview1/docs.md):
 * an iovec is { buf: u32, len: u32 }; a subscription is 48 bytes, its tag at 8 and
 * its union at 16; an event is 32 bytes, its error at 8 and its type at 10.
 */

@external("wasi_snapshot_preview1", "fd_read")
declare function fd_read(fd: u32, iovs: usize, iovsLen: u32, nread: usize): u16;
@external("wasi_snapshot_preview1", "fd_write")
declare function fd_write(fd: u32, iovs: usize, iovsLen: u32, nwritten: usize): u16;
@external("wasi_snapshot_preview1", "poll_oneoff")
declare function poll_oneoff(subs: usize, events: usize, n: u32, nevents: usize): u16;
@external("wasi_snapshot_preview1", "clock_time_get")
declare function clock_time_get(id: u32, precision: u64, time: usize): u16;
@external("wasi_snapshot_preview1", "args_sizes_get") declare function args_sizes_get(argc: usize, bufSize: usize): u16;
@external("wasi_snapshot_preview1", "args_get") declare function args_get(argv: usize, buf: usize): u16;
@external("wasi_snapshot_preview1", "proc_exit") declare function proc_exit(code: u32): void;

const CLOCK_MONOTONIC: u32 = 1;
const EVENT_CLOCK: u8 = 0;
const EVENT_FD_READ: u8 = 1;

/** scratch for a call's iovec, counts and time */
const io = memory.data(16, 8);
/** two subscriptions, then two events */
const subs = memory.data(2 * 48, 8);
const events = memory.data(2 * 32, 8);

// ------------------------------------------------------------------ input

/** the input buffer's size: a line longer than this is refused */
export const IN_CAP: i32 = 1 << 20;
/** stdin's bytes not yet handled lie in [0, inEnd): a handled line is cut out, so the buffer always starts at 0 */
export const IN = memory.data(IN_CAP);
export let inEnd = 0;

/** removes the bytes [from, to) from the input, keeping those around them in order */
export function cutInput(from: i32, to: i32): void {
  memory.copy(IN + <usize>from, IN + <usize>to, <usize>(inEnd - to));
  inEnd -= to - from;
}

/**
 * Reads what stdin has into the buffer: waits for input when `wait` is set,
 * else reads only what is already waiting. Returns the bytes read; -1 at the
 * end of input.
 */
export function readInput(wait: bool): i32 {
  if (!wait && !inputWaiting()) return 0;
  if (inEnd == IN_CAP) fail("an input line is longer than the buffer");
  store<u32>(io, <u32>(IN + <usize>inEnd));
  store<u32>(io, <u32>(IN_CAP - inEnd), 4);
  if (fd_read(0, io, 1, io + 8) != 0) return -1;
  const n = <i32>load<u32>(io, 8);
  if (n == 0) return -1;
  inEnd += n;
  return n;
}

/** whether stdin has input, or its end, waiting now: a poll with a zero timeout */
function inputWaiting(): bool {
  memory.fill(subs, 0, 2 * 48);
  store<u64>(subs, 1);
  store<u8>(subs, EVENT_FD_READ, 8);
  store<u32>(subs, 0, 16);
  store<u64>(subs + 48, 2);
  store<u8>(subs + 48, EVENT_CLOCK, 8);
  store<u32>(subs + 48, CLOCK_MONOTONIC, 16);
  if (poll_oneoff(subs, events, 2, io) != 0) return false;
  const n = load<u32>(io);
  for (let i: u32 = 0; i < n; i++) {
    const e = events + <usize>i * 32;
    if (load<u8>(e, 10) == EVENT_FD_READ) return true;
  }
  return false;
}

/** waits `ms` milliseconds, or until input arrives */
export function sleepMs(ms: f64): void {
  if (ms <= 0) return;
  memory.fill(subs, 0, 2 * 48);
  store<u64>(subs, 1);
  store<u8>(subs, EVENT_FD_READ, 8);
  store<u32>(subs, 0, 16);
  store<u64>(subs + 48, 2);
  store<u8>(subs + 48, EVENT_CLOCK, 8);
  store<u32>(subs + 48, CLOCK_MONOTONIC, 16);
  store<u64>(subs + 48, <u64>(ms * 1e6), 24);
  poll_oneoff(subs, events, 2, io);
}

// ------------------------------------------------------------------ output

const OUT_CAP: i32 = 1 << 16;
const OUT = memory.data(OUT_CAP);
let outLen = 0;

/** appends one byte to the line being written */
export function putByte(b: i32): void {
  if (outLen < OUT_CAP) store<u8>(OUT + <usize>(outLen++), <u8>b);
}

/** appends an ASCII string */
export function put(s: string): void {
  for (let i = 0, n = s.length; i < n; i++) putByte(s.charCodeAt(i));
}

/** appends `len` bytes from `ptr` */
export function putBytes(ptr: usize, len: i32): void {
  for (let i = 0; i < len; i++) putByte(load<u8>(ptr + <usize>i));
}

/** appends a whole number */
export function putInt(v: i64): void {
  if (v < 0) {
    putByte(45);
    v = -v;
  }
  if (v >= 10) putInt(v / 10);
  putByte(<i32>(v % 10) + 48);
}

/** ends the line and writes it to `fd`: 1 for stdout, 2 for stderr */
export function endLine(fd: u32 = 1): void {
  putByte(10);
  let at: i32 = 0;
  while (at < outLen) {
    store<u32>(io, <u32>(OUT + <usize>at));
    store<u32>(io, <u32>(outLen - at), 4);
    if (fd_write(fd, io, 1, io + 8) != 0) break;
    at += <i32>load<u32>(io, 8);
  }
  outLen = 0;
}

// ------------------------------------------------------------------ process

/** the monotonic clock in milliseconds */
export function nowMs(): f64 {
  clock_time_get(CLOCK_MONOTONIC, 1000, io);
  return <f64>load<u64>(io) / 1e6;
}

/** ends the process with `code` */
export function exit(code: u32): void {
  proc_exit(code);
}

/** writes `why` to stderr and ends the process with code 1, as the TypeScript host does on an error */
export function fail(why: string): void {
  outLen = 0;
  put("error: ");
  put(why);
  endLine(2);
  proc_exit(1);
}

/**
 * The WASI build's `abort`, in place of the JavaScript host's `env.abort`
 * (tools/build.sh `--use abort=`): writes the message and its place to stderr
 * and ends the process with code 1.
 */
export function abortWasi(msg: string | null, file: string | null, line: u32, col: u32): void {
  outLen = 0;
  put("abort: ");
  if (msg) put(msg);
  put(" at ");
  if (file) put(file);
  putByte(58);
  putInt(line);
  putByte(58);
  putInt(col);
  endLine(2);
  proc_exit(1);
}

const ARGS_CAP: i32 = 4096;
const ARGV = memory.data(64 * 4, 4);
const ARGBUF = memory.data(ARGS_CAP);
/** the number of command-line arguments, the program's name included */
export let argc = 0;

/** reads the command line; one of more than 64 arguments or ARGS_CAP bytes is dropped whole */
export function readArgs(): void {
  if (args_sizes_get(io, io + 4) != 0) return;
  const n = load<u32>(io);
  const size = load<u32>(io, 4);
  if (n > 64 || size > <u32>ARGS_CAP) return;
  if (args_get(ARGV, ARGBUF) != 0) return;
  argc = <i32>n;
}

/** argument `i`'s address; it ends at a zero byte */
export function arg(i: i32): usize {
  return <usize>load<u32>(ARGV + <usize>i * 4);
}
