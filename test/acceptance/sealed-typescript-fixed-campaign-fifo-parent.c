/* DISABLED campaign-fifo-parent-primitive@1; source data, no main or authorized invocation.
 * Adapted from fixedFifoTestParentSource in descriptor-control.mjs. This is NOT
 * an enclosing interval: no existing private BEGIN/END/actor-closure adoption
 * exists here. A future reviewed integration must prepare native capture before
 * the ORIGINAL prepared BEGIN, call only after that BEGIN, establish ALL owned
 * actors gone before matching END, then publish only AFTER END. None is minted
 * or simulated. There is deliberately no write/stdio publication function.
 * Direct-child reap and pipe EOF do not establish all-actor closure. Killing the
 * direct child cannot clean descendants; no new process group is introduced.
 * Native capture 0..2 stays private in this parent; child 1/2 are real FIFOs.
 * Own pre-main loader, capture namespace and complete SDK closure are unproven.
 */
#define _DARWIN_C_SOURCE 1
#include <stddef.h>
#include <stdint.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/stat.h>
#include <sys/wait.h>
#include <spawn.h>
#include <signal.h>
#include <errno.h>
#include <poll.h>
#include <time.h>
extern char **environ;
static const char launcher[] = "__REVIEWED_FIXED_CAMPAIGN_LAUNCHER__";
#define OUT_LIMIT 32768
#define ERR_LIMIT 4096
/* Private memory only. No serialization, authority adoption or public result. */
struct redue_fifo_memory {
  int failed, timed_out, direct_reaped, handles_closed, out_eof, err_eof;
  int kernel_exit_known, kernel_exit, kernel_signal_known, kernel_signal;
  size_t out_used, err_used;
  unsigned char out_bytes[OUT_LIMIT], err_bytes[ERR_LIMIT];
};
static uint64_t milliseconds(void) {
  struct timespec t;
  if (clock_gettime(CLOCK_MONOTONIC, &t) != 0 || t.tv_sec < 0 || t.tv_nsec < 0 ||
      t.tv_nsec >= 1000000000L || (uint64_t)t.tv_sec > (UINT64_MAX - 999) / 1000) return UINT64_MAX;
  return (uint64_t)t.tv_sec * 1000 + (uint64_t)t.tv_nsec / 1000000;
}
static int close_owned(int *fd) {
  if (*fd < 0) return 1;
  const int value = *fd; *fd = -1;
  return close(value) == 0;
}
static int capture(int fd, unsigned char *bytes, size_t limit, size_t *used, int *eof) {
  unsigned char block[128];
  const ssize_t n = read(fd, block, sizeof(block));
  if (n == 0) { *eof = 1; return 1; }
  if (n < 0) return errno == EAGAIN || errno == EINTR;
  if (*used > limit || (size_t)n > limit - *used) return 0;
  memcpy(bytes + *used, block, (size_t)n); *used += (size_t)n; return 1;
}
/* Not externally selected: no command/path/argv/environment/FD parameters.
 * The sole output is private memory. This symbol has NO authorized invocation.
 * A return of any kind remains UNKNOWN / MISSING_BEGIN_END_OR_ACTOR_CLOSURE.
 */
