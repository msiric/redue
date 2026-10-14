/* Fixed startup witness only. Direct native Bash -> this C child; no supervisor.
 * Compare child environment to exact isolated bindings; output booleans only.
 * Inspect metadata of descriptors 0/1/2 and the literal /dev/null only.
 * argv[0] is an observation binding, not endpoint authentication. No claim of
 * path-helper execution, pre-main confinement, credential denial or sealing.
 * This does not establish endpoint ownership, sandboxing or an input seal.
 * Output failure, signal or timeout must be retained as UNKNOWN by the parent.
 */
#define _DARWIN_C_SOURCE 1
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <errno.h>
#include <stdio.h>

static const char *error_code(int error) {
  switch (error) {
    case EBADF: return "EBADF";
    case EACCES: return "EACCES";
    case EPERM: return "EPERM";
    case EINTR: return "EINTR";
    case EINVAL: return "EINVAL";
    case ENOENT: return "ENOENT";
    case ENOTDIR: return "ENOTDIR";
    case ELOOP: return "ELOOP";
    default: return "OTHER_ERROR";
  }
}

static const char *file_type(mode_t mode) {
  if (S_ISREG(mode)) return "REGULAR";
  if (S_ISDIR(mode)) return "DIRECTORY";
  if (S_ISCHR(mode)) return "CHARACTER";
  if (S_ISBLK(mode)) return "BLOCK";
  if (S_ISFIFO(mode)) return "FIFO";
  if (S_ISSOCK(mode)) return "SOCKET";
  if (S_ISLNK(mode)) return "SYMLINK";
  return "UNKNOWN";
}

/* Exact Darwin libc getenv ABI documented by Apple getenv(3):
 * https://developer.apple.com/library/archive/documentation/System/Conceptual/ManPages_iPhoneOS/man3/getenv.3.html
 * Locally checked SDK27 _stdlib.h:167 declares char *getenv(const char *).
 * This explicit prototype avoids adding another SDK/header input; it does not
 * claim whole-SDK or libc implementation/loader closure.
 * No new SDK/header boundary beyond old probe.
 * Never emit an environment value; even empty forbidden keys count present. */
