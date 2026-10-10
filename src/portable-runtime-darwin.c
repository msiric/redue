// Read-only N-API probe. No imported paths, commands or runtime mutation.
// Apple dyld_priv.h declarations, pinned review in portable-boundary-review.md.
#include <node_api.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/stat.h>
extern bool _dyld_get_shared_cache_uuid(unsigned char uuid[16]);
extern const char *dyld_shared_cache_file_path(void);
extern bool dyld_shared_cache_some_image_overridden(void);
extern bool dyld_has_inserted_or_interposing_libraries(void);
extern bool _dyld_shared_cache_contains_path(const char *path);
#define CHECK(call) do { if ((call) != napi_ok) { \
  napi_throw_error(env, "PORTABLE_RUNTIME", "Runtime inspection unavailable"); \
  return NULL; } } while (0)

static napi_value inspect(napi_env env, napi_callback_info info) {
  unsigned char uuid[16];
  const char *file = dyld_shared_cache_file_path();
  if (!file || !_dyld_get_shared_cache_uuid(uuid)) {
    napi_throw_error(env, "PORTABLE_RUNTIME", "Loaded shared cache unavailable");
    return NULL;
  }
  char hex[33];
  for (int i=0; i<16; ++i) snprintf(hex+2*i, 3, "%02x", uuid[i]);
  napi_value out, value;
  CHECK(napi_create_object(env, &out));
  CHECK(napi_create_string_utf8(env, hex, 32, &value));
  CHECK(napi_set_named_property(env, out, "uuid", value));
  CHECK(napi_create_string_utf8(env, file, NAPI_AUTO_LENGTH, &value));
  CHECK(napi_set_named_property(env, out, "file", value));
  CHECK(napi_get_boolean(env, dyld_shared_cache_some_image_overridden(), &value));
  CHECK(napi_set_named_property(env, out, "overridden", value));
  CHECK(napi_get_boolean(env, dyld_has_inserted_or_interposing_libraries(), &value));
  CHECK(napi_set_named_property(env, out, "interposed", value));
  // Fixed trusted OS child only; never accept an imported filesystem path.
  // Darwin documents SF_NOUNLINK as preventing removal, rename and mounting on.
  struct stat protected_root;
  const char *root = "/System/Volumes/Preboot/Cryptexes/OS";
  if (lstat(root, &protected_root) != 0 || !S_ISDIR(protected_root.st_mode) ||
      protected_root.st_uid != 0 || (protected_root.st_mode & 0022) != 0 ||
      (protected_root.st_flags & SF_NOUNLINK) == 0) {
    napi_throw_error(env, "PORTABLE_RUNTIME", "Protected OS cache root unavailable");
    return NULL;
  }
  napi_value identity;
  char number[32];
  CHECK(napi_create_object(env, &identity));
  snprintf(number, sizeof(number), "%llu", (unsigned long long)protected_root.st_dev);
  CHECK(napi_create_string_utf8(env, number, NAPI_AUTO_LENGTH, &value));
  CHECK(napi_set_named_property(env, identity, "dev", value));
  snprintf(number, sizeof(number), "%llu", (unsigned long long)protected_root.st_ino);
  CHECK(napi_create_string_utf8(env, number, NAPI_AUTO_LENGTH, &value));
  CHECK(napi_set_named_property(env, identity, "ino", value));
  CHECK(napi_create_uint32(env, protected_root.st_flags, &value));
  CHECK(napi_set_named_property(env, identity, "flags", value));
  CHECK(napi_set_named_property(env, out, "cryptexRoot", identity));
  return out;
}
static napi_value contains(napi_env env, napi_callback_info info) {
  napi_value argument, result;
  size_t count=1, length=0;
  CHECK(napi_get_cb_info(env, info, &count, &argument, NULL, NULL));
  if (count != 1) { napi_throw_error(env, "PORTABLE_RUNTIME", "Runtime path missing"); return NULL; }
  CHECK(napi_get_value_string_utf8(env, argument, NULL, 0, &length));
  if (length == 0 || length > 16384) { napi_throw_error(env, "PORTABLE_RUNTIME", "Runtime path invalid"); return NULL; }
  char *file=malloc(length+1);
  if (!file) { napi_throw_error(env, "PORTABLE_RUNTIME", "Runtime inspection unavailable"); return NULL; }
  napi_status status=napi_get_value_string_utf8(env, argument, file, length+1, &length);
  if (status != napi_ok) { free(file); napi_throw_error(env, "PORTABLE_RUNTIME", "Runtime inspection unavailable"); return NULL; }
  bool found=_dyld_shared_cache_contains_path(file);
  free(file);
  CHECK(napi_get_boolean(env, found, &result));
  return result;
}
static napi_value initialize(napi_env env, napi_value exports) {
  napi_value fn;
  CHECK(napi_create_function(env, "inspect", NAPI_AUTO_LENGTH, inspect, NULL, &fn));
  CHECK(napi_set_named_property(env, exports, "inspect", fn));
  CHECK(napi_create_function(env, "contains", NAPI_AUTO_LENGTH, contains, NULL, &fn));
  CHECK(napi_set_named_property(env, exports, "contains", fn));
  return exports;
}
NAPI_MODULE(NODE_GYP_MODULE_NAME, initialize)
