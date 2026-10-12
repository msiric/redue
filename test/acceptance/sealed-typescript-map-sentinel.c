/*
 * SOURCE-ONLY, DISABLED synthetic mapping helper. No general executor/provider.
 * The parent must review and bake exactly TWO canonical owned NONSECRET paths,
 * then pin substituted-source and binary SHA-256 before any native invocation.
 * No argv/stdin/environment/imported path selects operations. argc must be 1.
 *
 * Proposed canonical build (NOT run by these tests): /usr/bin/xcrun clang
 * -std=c11 -O2 -Wall -Wextra -Werror -fstack-protector-strong -arch arm64
 * -mmacosx-version-min=26.0 SOURCE -o OWNED_OUTPUT
 * Fixed reviewed toolchain/SDK, no caller compiler flags or dynamic -D paths;
 * ordinary local build/code/binary currency and parent deadline/reap required.
 *
 * Primary source: Apple xnu-12377.1.9 bsd/kern/kern_mman.c lines590-626
 * binds shared-write maxprot to FWRITE; mprotect lines1232-1238 maps a VM
 * protection failure to EACCES. Apple mmap(2) documents READONLY+SHARED+WRITE
 * EACCES. These are descriptor/VM constraints, NOT evidence of sandbox denial.
 * https://github.com/apple-oss-distributions/xnu/blob/xnu-12377.1.9/bsd/kern/kern_mman.c
 * https://developer.apple.com/library/archive/documentation/System/Conceptual/ManPages_iPhoneOS/man2/mmap.2.html
 * The compiled SDK exposes O_NOFOLLOW_ANY (no symlink in the path).
 *
 * MAP_PRIVATE CoW is not underlying-file mutation and is not a denial gate.
 * Existing writable descriptors/mappings cannot be inferred absent here:
 * trusted fresh staging/reaped preparer/no inherited RW handles are separate
 * parent prerequisites. This helper never reports a seal/reuse authority.
 * No staged store is attempted after an unexpected mapping grant: the exact
 * access grant is a failure without risking a SIGBUS/uncaught mutation.
 */
#define _DARWIN_C_SOURCE 1
#include <sys/types.h>
#include <sys/stat.h>
#include <sys/mman.h>
#include <fcntl.h>
#include <unistd.h>
#include <errno.h>
#include <stdbool.h>
#include <stdio.h>
#include <string.h>

