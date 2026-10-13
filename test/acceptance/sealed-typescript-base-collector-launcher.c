/* DISABLED fixed collector launcher template; source data, not native acceptance.
 * Its main guard runs before Node execve, NOT before this binary's own loader.
 * The enclosing parent must prevent pre-main injection, verify current protected
 * launcher/Node/collector bytes, native identity/auth/effective policy/capacity,
 * and inherited handles, then supervise the actual process. None is proved here.
 * No caller-selected path, argv, environment repair, receipt or seal authority.
 */
#include <stddef.h>
#include <string.h>
#include <unistd.h>

extern char **environ;
static const char node[] = "__REVIEWED_BASE_COLLECTOR_NODE__";
static const char collector[] = "__REVIEWED_BASE_COLLECTOR_ENTRY__";
static const char launcher[] = "__REVIEWED_BASE_COLLECTOR_LAUNCHER__";
static const char refusal[] = "REDUE_BASE_COLLECTOR_LAUNCH_UNKNOWN\n";
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
  /* Best-effort fixed text only, including exec failure; no errno/path/key data. */
  (void)write(STDERR_FILENO, refusal, sizeof(refusal) - 1);
  _exit(74);
}

int main(int argc, char **argv) {
  if (argc != 1 || argv == NULL || argv[0] == NULL || strcmp(argv[0], launcher) != 0) refuse();
  char **const inherited_environment = environ;
  if (!environment_allowed(inherited_environment)) refuse();
  char *const fixed_argv[] = {(char *)node, (char *)collector, NULL};
  execve(node, fixed_argv, inherited_environment);
  refuse();
}
