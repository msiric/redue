/* Source-only fixed synthetic atomic-exchange diagnostic, never a seal proof.
 * Parent must independently verify its private minted, fresh/quiescent fixture
 * and exact rendered code/binary/native route before launch. Shape/labels alone
 * cannot prove freshness, no inherited writable handles or a native sandbox.
 * No argv path/dispatcher, env, body/path logging, network, child or cleanup rm.
 * Read scope: exact workspace + stage-parent/Canary + three exchange dirs;
 * bounded directory names and fixed NONSECRET markers only. No base/Checkout
 * enumeration. Current closed native read scope needs separate review.
 * SDK sys/stdio.h: RENAME_SWAP=0x2, renameatx_np available macOS10.12.
 * XNU12377.1.9 vfs_syscalls.c8929-8941/9658-9668 accepts SWAP|NOFOLLOW_ANY
 * and applies NAMEI_NOFOLLOW_ANY to both paths; exact runner ABI unproved.
 * https://github.com/apple-oss-distributions/xnu/blob/xnu-12377.1.9/bsd/vfs/vfs_syscalls.c
 * This is one actual atomic API, NOT sequential rename emulation.
 */
#define _DARWIN_C_SOURCE 1
#include <sys/types.h>
#include <sys/stat.h>
#include <sys/stdio.h>
#include <fcntl.h>
#include <unistd.h>
#include <dirent.h>
#include <errno.h>
#include <stdio.h>
#include <string.h>
#if !defined(__APPLE__)
#error "Fixed Darwin diagnostic source only"
#endif
_Static_assert(RENAME_SWAP == 0x2 && RENAME_NOFOLLOW_ANY == 0x10, "Reviewed exchange ABI required");
#define EXCHANGE_FLAGS (RENAME_SWAP | RENAME_NOFOLLOW_ANY)
#define BASE "__REVIEWED_EXCHANGE_BASE__"
#define WORKSPACE BASE "/Checkout 空间/.sealed-native-canaries"
#define PARENT BASE "/sealed-inputs"
#define STAGE PARENT "/redue-materialization-Canary"
#define PARTNER WORKSPACE "/stage-parent-exchange"
#define LEFT WORKSPACE "/exchange-control-a"
#define RIGHT WORKSPACE "/exchange-control-b"
#define GUARDS (O_NOFOLLOW_ANY | O_NONBLOCK | O_CLOEXEC)
_Static_assert((GUARDS & O_NOFOLLOW) == 0, "ANY conflicts with terminal NOFOLLOW");
static const char marker[] = "REDUE_SEALED_SYNTHETIC_CANARY\n";
static const char *stage_names[] = {"write-canary.txt","chmod-canary.txt","unlink-canary.txt","rename-canary.txt","hardlink-canary.txt","map-canary.txt"};
static const char *workspace_names[] = {"write-canary.txt","map-canary.txt","stage-parent-exchange","exchange-control-a","exchange-control-b"};
/* Known mismatches/grants always outrank later I/O or cleanup uncertainty. */
enum observation { MATCH, UNKNOWN, MISMATCH };
static enum observation merge(enum observation a, enum observation b) {
  return a == MISMATCH || b == MISMATCH ? MISMATCH : a == UNKNOWN || b == UNKNOWN ? UNKNOWN : MATCH;
}
static int same_identity(const struct stat *a, const struct stat *b) {
  return a->st_dev == b->st_dev && a->st_ino == b->st_ino && a->st_mode == b->st_mode && a->st_uid == b->st_uid && a->st_gid == b->st_gid && a->st_nlink == b->st_nlink && a->st_size == b->st_size;
}
static int same_file(const struct stat *a, const struct stat *b) {
  return same_identity(a,b) && a->st_mtimespec.tv_sec == b->st_mtimespec.tv_sec && a->st_mtimespec.tv_nsec == b->st_mtimespec.tv_nsec && a->st_ctimespec.tv_sec == b->st_ctimespec.tv_sec && a->st_ctimespec.tv_nsec == b->st_ctimespec.tv_nsec;
}
static int valid_base(void) {
  static const char prefix[] = "/private/tmp/redue-ci-recipient-";
  if (strlen(BASE) != sizeof(prefix)-1+8 || strncmp(BASE,prefix,sizeof(prefix)-1)) return 0;
  for (size_t i=sizeof(prefix)-1;i<sizeof(prefix)-1+8;i++) {
    unsigned char c=(unsigned char)BASE[i];
    if (!((c>='a'&&c<='z')||(c>='A'&&c<='Z')||(c>='0'&&c<='9'))) return 0;
  }
  return 1;
}
static enum observation owned_directory(const char *file, struct stat *result) {
  if (lstat(file,result)) return UNKNOWN;
  return S_ISDIR(result->st_mode) && result->st_uid==getuid() && (result->st_mode&07777)==0700 ? MATCH : MISMATCH;
}
static enum observation marker_file(const char *folder,const char *name) {
  char file[1024];if (snprintf(file,sizeof(file),"%s/%s",folder,name)<0 || strlen(folder)+strlen(name)+2>sizeof(file)) return UNKNOWN;
  struct stat named,before,after,after_named;enum observation result=MATCH;
  if (lstat(file,&named)) return UNKNOWN;
  if (!S_ISREG(named.st_mode)||named.st_uid!=getuid()||named.st_nlink!=1||(named.st_mode&07777)!=0644||named.st_size!=(off_t)(sizeof(marker)-1)) return MISMATCH;
  int fd=open(file,O_RDONLY|GUARDS);if(fd<0)return UNKNOWN;
  int before_known=fstat(fd,&before)==0;
  if(!before_known)result=UNKNOWN;else if(!same_file(&named,&before))result=MISMATCH;
  if(result==MATCH){char bytes[sizeof(marker)];ssize_t count=pread(fd,bytes,sizeof(bytes),0);
    if(count<0)result=UNKNOWN;else if(count!=(ssize_t)(sizeof(marker)-1)||memcmp(bytes,marker,sizeof(marker)-1))result=MISMATCH;}
  if(fstat(fd,&after))result=merge(result,UNKNOWN);else if(before_known&&!same_file(&before,&after))result=merge(result,MISMATCH);
  if(lstat(file,&after_named))result=merge(result,UNKNOWN);else if(!same_file(&named,&after_named))result=merge(result,MISMATCH);
  if(close(fd))result=merge(result,UNKNOWN);return result;
}
static enum observation inventory(const char *file,const char **names,size_t count) {
  struct stat named,opened,after;enum observation result=owned_directory(file,&named);if(result!=MATCH)return result;
  int fd=open(file,O_RDONLY|O_DIRECTORY|GUARDS);if(fd<0)return UNKNOWN;
  if(fstat(fd,&opened)){close(fd);return UNKNOWN;}
  if(!same_identity(&named,&opened)){close(fd);return MISMATCH;}
  DIR *dir=fdopendir(fd);if(!dir){close(fd);return UNKNOWN;}
  unsigned int seen=0;size_t retained=0;
  for(;;){errno=0;struct dirent *entry=readdir(dir);if(!entry){if(errno)result=merge(result,UNKNOWN);break;}
    if(!strcmp(entry->d_name,".")||!strcmp(entry->d_name,".."))continue;
    if(++retained>16){result=merge(result,MISMATCH);break;}
    size_t at;for(at=0;at<count;at++)if(!strcmp(entry->d_name,names[at]))break;
    if(at==count || (seen&(1u<<at))){result=merge(result,MISMATCH);break;}seen|=1u<<at;
  }
  if(result==MATCH && seen!=(1u<<count)-1)result=MISMATCH;
  if(lstat(file,&after))result=merge(result,UNKNOWN);else if(!same_identity(&named,&after))result=merge(result,MISMATCH);
  if(closedir(dir))result=merge(result,UNKNOWN);return result;
}
static enum observation fixture(struct stat dirs[4]) {
  struct stat base,checkout,workspace;enum observation result=owned_directory(BASE,&base);
  result=merge(result,owned_directory(BASE "/Checkout 空间",&checkout));result=merge(result,owned_directory(WORKSPACE,&workspace));
  const char *parent_names[]={"redue-materialization-Canary"},*single[]={"identity-canary.txt"};
  result=merge(result,inventory(WORKSPACE,workspace_names,5));result=merge(result,inventory(PARENT,parent_names,1));result=merge(result,inventory(STAGE,stage_names,6));
  const char *four[]={PARENT,PARTNER,LEFT,RIGHT};
  for(size_t i=0;i<4;i++){result=merge(result,owned_directory(four[i],&dirs[i]));if(i)result=merge(result,inventory(four[i],single,1));}
  if(result!=MATCH)return result;
  for(size_t i=0;i<4;i++)for(size_t j=0;j<i;j++)if(dirs[i].st_dev==dirs[j].st_dev&&dirs[i].st_ino==dirs[j].st_ino)result=MISMATCH;
  for(size_t i=0;i<4;i++)if(dirs[i].st_dev!=workspace.st_dev)result=MISMATCH;
  for(size_t i=0;i<6;i++)result=merge(result,marker_file(STAGE,stage_names[i]));
  result=merge(result,marker_file(WORKSPACE,"write-canary.txt"));result=merge(result,marker_file(WORKSPACE,"map-canary.txt"));
  for(size_t i=1;i<4;i++)result=merge(result,marker_file(four[i],"identity-canary.txt"));
  return result;
}
static enum observation identities_at(const char *a,const struct stat *expected_a,const char *b,const struct stat *expected_b) {
  struct stat now_a,now_b;enum observation result=owned_directory(a,&now_a);result=merge(result,owned_directory(b,&now_b));
  if(result==MATCH&&(!same_identity(&now_a,expected_a)||!same_identity(&now_b,expected_b)))result=MISMATCH;
  return result;
}
static enum observation control(const struct stat dirs[4]) {
  if(renameatx_np(AT_FDCWD,LEFT,AT_FDCWD,RIGHT,EXCHANGE_FLAGS))return UNKNOWN;
  enum observation result=identities_at(LEFT,&dirs[3],RIGHT,&dirs[2]);
  /* Same syscall restores the control. No mutation of a real/failed stage is
   * repaired, and known wrong identities remain FAIL even if restoration errs. */
  if(renameatx_np(AT_FDCWD,LEFT,AT_FDCWD,RIGHT,EXCHANGE_FLAGS))result=merge(result,UNKNOWN);
  result=merge(result,identities_at(LEFT,&dirs[2],RIGHT,&dirs[3]));return result;
}
static const char *status(enum observation value){return value==MATCH?"PASS":value==MISMATCH?"FAIL":"UNKNOWN";}
static const char *reason(enum observation value){return value==MATCH?"FIXTURE_MATCHED":value==MISMATCH?"ASSERTION_FAILED":"UNKNOWN_OR_UNAVAILABLE";}
static void emit(enum observation initial,enum observation workspace,int attempted,int granted,int denied,int final_checked,enum observation final) {
  int failure=initial==MISMATCH||workspace==MISMATCH||granted||final==MISMATCH;
  printf("{\"schema\":1,\"scope\":\"SYNTHETIC_STAGE_ATOMIC_EXCHANGE_PROBE_RESULTS\",\"result\":\"%s\",\"checks_passed\":false,\"checks\":[",failure?"FAIL":"UNKNOWN");
  printf("{\"name\":\"synthetic_exchange_inventory_observed\",\"result\":\"%s\",\"reason_code\":\"%s\",\"attempted\":true},",status(initial),reason(initial));
  printf("{\"name\":\"workspace_atomic_exchange_and_restore_control\",\"result\":\"%s\",\"reason_code\":\"%s\",\"attempted\":%s},",initial==MATCH?status(workspace):"NOT_PERFORMED",workspace==MATCH?"ATOMIC_EXCHANGE_AND_RESTORE_OBSERVED":reason(workspace),initial==MATCH?"true":"false");
  printf("{\"name\":\"stage_parent_atomic_exchange_denied\",\"result\":\"%s\",\"reason_code\":\"%s\",\"attempted\":%s},",granted?"FAIL":denied?"PASS":attempted?"UNKNOWN":"NOT_PERFORMED",granted?"ACCESS_SUCCEEDED":denied?"DENIED_PERMISSION_ERROR":"UNKNOWN_OR_UNAVAILABLE",attempted?"true":"false");
  printf("{\"name\":\"stage_parent_identity_and_inventory_preserved\",\"result\":\"%s\",\"reason_code\":\"%s\",\"attempted\":%s},",final_checked?status(final):"NOT_PERFORMED",reason(final),final_checked?"true":"false");
  printf("{\"name\":\"base_atomic_exchange_denied\",\"result\":\"NOT_IMPLEMENTED\",\"reason_code\":\"NOT_IMPLEMENTED\",\"attempted\":false}],\"nativeEnforcement\":\"NOT_ESTABLISHED\",\"noInheritedWritableHandlesVerified\":false,\"sealed\":false,\"reuseEligible\":false}\n");
}
int main(int argc,char **argv) {
  (void)argv;struct stat dirs[4],current[4];enum observation initial=UNKNOWN,workspace=UNKNOWN,final=UNKNOWN;int attempted=0,granted=0,denied=0,final_checked=0;
  if(argc!=1||!valid_base()||getuid()==0||getuid()!=geteuid()||getgid()!=getegid()){emit(initial,workspace,attempted,granted,denied,final_checked,final);return 74;}
  initial=fixture(dirs);if(initial==MATCH)workspace=control(dirs);
  if(workspace==MATCH){final_checked=1;enum observation again=fixture(current);for(size_t i=0;i<4&&again==MATCH;i++)if(!same_identity(&current[i],&dirs[i]))again=MISMATCH;
    if(again==MATCH){attempted=1;if(!renameatx_np(AT_FDCWD,PARENT,AT_FDCWD,PARTNER,EXCHANGE_FLAGS))granted=1;else{int error=errno;denied=error==EPERM||error==EACCES;}
      final=fixture(current);if(final==MATCH)for(size_t i=0;i<4;i++)if(!same_identity(&current[i],&dirs[i]))final=MISMATCH;
    }else final=again;
  }
  emit(initial,workspace,attempted,granted,denied,final_checked,final);return 74;
}