#if !defined(__APPLE__) || !defined(__aarch64__)
#error This source proposal requires the reviewed Darwin arm64 native profile.
#endif
#ifndef O_NOFOLLOW_ANY
#error The reviewed no-symlink path primitive is required.
#endif
_Static_assert(PROT_WRITE == 0x02 && MAP_SHARED == 0x0001, "Reviewed mapping ABI required");
_Static_assert(O_NOFOLLOW != 0 && O_NOFOLLOW_ANY != 0 && O_NONBLOCK != 0, "Reviewed open guards required");
static const char workspace_path[] = "__REVIEWED_WRITABLE_WORKSPACE_MAP_CANARY__";
static const char staged_path[] = "__REVIEWED_STAGED_MAP_CANARY__";
static const unsigned char marker[] = "REDUE_SEALED_SYNTHETIC_CANARY\n";
#define MARKER_BYTES (sizeof(marker) - 1)
#define OPEN_GUARDS (O_NOFOLLOW | O_NOFOLLOW_ANY | O_NONBLOCK | O_CLOEXEC)
#define ROW_COUNT 7
struct row { const char *name, *classification, *errno_code; };
static struct row rows[ROW_COUNT] = {
  {"fixed_fixture_precondition", "NOT_PERFORMED", "NONE"},
  {"workspace_rw_shared_change_restore", "NOT_PERFORMED", "NONE"},
  {"staged_rdwr_acquisition", "NOT_PERFORMED", "NONE"},
  {"staged_readonly_shared_read_mprotect_write", "NOT_PERFORMED", "NONE"},
  {"staged_readonly_shared_write_map", "NOT_PERFORMED", "NONE"},
  {"staged_identity_and_body_preserved", "NOT_PERFORMED", "NONE"},
  {"owned_descriptors_and_mappings_closed", "NOT_PERFORMED", "NONE"}
};
static bool failed = false, cleanup_known = true;
static int cleanup_errno = 0;
static const char *error_name(int error) {
  switch (error) {
    case 0: return "NONE"; case EPERM: return "EPERM"; case EACCES: return "EACCES";
    case ENOENT: return "ENOENT"; case ENOTDIR: return "ENOTDIR"; case ELOOP: return "ELOOP";
    case EINVAL: return "EINVAL"; case ENOMEM: return "ENOMEM"; case ENODEV: return "ENODEV";
    case ENXIO: return "ENXIO"; case EIO: return "EIO"; case EINTR: return "EINTR";
    case EMFILE: return "EMFILE"; case ENFILE: return "ENFILE"; case EBADF: return "EBADF";
    default: return "OTHER";
  }
}
static void observe(size_t index, const char *classification, int error) {
  rows[index].classification = classification; rows[index].errno_code = error_name(error);
}
static void cleanup_failed(int error) {
  cleanup_known = false; if (cleanup_errno == 0) cleanup_errno = error;
}
static bool canonical_path(const char *value) {
  const size_t length = strlen(value);
  if (length < 2 || length > 4096 || value[0] != '/' || strstr(value, "__REVIEWED_") != NULL) return false;
  size_t component = 1;
  for (size_t at = 1; at <= length; at++) {
    const unsigned char c = (unsigned char)value[at];
    if (at < length && (c < 32 || c >= 127 || c == '\\' || c == ':')) return false;
    if (c == '/' || at == length) {
      const size_t count = at - component;
      if (count == 0 || (count == 1 && value[component] == '.') ||
          (count == 2 && value[component] == '.' && value[component + 1] == '.')) return false;
      component = at + 1;
    }
  }
  return true;
}
static bool same_identity(const struct stat *a, const struct stat *b) {
  return a->st_dev == b->st_dev && a->st_ino == b->st_ino && a->st_mode == b->st_mode &&
    a->st_uid == b->st_uid && a->st_nlink == b->st_nlink && a->st_size == b->st_size;
}
static bool same_fingerprint(const struct stat *a, const struct stat *b) {
  return same_identity(a, b) && a->st_mtimespec.tv_sec == b->st_mtimespec.tv_sec &&
    a->st_mtimespec.tv_nsec == b->st_mtimespec.tv_nsec && a->st_ctimespec.tv_sec == b->st_ctimespec.tv_sec &&
    a->st_ctimespec.tv_nsec == b->st_ctimespec.tv_nsec;
}
static bool valid_file(const struct stat *value) {
  return S_ISREG(value->st_mode) && value->st_uid == getuid() && value->st_nlink == 1 &&
    value->st_size == (off_t)MARKER_BYTES && (value->st_mode & 07777) == 0644;
}
static bool fixture_current(int fd, const char *name, const struct stat *before) {
  struct stat descriptor, named; errno = 0;
  return fstat(fd, &descriptor) == 0 && lstat(name, &named) == 0 && valid_file(&descriptor) &&
    valid_file(&named) && same_fingerprint(before, &descriptor) && same_fingerprint(before, &named);
}
static bool exact_marker(int fd) {
  unsigned char bytes[MARKER_BYTES + 1];
  errno = 0; const ssize_t count = pread(fd, bytes, sizeof(bytes), 0);
  return count == (ssize_t)MARKER_BYTES && memcmp(bytes, marker, MARKER_BYTES) == 0;
}
static int fixture_open(const char *name, struct stat *snapshot, int *error) {
  struct stat named; *error = 0;
  if (lstat(name, &named) != 0) { *error = errno; return -1; }
  if (!valid_file(&named)) return -1;
  const int fd = open(name, O_RDONLY | OPEN_GUARDS);
  if (fd < 0) { *error = errno; return -1; }
  errno = 0;
  if (fstat(fd, snapshot) != 0 || !same_fingerprint(&named, snapshot) || !valid_file(snapshot) ||
      !exact_marker(fd) || !fixture_current(fd, name, snapshot)) { *error = errno; if (close(fd) != 0) cleanup_failed(errno); return -1; }
  return fd;
}
// Known observations cannot be erased by a DIFFERENT failed syscall. These
// predicates operate on facts captured independently, not inferred errno alone.
static bool workspace_known_failure(bool changed_known, bool changed, bool restored_known, bool restored, bool metadata_known, bool identity_held) {
  return (changed_known && !changed) || (restored_known && !restored) || (metadata_known && !identity_held);
}
static bool workspace_unknown(bool changed_known, bool restored_known, bool metadata_known, bool changed_sync_ok, bool restored_sync_ok) {
  return !changed_known || !restored_known || !metadata_known || !changed_sync_ok || !restored_sync_ok;
}
static bool workspace_control(int readonly, const struct stat *snapshot) {
  if (!fixture_current(readonly, workspace_path, snapshot)) { observe(1, "UNKNOWN_OR_UNAVAILABLE", 0); return false; }
  const int fd = open(workspace_path, O_RDWR | OPEN_GUARDS);
  if (fd < 0) { const int error = errno; observe(1, "UNKNOWN_OR_UNAVAILABLE", error); return false; }
  struct stat opened; bool complete = false; void *mapping = MAP_FAILED;
  if (fstat(fd, &opened) != 0 || !valid_file(&opened) || !same_fingerprint(snapshot, &opened)) {
    observe(1, "UNKNOWN_OR_UNAVAILABLE", 0); goto done;
  }
  mapping = mmap(NULL, MARKER_BYTES, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
  if (mapping == MAP_FAILED) { const int error = errno; observe(1, "UNKNOWN_OR_UNAVAILABLE", error); goto done; }
  if (memcmp(mapping, marker, MARKER_BYTES) != 0) { observe(1, "ASSERTION_FAILED", 0); failed = true; goto done; }
  volatile unsigned char *bytes = mapping;
  bytes[0] = '!';
  const int changed_sync = msync(mapping, MARKER_BYTES, MS_SYNC); const int changed_error = changed_sync == 0 ? 0 : errno;
  unsigned char observed = 0; const ssize_t changed_count = pread(readonly, &observed, 1, 0);
  const int changed_read_error = changed_count < 0 ? errno : 0; const bool changed_known = changed_count >= 0;
  const bool changed = changed_count == 1 && observed == '!';
  bytes[0] = marker[0];
  const int restored_sync = msync(mapping, MARKER_BYTES, MS_SYNC); const int restored_error = restored_sync == 0 ? 0 : errno;
  unsigned char restored_bytes[MARKER_BYTES + 1]; const ssize_t restored_count = pread(readonly, restored_bytes, sizeof(restored_bytes), 0);
  const int restored_read_error = restored_count < 0 ? errno : 0; const bool restored_known = restored_count >= 0;
  const bool restored = restored_count == (ssize_t)MARKER_BYTES && memcmp(restored_bytes, marker, MARKER_BYTES) == 0;
  struct stat after, named_after;
  const int descriptor_result = fstat(fd, &after); const int descriptor_error = descriptor_result == 0 ? 0 : errno;
  const int named_result = lstat(workspace_path, &named_after); const int named_error = named_result == 0 ? 0 : errno;
  const bool metadata_known = descriptor_result == 0 && named_result == 0;
  const bool identity_held = metadata_known && valid_file(&after) && valid_file(&named_after) &&
    same_identity(snapshot, &after) && same_fingerprint(&after, &named_after);
  const int metadata_error = descriptor_error != 0 ? descriptor_error : named_error;
  const int observation_error = changed_read_error != 0 ? changed_read_error : restored_read_error != 0 ? restored_read_error :
    metadata_error != 0 ? metadata_error : changed_error != 0 ? changed_error : restored_error;
  if (workspace_known_failure(changed_known, changed, restored_known, restored, metadata_known, identity_held)) {
    observe(1, "ASSERTION_FAILED", observation_error); failed = true;
  } else if (workspace_unknown(changed_known, restored_known, metadata_known, changed_sync == 0, restored_sync == 0)) {
    observe(1, "UNKNOWN_OR_UNAVAILABLE", observation_error);
  }
  else { observe(1, "SHARED_CHANGE_AND_RESTORE_OBSERVED", 0); complete = true; }
done:
  if (mapping != MAP_FAILED && munmap(mapping, MARKER_BYTES) != 0) cleanup_failed(errno);
  if (close(fd) != 0) cleanup_failed(errno);
  if (!cleanup_known) complete = false;
  return complete;
}
static void staged_checks(int readonly, const struct stat *snapshot) {
  if (!fixture_current(readonly, staged_path, snapshot) || !exact_marker(readonly)) { observe(2, "UNKNOWN_OR_UNAVAILABLE", 0); return; }
  const int writable = open(staged_path, O_RDWR | OPEN_GUARDS);
  if (writable < 0) {
    const int error = errno;
    observe(2, error == EPERM || error == EACCES ? "DENIED_PERMISSION_ERROR" : "UNKNOWN_OR_UNAVAILABLE", error);
  } else {
    struct stat actual;
    if (fstat(writable, &actual) == 0 && valid_file(&actual) && same_fingerprint(snapshot, &actual)) {
      observe(2, "ACCESS_SUCCEEDED", 0); failed = true;
    } else observe(2, "UNKNOWN_OR_UNAVAILABLE", 0);
    if (close(writable) != 0) cleanup_failed(errno);
  }
  if (!fixture_current(readonly, staged_path, snapshot)) { observe(3, "UNKNOWN_OR_UNAVAILABLE", 0); return; }
  void *read_mapping = mmap(NULL, MARKER_BYTES, PROT_READ, MAP_SHARED, readonly, 0);
  if (read_mapping == MAP_FAILED) { const int error = errno; observe(3, "UNKNOWN_OR_UNAVAILABLE", error); }
  else {
    if (memcmp(read_mapping, marker, MARKER_BYTES) != 0) { observe(3, "ASSERTION_FAILED", 0); failed = true; }
    else if (mprotect(read_mapping, MARKER_BYTES, PROT_READ | PROT_WRITE) == 0) { observe(3, "ACCESS_SUCCEEDED", 0); failed = true; }
    else { const int error = errno; observe(3, error == EACCES ? "READ_ONLY_FD_CONSTRAINT_OBSERVED" : "UNKNOWN_OR_UNAVAILABLE", error); }
    if (munmap(read_mapping, MARKER_BYTES) != 0) cleanup_failed(errno);
  }
  if (!fixture_current(readonly, staged_path, snapshot)) { observe(4, "UNKNOWN_OR_UNAVAILABLE", 0); return; }
  void *write_mapping = mmap(NULL, MARKER_BYTES, PROT_READ | PROT_WRITE, MAP_SHARED, readonly, 0);
  if (write_mapping == MAP_FAILED) { const int error = errno; observe(4, error == EACCES ? "READ_ONLY_FD_CONSTRAINT_OBSERVED" : "UNKNOWN_OR_UNAVAILABLE", error); }
  else { observe(4, "ACCESS_SUCCEEDED", 0); failed = true; if (munmap(write_mapping, MARKER_BYTES) != 0) cleanup_failed(errno); }
}
static int output(void) {
  printf("{\"schema\":1,\"scope\":\"SYNTHETIC_SHARED_MAPPING_PROBE_RESULTS\",\"result\":\"%s\",\"checks\":[", failed ? "FAIL" : "UNKNOWN");
  for (size_t at = 0; at < ROW_COUNT; at++) printf("%s{\"name\":\"%s\",\"classification\":\"%s\",\"errno_code\":\"%s\"}", at == 0 ? "" : ",", rows[at].name, rows[at].classification, rows[at].errno_code);
  printf("],\"native_boundary_verified\":false,\"fresh_stage_and_no_inherited_rw_handles_verified\":false,\"sealed\":false,\"reuseEligible\":false}\n");
  return 74; /* complete static diagnostic output is still not a green gate */
}
int main(int argc, char **argv) {
  (void)argv;
  if (argc != 1 || !canonical_path(workspace_path) || !canonical_path(staged_path) || strcmp(workspace_path, staged_path) == 0 || getuid() == 0 || geteuid() != getuid() || getegid() != getgid()) {
    observe(0, "EXACT_REVIEWED_FIXTURE_ROUTE_REQUIRED", 0); return output();
  }
  struct stat workspace_snapshot, staged_snapshot;
  int workspace_error = 0, staged_error = 0;
  const int workspace = fixture_open(workspace_path, &workspace_snapshot, &workspace_error);
  const int staged = fixture_open(staged_path, &staged_snapshot, &staged_error);
  if (workspace < 0 || staged < 0 || (workspace_snapshot.st_dev == staged_snapshot.st_dev && workspace_snapshot.st_ino == staged_snapshot.st_ino)) {
    observe(0, "UNKNOWN_OR_UNAVAILABLE", workspace_error != 0 ? workspace_error : staged_error);
  } else {
    observe(0, "FRESH_SINGLE_LINK_MARKER_FILES_OBSERVED", 0);
    if (workspace_control(workspace, &workspace_snapshot)) staged_checks(staged, &staged_snapshot);
    const bool held = fixture_current(staged, staged_path, &staged_snapshot); const int current_error = held ? 0 : errno;
    const bool body = held && exact_marker(staged); const int body_error = body ? 0 : errno;
    if (held && body) observe(5, "IDENTITY_AND_BODY_PRESERVED", 0);
    else if (current_error != 0 || body_error != 0) observe(5, "UNKNOWN_OR_UNAVAILABLE", current_error != 0 ? current_error : body_error);
    else { observe(5, "ASSERTION_FAILED", 0); failed = true; }
  }
  if (workspace >= 0 && close(workspace) != 0) cleanup_failed(errno);
  if (staged >= 0 && close(staged) != 0) cleanup_failed(errno);
  observe(6, cleanup_known ? "OWNED_DESCRIPTORS_AND_MAPPINGS_CLOSED" : "UNKNOWN_OR_UNAVAILABLE", cleanup_errno);
  return output();
}