extern char *getenv(const char *name);
static int exact_value(const char *actual, const char *expected) {
  if (actual == NULL) return 0;
  for (size_t i = 0; i < 512; i++) {
    if (actual[i] != expected[i]) return 0;
    if (expected[i] == '\0') return 1;
  }
  return 0;
}
static const char *boolean(int value) { return value ? "true" : "false"; }
static int binding(const char *entry, char *base, size_t capacity) {
  const char *prefix = "/private/tmp/redue-ci-recipient-";
  const char *suffix = "/prefix/native-probes/native-stdio-probe";
  size_t i = 0;
  for (; prefix[i] != '\0'; i++) if (entry[i] != prefix[i]) return 0;
  for (size_t n = 0; n < 8; n++, i++) {
    char c = entry[i];
    if (!((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f'))) return 0;
  }
  if (i + 1 > capacity || !exact_value(entry + i, suffix)) return 0;
  for (size_t n = 0; n < i; n++) base[n] = entry[n];
  base[i] = '\0';
  return 1;
}
int main(int argc, char **argv) {
  if (argc != 1 || argv == NULL || argv[0] == NULL) _exit(74);
  char base[128], home[256], root[256];
  const int bound = binding(argv[0], base, sizeof(base));
  int home_match = 0, root_match = 0;
  if (bound) {
    int h = snprintf(home, sizeof(home), "%s/claude-host/home", base);
    int r = snprintf(root, sizeof(root), "%s/claude-host/path-helper-root", base);
    if (h > 0 && (size_t)h < sizeof(home)) home_match = exact_value(getenv("HOME"), home);
    if (r > 0 && (size_t)r < sizeof(root)) root_match = exact_value(getenv("PATH_HELPER_ROOT"), root);
  }
  struct stat expected, descriptors[3];
  int metadata_ok[3];
  const char *metadata[3], *types[3], *flag_status[3], *access[3];
  const int null_ok = lstat("/dev/null", &expected) == 0;
  const char *null_status = null_ok ? "OK" : error_code(errno);
  const char *null_type = null_ok ? file_type(expected.st_mode) : "UNKNOWN";
  for (int fd = 0; fd < 3; fd++) {
    const int ok = fstat(fd, &descriptors[fd]) == 0;
    metadata_ok[fd] = ok;
    metadata[fd] = ok ? "OK" : error_code(errno);
    types[fd] = ok ? file_type(descriptors[fd].st_mode) : "UNKNOWN";
    const int flags = fcntl(fd, F_GETFL);
    flag_status[fd] = flags != -1 ? "OK" : error_code(errno);
    access[fd] = "UNKNOWN";
    if (flags != -1) {
      switch (flags & O_ACCMODE) {
        case O_RDONLY: access[fd] = "READ_ONLY"; break;
        case O_WRONLY: access[fd] = "WRITE_ONLY"; break;
        case O_RDWR: access[fd] = "READ_WRITE"; break;
      }
    }
  }
  const char *matches = "null";
  if (null_ok && metadata_ok[0]) {
    matches = S_ISCHR(expected.st_mode) && S_ISCHR(descriptors[0].st_mode) &&
      expected.st_dev == descriptors[0].st_dev && expected.st_ino == descriptors[0].st_ino &&
      expected.st_rdev == descriptors[0].st_rdev ? "true" : "false";
  }
  char report[2048];
  const int size = snprintf(report, sizeof(report),
    "{\"schema\":1,\"scope\":\"NATIVE_CHILD_STARTUP_WITNESS_ONLY\",\"pid\":%ld,"
    "\"startup\":{\"entry_binding_valid\":%s,\"home_matches\":%s,\"root_matches\":%s,\"shell_matches\":%s,\"path_matches\":%s,"
    "\"manpath_absent\":%s,\"bash_env_absent\":%s,\"env_absent\":%s,\"ps1_absent\":%s,\"term_program_absent\":%s},"
    "\"dev_null\":{\"lstat\":\"%s\",\"type\":\"%s\"},\"fd0_matches_dev_null\":%s,"
    "\"descriptors\":[{\"fd\":0,\"fstat\":\"%s\",\"type\":\"%s\",\"fcntl\":\"%s\",\"access\":\"%s\"},"
    "{\"fd\":1,\"fstat\":\"%s\",\"type\":\"%s\",\"fcntl\":\"%s\",\"access\":\"%s\"},"
    "{\"fd\":2,\"fstat\":\"%s\",\"type\":\"%s\",\"fcntl\":\"%s\",\"access\":\"%s\"}]}\n",
    (long)getpid(), boolean(bound), boolean(home_match), boolean(root_match),
    boolean(exact_value(getenv("SHELL"), "/bin/bash")), boolean(exact_value(getenv("PATH"), "/usr/bin:/bin:/usr/sbin:/sbin")),
    boolean(getenv("MANPATH") == NULL), boolean(getenv("BASH_ENV") == NULL), boolean(getenv("ENV") == NULL),
    boolean(getenv("PS1") == NULL), boolean(getenv("TERM_PROGRAM") == NULL), null_status, null_type, matches,
    metadata[0], types[0], flag_status[0], access[0],
    metadata[1], types[1], flag_status[1], access[1],
    metadata[2], types[2], flag_status[2], access[2]);
  if (size <= 0 || (size_t)size >= sizeof(report)) _exit(74);
  size_t written = 0;
  while (written < (size_t)size) {
    const ssize_t count = write(STDOUT_FILENO, report + written, (size_t)size - written);
    if (count == -1 && errno == EINTR) continue;
    if (count <= 0) _exit(74);
    written += (size_t)count;
  }
  _exit(0);
}