void redue_disabled_fixed_fifo_collect(struct redue_fifo_memory *result) {
  struct redue_fifo_memory r = {0}; r.handles_closed = 1;
  int out[2] = {-1,-1}, err[2] = {-1,-1}, actions_ready = 0, attributes_ready = 0, status = 0;
  pid_t child = 0;
  posix_spawn_file_actions_t actions; posix_spawnattr_t attributes;
  const uint64_t began = milliseconds(); uint64_t last = began;
  if (result == NULL) return;
  if (began == UINT64_MAX || environ == NULL) { r.failed = 1; goto cleanup; }
  /* Require occupied native stdio so pipe endpoints cannot alias 0..2. Their
   * physical metadata/ownership is not inferred, and no capture is opened here. */
  for (int fd = 0; fd < 3; fd++) if (fcntl(fd,F_GETFD) == -1) { r.failed = 1; goto cleanup; }
  struct sigaction disposition;
  if (sigaction(SIGCHLD,NULL,&disposition) != 0 || disposition.sa_handler != SIG_DFL ||
      (disposition.sa_flags & SA_NOCLDWAIT) != 0) { r.failed = 1; goto cleanup; }
#if defined(POSIX_SPAWN_CLOEXEC_DEFAULT)
  if (pipe(out) != 0 || pipe(err) != 0) { r.failed = 1; goto cleanup; }
  for (size_t at = 0; at < 2; at++) {
    const int reader = at == 0 ? out[0] : err[0], writer = at == 0 ? out[1] : err[1];
    struct stat s; const int flags = fcntl(writer,F_GETFL), read_flags = fcntl(reader,F_GETFL);
    if (reader <= 2 || writer <= 2 || flags == -1 || read_flags == -1 ||
        (flags & O_ACCMODE) != O_WRONLY || (read_flags & O_ACCMODE) != O_RDONLY ||
        fstat(writer,&s) != 0 || !S_ISFIFO(s.st_mode) ||
        fcntl(reader,F_SETFL,read_flags | O_NONBLOCK) != 0) { r.failed = 1; goto cleanup; }
  }
  if (posix_spawn_file_actions_init(&actions) != 0) { r.failed = 1; goto cleanup; } actions_ready = 1;
  if (posix_spawnattr_init(&attributes) != 0) { r.failed = 1; goto cleanup; } attributes_ready = 1;
  if (posix_spawnattr_setflags(&attributes,POSIX_SPAWN_CLOEXEC_DEFAULT) != 0 ||
      posix_spawn_file_actions_addinherit_np(&actions,0) != 0 ||
      posix_spawn_file_actions_adddup2(&actions,out[1],1) != 0 ||
      posix_spawn_file_actions_adddup2(&actions,err[1],2) != 0) { r.failed = 1; goto cleanup; }
  for (size_t at = 0; at < 2; at++) {
    if (posix_spawn_file_actions_addclose(&actions,out[at]) != 0 ||
        posix_spawn_file_actions_addclose(&actions,err[at]) != 0) { r.failed = 1; goto cleanup; }
  }
  char *const fixed_argv[] = {(char *)launcher,NULL};
  if (posix_spawn(&child,launcher,&actions,&attributes,fixed_argv,environ) != 0) {
    child = 0; r.failed = 1; goto cleanup;
  }
  if (child <= 0) { child = 0; r.failed = 1; goto cleanup; }
  if (posix_spawnattr_destroy(&attributes) != 0) r.failed = 1;
  attributes_ready = 0;
  if (posix_spawn_file_actions_destroy(&actions) != 0) r.failed = 1;
  actions_ready = 0;
  /* Do not short circuit either close. EOF requires both parent writers gone. */
  if (!close_owned(&out[1])) { r.handles_closed = 0; r.failed = 1; }
  if (!close_owned(&err[1])) { r.handles_closed = 0; r.failed = 1; }
  while (!r.failed && (!r.direct_reaped || !r.out_eof || !r.err_eof)) {
    const uint64_t now = milliseconds();
    if (now == UINT64_MAX || now < last) { r.failed = 1; break; } last = now;
    if (now - began >= 4000) { r.timed_out = 1; r.failed = 1; break; }
    if (!r.direct_reaped) {
      const pid_t waited = waitpid(child,&status,WNOHANG);
      if (waited == child) r.direct_reaped = 1;
      else if (waited < 0 && errno != EINTR) { r.failed = 1; break; }
    }
    /* Ignore an EOF endpoint entirely; HUP otherwise causes a busy loop. */
    struct pollfd streams[2] = {{r.out_eof ? -1 : out[0],POLLIN,0},{r.err_eof ? -1 : err[0],POLLIN,0}};
    const int ready = poll(streams,2,20);
    if (ready < 0 && errno != EINTR) { r.failed = 1; break; }
    if (ready > 0) for (size_t at = 0; at < 2; at++) {
      if (streams[at].revents & (POLLERR | POLLNVAL)) { r.failed = 1; break; }
      if (streams[at].revents & (POLLIN | POLLHUP)) {
        if (!capture(streams[at].fd,at == 0 ? r.out_bytes : r.err_bytes,
            at == 0 ? OUT_LIMIT : ERR_LIMIT,at == 0 ? &r.out_used : &r.err_used,
            at == 0 ? &r.out_eof : &r.err_eof)) { r.failed = 1; break; }
      }
    }
  }
#else
  r.failed = 1;
#endif
cleanup:
  if (child > 0 && !r.direct_reaped) {
    r.failed = 1;
    if (kill(child,SIGKILL) != 0 && errno != ESRCH) r.failed = 1;
    const uint64_t reap_start = milliseconds();
    for (size_t at = 0; at < 50; at++) {
      const pid_t waited = waitpid(child,&status,WNOHANG);
      if (waited == child) { r.direct_reaped = 1; break; }
      if (waited < 0 && errno != EINTR) break;
      const uint64_t now = milliseconds();
      if (reap_start == UINT64_MAX || now == UINT64_MAX || now < reap_start || now - reap_start >= 500) break;
      (void)poll(NULL,0,10);
    }
  }
  if (attributes_ready && posix_spawnattr_destroy(&attributes) != 0) r.failed = 1;
  if (actions_ready && posix_spawn_file_actions_destroy(&actions) != 0) r.failed = 1;
  for (size_t at = 0; at < 2; at++) {
    if (!close_owned(&out[at])) { r.handles_closed = 0; r.failed = 1; }
    if (!close_owned(&err[at])) { r.handles_closed = 0; r.failed = 1; }
  }
  const uint64_t finished = milliseconds();
  if (began == UINT64_MAX || finished == UINT64_MAX || finished < last || finished - began >= 4500) { r.timed_out = 1; r.failed = 1; }
  /* Preserve only kernel-derived direct-child lifecycle; never guess an exit. */
  if (r.direct_reaped) {
    if (WIFEXITED(status)) { r.kernel_exit_known = 1; r.kernel_exit = WEXITSTATUS(status); }
    else if (WIFSIGNALED(status)) { r.kernel_signal_known = 1; r.kernel_signal = WTERMSIG(status); }
    else r.failed = 1;
  }
  *result = r; /* memory copy only; no capture output even after direct reap */
}
