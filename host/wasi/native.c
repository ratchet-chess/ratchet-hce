/*
 * The native host of a WASI build: a WASI build translated to C by wasm2c, with
 * the seven WASI preview-1 calls it imports (core/wasi.ts) answered here. The
 * result is a native UCI engine with no runtime.
 *
 *   wasm2c build/wasi/ratchet.wasm -n engine -o engine.c
 *   cc -O3 -I<wabt include> -I. engine.c host/wasi/native.c <wabt>/wasm-rt-impl.c <wabt>/wasm-rt-mem-impl.c \
 *     <wabt>/wasm-rt-exceptions-impl.c -lpthread -lm
 *
 * tools/package.ts runs these steps. As in host/wasi/wasi.ts, a reader thread
 * moves stdin into a buffer, and the engine's poll_oneoff reads that buffer
 * without blocking, so a `stop` reaches a running search.
 *
 * The layouts are WASI preview 1's (WebAssembly/WASI, legacy/preview1/docs.md):
 * an iovec is { buf: u32, len: u32 }; a subscription is 48 bytes, its tag at 8,
 * its fd or clock id at 16, a clock's timeout at 24; an event is 32 bytes, its
 * error at 8, its type at 10, a read's byte count at 16 and its flags at 24.
 */
#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <unistd.h>

#include "engine.h"
#include "wasm-rt-exceptions.h"
#include "wasm-rt-impl.h"

#ifdef _WIN32
#include <windows.h>
#endif

#define WASI_ESUCCESS 0
#define WASI_EBADF 8
#define WASI_EINVAL 28
#define EVENT_CLOCK 0
#define EVENT_FD_READ 1
#define HANGUP 1

struct w2c_wasi__snapshot__preview1 {
  int unused;
};

static w2c_engine engine;
static int argCount;
static char **argValues;

static u8 *mem(void) { return w2c_engine_memory(&engine)->data; }
static u32 getU32(u32 at) { u32 v; memcpy(&v, mem() + at, 4); return v; }
static u64 getU64(u32 at) { u64 v; memcpy(&v, mem() + at, 8); return v; }
static void setU32(u32 at, u32 v) { memcpy(mem() + at, &v, 4); }
static void setU64(u32 at, u64 v) { memcpy(mem() + at, &v, 8); }

/* ------------------------------------------------------------------ stdin */

#define IN_CAP (1 << 20)
static unsigned char input[IN_CAP];
static size_t inputStart, inputCount;
static int inputClosed;
static pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;
static pthread_cond_t changed = PTHREAD_COND_INITIALIZER;

/*
 * reads stdin's next bytes into `chunk`, waiting for them; 0 at its end. On Windows it reads the handle with
 * ReadFile, and only a failed read, or 0 bytes from a disk file, is the end. A GUI's anonymous pipe blocks in
 * ReadFile until input comes. Under Wine a Unix pipe is not typed as a pipe and returns 0 bytes while it is
 * empty, as the C library's read() then does too, so such a read is retried after a millisecond.
 */
static long readChunk(unsigned char *chunk, unsigned long cap) {
#ifdef _WIN32
  HANDLE in = GetStdHandle(STD_INPUT_HANDLE);
  int disk = GetFileType(in) == FILE_TYPE_DISK;
  for (;;) {
    DWORD got = 0;
    if (!ReadFile(in, chunk, cap, &got, NULL)) return 0;
    if (got > 0 || disk) return (long)got;
    Sleep(1);
  }
#else
  return (long)read(0, chunk, cap);
#endif
}

/* moves stdin into the buffer until its end; waits while the buffer is full */
static void *readStdin(void *unused) {
  (void)unused;
  unsigned char chunk[4096];
  for (;;) {
    long n = readChunk(chunk, sizeof chunk);
    pthread_mutex_lock(&lock);
    if (n <= 0) {
      inputClosed = 1;
      pthread_cond_broadcast(&changed);
      pthread_mutex_unlock(&lock);
      return NULL;
    }
    for (long i = 0; i < n; i++) {
      while (inputCount == IN_CAP) pthread_cond_wait(&changed, &lock);
      input[(inputStart + inputCount++) % IN_CAP] = chunk[i];
    }
    pthread_cond_broadcast(&changed);
    pthread_mutex_unlock(&lock);
  }
}

/* waits, holding the lock, until input is waiting or has ended, or until `deadline` if it is not NULL */
static void waitInput(const struct timespec *deadline) {
  while (inputCount == 0 && !inputClosed) {
    if (!deadline) pthread_cond_wait(&changed, &lock);
    else if (pthread_cond_timedwait(&changed, &lock, deadline) != 0) return;
  }
}

/* ------------------------------------------------------------------ the WASI calls */

u32 w2c_wasi__snapshot__preview1_args_sizes_get(struct w2c_wasi__snapshot__preview1 *w, u32 argc, u32 size) {
  (void)w;
  u32 total = 0;
  for (int i = 0; i < argCount; i++) total += (u32)strlen(argValues[i]) + 1;
  setU32(argc, (u32)argCount);
  setU32(size, total);
  return WASI_ESUCCESS;
}

u32 w2c_wasi__snapshot__preview1_args_get(struct w2c_wasi__snapshot__preview1 *w, u32 argv, u32 buf) {
  (void)w;
  for (int i = 0; i < argCount; i++) {
    size_t n = strlen(argValues[i]) + 1;
    setU32(argv + 4 * (u32)i, buf);
    memcpy(mem() + buf, argValues[i], n);
    buf += (u32)n;
  }
  return WASI_ESUCCESS;
}

