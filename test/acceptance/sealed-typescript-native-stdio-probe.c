/* Fixed diagnostic only. Direct native Bash -> this C child; no supervisor.
 * Inspect metadata of descriptors 0/1/2 and the literal /dev/null only.
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

int main(int argc, char **argv) {
  if (argc != 1 || argv == NULL || argv[0] == NULL) _exit(74);
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
    "{\"schema\":1,\"scope\":\"NATIVE_STDIO_METADATA_ONLY\",\"pid\":%ld,"
    "\"dev_null\":{\"lstat\":\"%s\",\"type\":\"%s\"},\"fd0_matches_dev_null\":%s,"
    "\"descriptors\":[{\"fd\":0,\"fstat\":\"%s\",\"type\":\"%s\",\"fcntl\":\"%s\",\"access\":\"%s\"},"
    "{\"fd\":1,\"fstat\":\"%s\",\"type\":\"%s\",\"fcntl\":\"%s\",\"access\":\"%s\"},"
    "{\"fd\":2,\"fstat\":\"%s\",\"type\":\"%s\",\"fcntl\":\"%s\",\"access\":\"%s\"}]}\n",
    (long)getpid(), null_status, null_type, matches,
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
