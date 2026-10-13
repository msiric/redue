/* DISABLED campaign-stdio-only-setexec@1 template; source data only.
 * Main cannot protect this binary's own pre-main loader. The enclosing parent
 * must establish current protected bytes, native identity/effective policy,
 * authentication/capacity, parent-held handles and the complete namespace.
 * Only C-to-Node nonstdio inheritance is constrained here. Stdio metadata does
 * not prove parent ownership. Native Bash endpoints and /dev/null metadata
 * permission remain unobserved; denial is UNKNOWN, never repaired or allowed.
 */
#define _DARWIN_C_SOURCE 1
#include <stddef.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/stat.h>
#include <spawn.h>

extern char **environ;
static const char node[] = "__REVIEWED_FIXED_CAMPAIGN_NODE__";
static const char collector[] = "__REVIEWED_FIXED_CAMPAIGN_ENTRY__";
static const char launcher[] = "__REVIEWED_FIXED_CAMPAIGN_LAUNCHER__";
static const char refusal[] = "REDUE_FIXED_CAMPAIGN_LAUNCH_UNKNOWN\n";
static const char *const exact_keys[] = {
  "NODE_OPTIONS", "NODE_PATH", "NODE_REPL_EXTERNAL_MODULE", NULL
};
static const char *const prefix_keys[] = {"DYLD_", "LD_", "OPENSSL_", NULL};

static unsigned char ascii_upper(unsigned char byte) {
  return byte >= 'a' && byte <= 'z' ? (unsigned char)(byte - 'a' + 'A') : byte;
}

/* Inspect ONLY the key before '='; never inspect or publish its value. */
static int key_matches(const char *entry, size_t length, const char *key, int prefix) {
  const size_t wanted = strlen(key);
  if (length < wanted || (!prefix && length != wanted)) return 0;
  for (size_t at = 0; at < wanted; at++) {
    if (ascii_upper((unsigned char)entry[at]) != (unsigned char)key[at]) return 0;
  }
  return 1;
}

static int environment_allowed(char *const environment[]) {
  if (environment == NULL) return 0;
  for (size_t at = 0; environment[at] != NULL; at++) {
    const char *entry = environment[at];
    size_t length = 0;
    while (entry[length] != '\0' && entry[length] != '=') length++;
    if (length == 0 || entry[length] != '=') return 0;
    for (size_t key = 0; exact_keys[key] != NULL; key++) {
      if (key_matches(entry, length, exact_keys[key], 0)) return 0;
    }
    for (size_t key = 0; prefix_keys[key] != NULL; key++) {
      if (key_matches(entry, length, prefix_keys[key], 1)) return 0;
    }
  }
  return 1;
}

static void refuse(void) {
  /* Best-effort fixed text only, including SETEXEC failure; no errno/path/key data. */
  struct stat endpoint;
  const int flags = fcntl(STDERR_FILENO, F_GETFL);
  if (flags != -1 && (flags & O_ACCMODE) == O_WRONLY &&
      fstat(STDERR_FILENO, &endpoint) == 0 && S_ISFIFO(endpoint.st_mode)) {
    (void)write(STDERR_FILENO, refusal, sizeof(refusal) - 1);
  }
  _exit(74);
}

/* Metadata only: never read endpoint contents or open/repair a descriptor. */
static int descriptors_allowed(void) {
  struct stat expected, input, output, error;
  if (lstat("/dev/null", &expected) != 0 || !S_ISCHR(expected.st_mode)) return 0;
  if (fstat(STDIN_FILENO, &input) != 0 || fstat(STDOUT_FILENO, &output) != 0 ||
      fstat(STDERR_FILENO, &error) != 0) return 0;
  if (!S_ISCHR(input.st_mode) || input.st_dev != expected.st_dev ||
      input.st_ino != expected.st_ino || input.st_rdev != expected.st_rdev ||
      !S_ISFIFO(output.st_mode) || !S_ISFIFO(error.st_mode)) return 0;
  const int input_flags = fcntl(STDIN_FILENO, F_GETFL);
  const int output_flags = fcntl(STDOUT_FILENO, F_GETFL);
  const int error_flags = fcntl(STDERR_FILENO, F_GETFL);
  return input_flags != -1 && output_flags != -1 && error_flags != -1 &&
         (input_flags & O_ACCMODE) == O_RDONLY &&
         (output_flags & O_ACCMODE) == O_WRONLY &&
         (error_flags & O_ACCMODE) == O_WRONLY;
}

int main(int argc, char **argv) {
  if (argc != 1 || argv == NULL || argv[0] == NULL || strcmp(argv[0], launcher) != 0) refuse();
  char **const inherited_environment = environ;
  if (!environment_allowed(inherited_environment) || !descriptors_allowed()) refuse();
#if defined(POSIX_SPAWN_SETEXEC) && defined(POSIX_SPAWN_CLOEXEC_DEFAULT)
  posix_spawn_file_actions_t actions;
  posix_spawnattr_t attributes;
  int actions_ready = 0, attributes_ready = 0;
  char *const fixed_argv[] = {(char *)node, (char *)collector, NULL};
  if (posix_spawn_file_actions_init(&actions) != 0) goto unknown;
  actions_ready = 1;
  if (posix_spawnattr_init(&attributes) != 0) goto unknown;
  attributes_ready = 1;
  if (posix_spawnattr_setflags(&attributes, POSIX_SPAWN_SETEXEC | POSIX_SPAWN_CLOEXEC_DEFAULT) != 0) goto unknown;
  if (posix_spawn_file_actions_addinherit_np(&actions, STDIN_FILENO) != 0) goto unknown;
  if (posix_spawn_file_actions_addinherit_np(&actions, STDOUT_FILENO) != 0) goto unknown;
  if (posix_spawn_file_actions_addinherit_np(&actions, STDERR_FILENO) != 0) goto unknown;
  if (!descriptors_allowed()) goto unknown;
  /* Success replaces this process and never returns. ANY return is UNKNOWN. */
  (void)posix_spawn(NULL, node, &actions, &attributes, fixed_argv, inherited_environment);
unknown:
  if (attributes_ready) (void)posix_spawnattr_destroy(&attributes);
  if (actions_ready) (void)posix_spawn_file_actions_destroy(&actions);
#endif
  refuse();
}