u32 w2c_wasi__snapshot__preview1_clock_time_get(struct w2c_wasi__snapshot__preview1 *w, u32 id, u64 precision, u32 out) {
  (void)w;
  (void)precision;
  struct timespec t;
  clock_gettime(id == 0 ? CLOCK_REALTIME : CLOCK_MONOTONIC, &t);
  setU64(out, (u64)t.tv_sec * 1000000000u + (u64)t.tv_nsec);
  return WASI_ESUCCESS;
}

u32 w2c_wasi__snapshot__preview1_fd_read(struct w2c_wasi__snapshot__preview1 *w, u32 fd, u32 iovs, u32 iovsLen, u32 nread) {
  (void)w;
  if (fd != 0) return WASI_EBADF;
  pthread_mutex_lock(&lock);
  waitInput(NULL);
  u32 n = 0;
  for (u32 i = 0; i < iovsLen && inputCount > 0; i++) {
    u32 buf = getU32(iovs + 8 * i);
    u32 len = getU32(iovs + 8 * i + 4);
    for (u32 k = 0; k < len && inputCount > 0; k++, n++) {
      mem()[buf + k] = input[inputStart];
      inputStart = (inputStart + 1) % IN_CAP;
      inputCount--;
    }
  }
  pthread_cond_broadcast(&changed);
  pthread_mutex_unlock(&lock);
  setU32(nread, n);
  return WASI_ESUCCESS;
}

u32 w2c_wasi__snapshot__preview1_fd_write(struct w2c_wasi__snapshot__preview1 *w, u32 fd, u32 iovs, u32 iovsLen, u32 nwritten) {
  (void)w;
  if (fd != 1 && fd != 2) return WASI_EBADF;
  FILE *f = fd == 1 ? stdout : stderr;
  u32 n = 0;
  for (u32 i = 0; i < iovsLen; i++) {
    u32 len = getU32(iovs + 8 * i + 4);
    n += (u32)fwrite(mem() + getU32(iovs + 8 * i), 1, len, f);
  }
  fflush(f);
  setU32(nwritten, n);
  return WASI_ESUCCESS;
}

/* stdin's readiness and relative clock timeouts: the two subscriptions a UCI loop needs */
u32 w2c_wasi__snapshot__preview1_poll_oneoff(struct w2c_wasi__snapshot__preview1 *w, u32 subs, u32 events, u32 n, u32 nevents) {
  (void)w;
  int readSub = -1, clockSub = -1;
  u64 timeout = UINT64_MAX;
  for (u32 i = 0; i < n; i++) {
    u32 s = subs + 48 * i;
    u8 tag = mem()[s + 8];
    if (tag == EVENT_FD_READ && getU32(s + 16) == 0) readSub = (int)i;
    else if (tag == EVENT_CLOCK) {
      u64 t = getU64(s + 24);
      if (t < timeout) {
        timeout = t;
        clockSub = (int)i;
      }
    } else return WASI_EINVAL;
  }
  pthread_mutex_lock(&lock);
  if (readSub >= 0 && inputCount == 0 && !inputClosed && timeout > 0) {
    if (timeout == UINT64_MAX) waitInput(NULL);
    else {
      struct timespec d;
      clock_gettime(CLOCK_REALTIME, &d);
      u64 ns = (u64)d.tv_nsec + timeout % 1000000000u;
      d.tv_sec += (time_t)(timeout / 1000000000u + ns / 1000000000u);
      d.tv_nsec = (long)(ns % 1000000000u);
      waitInput(&d);
    }
  } else if (readSub < 0 && timeout != UINT64_MAX && timeout > 0) {
    struct timespec d = {(time_t)(timeout / 1000000000u), (long)(timeout % 1000000000u)};
    pthread_mutex_unlock(&lock);
    nanosleep(&d, NULL);
    pthread_mutex_lock(&lock);
  }
  int ready = readSub >= 0 && (inputCount > 0 || inputClosed);
  int hit = ready ? readSub : clockSub;
  size_t waiting = inputCount;
  int closed = inputClosed;
  pthread_mutex_unlock(&lock);
  if (hit < 0) {
    setU32(nevents, 0);
    return WASI_ESUCCESS;
  }
  memset(mem() + events, 0, 32);
  setU64(events, getU64(subs + 48 * (u32)hit));
  mem()[events + 10] = hit == readSub ? EVENT_FD_READ : EVENT_CLOCK;
  if (hit == readSub) {
    setU64(events + 16, waiting);
    u16 flags = closed ? HANGUP : 0;
    memcpy(mem() + events + 24, &flags, 2);
  }
  setU32(nevents, 1);
  return WASI_ESUCCESS;
}

void w2c_wasi__snapshot__preview1_proc_exit(struct w2c_wasi__snapshot__preview1 *w, u32 code) {
  (void)w;
  fflush(stdout);
  fflush(stderr);
  exit((int)code);
}

/* ------------------------------------------------------------------ main */

int main(int argc, char **argv) {
  argCount = argc;
  argValues = argv;
  pthread_t reader;
  pthread_create(&reader, NULL, readStdin, NULL);
  pthread_detach(reader);
  wasm_rt_init();
  struct w2c_wasi__snapshot__preview1 wasi = {0};
  wasm2c_engine_instantiate(&engine, &wasi);
  wasm_rt_trap_t trap = wasm_rt_impl_try();
  if (trap != WASM_RT_TRAP_NONE) {
    fprintf(stderr, "trap: %s\n", wasm_rt_strerror(trap));
    return 1;
  }
  w2c_engine_0x5Fstart(&engine);
  fflush(stdout);
  return 0;
}
