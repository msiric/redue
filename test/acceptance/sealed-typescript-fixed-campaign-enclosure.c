/* DISABLED fixed-canary finite enclosure@2. SOURCE ONLY, no authorized build or
 * invocation. Not a seal, origin or reusable verification. The generated Node
 * collector alone creates four pinned NO-PROCESS-CREATION actors; actual close
 * of every launched actor precedes original END. Reap/EOF/group absence alone
 * are NOT that proof. Pre-main loader, complete SDK and native policy remain
 * separate unmet prerequisites. Normal E publication requires original END
 * and normal owned-child cleanup. Known assertion FAIL F publication instead
 * requires controlled owned-group cleanup; END may remain false. Neither
 * branch publishes before worker reap and group absence. Other incomplete or
 * interrupted collection remains UNKNOWN; cleanup never substitutes for END.
 * Outer exit0 means complete collection transport ONLY, never assertion PASS.
 * Collector/actor exit meanings and the structured body remain unchanged.
 */
#define _DARWIN_C_SOURCE 1
#include <unistd.h>
#include <stdint.h>
#include <string.h>
#include <fcntl.h>
#include <signal.h>
#include <errno.h>
#include <poll.h>
#include <time.h>
#include <sys/time.h>
#include <sys/stat.h>
#include <sys/wait.h>
#include <spawn.h>
extern char **environ;
_Static_assert(sizeof(pid_t)==sizeof(sig_atomic_t)&&(pid_t)-1<(pid_t)0&&(sig_atomic_t)-1<(sig_atomic_t)0,"signed same-width PID watchdog required");
static const char self[]="__REVIEWED_FIXED_ENCLOSURE_SELF__";
static const char launcher[]="__REVIEWED_FIXED_ENCLOSURE_LAUNCHER__";
static const char frame[]="RDE2:__REVIEWED_FIXED_ENCLOSURE_PROJECTION__:";
#define LIMIT 32768
#define ACK 0x52444131U
#define RESULT 0x52445231U
#define GO 0x52444731U
static volatile sig_atomic_t owned_pid=0, own_group=0, reaped=0, worker_mode=0;
static pid_t expected_parent;
static uint64_t absolute_limit;
static uint64_t now_ms(void){struct timespec t;if(clock_gettime(CLOCK_MONOTONIC,&t)!=0||t.tv_sec<0||t.tv_nsec<0||t.tv_nsec>=1000000000L||(uint64_t)t.tv_sec>(UINT64_MAX-999)/1000)return UINT64_MAX;return(uint64_t)t.tv_sec*1000+(uint64_t)t.tv_nsec/1000000;}
/* Handler uses only async-signal-safe operations. Worker arms its watchdog
 * BEFORE setsid; until its OWN session is checked, expiry may only self-exit.
 * No actor exists before private ACK/GO. This does not enclose or certify
 * Bun/native-created sessions; ambiguous timeout/cancellation stays UNKNOWN. */
static void expired(int signal_number){(void)signal_number;const uint64_t n=now_ms();
 if(worker_mode){if(getppid()==expected_parent&&n!=UINT64_MAX&&n<absolute_limit)return;if(own_group)(void)kill(0,SIGKILL);_exit(74);}
 if(n!=UINT64_MAX&&n<absolute_limit)return;
 if(owned_pid>0&&!reaped){if(own_group)(void)kill(-(pid_t)owned_pid,SIGKILL);else(void)kill((pid_t)owned_pid,SIGKILL);}_exit(74);
}
static int watchdog(void){struct sigaction a;memset(&a,0,sizeof(a));a.sa_handler=expired;sigemptyset(&a.sa_mask);if(sigaction(SIGALRM,&a,NULL)!=0||(worker_mode&&sigaction(SIGPIPE,&a,NULL)!=0))return 0;struct itimerval timer={{0,50000},{0,50000}};return setitimer(ITIMER_REAL,&timer,NULL)==0;}
static int signal_preconditions(void){sigset_t mask;if(sigprocmask(SIG_SETMASK,NULL,&mask)!=0)return 0;const int signals[]={SIGALRM,SIGCHLD,SIGTERM,SIGINT,SIGHUP,SIGPIPE};
 for(size_t at=0;at<sizeof(signals)/sizeof(signals[0]);at++){struct sigaction a;if(sigismember(&mask,signals[at])!=0||sigaction(signals[at],NULL,&a)!=0||a.sa_handler!=SIG_DFL||(signals[at]==SIGCHLD&&(a.sa_flags&SA_NOCLDWAIT)))return 0;}return 1;}
static int close_fd(int *fd){if(*fd<0)return 1;const int value=*fd;*fd=-1;return close(value)==0;}
static int pipe_owned(int p[2]){if(pipe(p)!=0)return 0;for(int at=0;at<2;at++){struct stat s;const int f=fcntl(p[at],F_GETFL);if(p[at]<=2||f<0||fstat(p[at],&s)!=0||!S_ISFIFO(s.st_mode)||(f&O_ACCMODE)!=(at?O_WRONLY:O_RDONLY)||fcntl(p[at],F_SETFD,FD_CLOEXEC)!=0)return 0;}return 1;}
static int nonblock(int fd){const int f=fcntl(fd,F_GETFL);return f>=0&&fcntl(fd,F_SETFL,f|O_NONBLOCK)==0;}
static int timely(uint64_t limit){const uint64_t n=now_ms();return n!=UINT64_MAX&&n<limit;}
static int send_private(int fd,const void *body,size_t length,uint64_t limit){const unsigned char *bytes=body;size_t at=0;while(at<length&&timely(limit)){const ssize_t n=write(fd,bytes+at,length-at);if(n>0){at+=(size_t)n;continue;}if(n<0&&(errno==EINTR||errno==EAGAIN)){struct pollfd p={fd,POLLOUT,0};(void)poll(&p,1,10);continue;}return 0;}return at==length;}
struct ack {uint32_t magic;int32_t pid,pgid,sid;};
struct result {uint32_t magic,length,failed_assertion;};
static int read_capture(int fd,unsigned char *bytes,size_t *used,int *eof){unsigned char block[256];const ssize_t n=read(fd,block,sizeof(block));if(n==0){*eof=1;return 1;}if(n<0)return errno==EAGAIN||errno==EINTR;if((size_t)n>LIMIT-*used)return 0;memcpy(bytes+*used,block,(size_t)n);*used+=(size_t)n;return 1;}
/* Fixed worker. No public path/argv/FD/environment selector and no shell. The
 * ACK/control pipe is never inherited by collector/actors (CLOEXEC_DEFAULT).
 * Child stdio uses real pipe(2), never Node's socketpair-labelled "pipe". */
static void worker(int control,int gate,uint64_t began,pid_t parent){
 sigset_t initial_block,initial_mask;
 if(sigemptyset(&initial_block)!=0||sigaddset(&initial_block,SIGALRM)!=0||sigaddset(&initial_block,SIGPIPE)!=0||sigprocmask(SIG_BLOCK,&initial_block,&initial_mask)!=0)_exit(74);
 expected_parent=parent;worker_mode=1;owned_pid=0;own_group=0;reaped=0;absolute_limit=began+13750;
 if(!watchdog())_exit(74);
 /* Deliver pending signals BEFORE session creation. An expiry/parent loss
  * here, or between setsid and own_group, must never kill the inherited PG. */
 if(sigprocmask(SIG_SETMASK,&initial_mask,NULL)!=0)_exit(74);
 if(!timely(absolute_limit)||getppid()!=parent)_exit(74);
 if(setsid()<0||getpid()!=getpgrp()||getpid()!=getsid(0))_exit(74);
 own_group=1;
 if(!timely(absolute_limit)||getppid()!=parent)_exit(74);
 struct ack a={ACK,(int32_t)getpid(),(int32_t)getpgrp(),(int32_t)getsid(0)};
 if((pid_t)a.pid!=getpid()||!send_private(control,&a,sizeof(a),absolute_limit))_exit(74);
 /* Two-way handshake closes ACK-consumption race: the parent records owned
  * group authority BEFORE sending fixed GO. No actor exists while it may
  * legitimately kill only the direct pre-ACK worker. */
 uint32_t go=0;size_t gate_used=0;int gate_eof=0;
 while(!gate_eof&&timely(absolute_limit)&&getppid()==parent){
  unsigned char bytes[8];const ssize_t n=read(gate,bytes,sizeof(bytes));
  if(n==0){gate_eof=1;break;}if(n>0){if((size_t)n>sizeof(go)-gate_used)_exit(74);memcpy((unsigned char*)&go+gate_used,bytes,(size_t)n);gate_used+=(size_t)n;}
  else if(errno!=EAGAIN&&errno!=EINTR)_exit(74);
  struct pollfd p={gate,POLLIN,0};(void)poll(&p,1,10);
 }
 if(!gate_eof||gate_used!=sizeof(go)||go!=GO||!close_fd(&gate)||getppid()!=parent||!timely(absolute_limit))_exit(74);
 int out[2]={-1,-1},err[2]={-1,-1},actions_ready=0,attr_ready=0,status=0,child_reaped=0,out_eof=0,err_eof=0,failed=0;pid_t child=0;size_t out_used=0,err_used=0;unsigned char output[LIMIT],error[LIMIT];
 posix_spawn_file_actions_t actions;posix_spawnattr_t attributes;
#if defined(POSIX_SPAWN_CLOEXEC_DEFAULT)
 if(!pipe_owned(out)||!pipe_owned(err)||!nonblock(out[0])||!nonblock(err[0]))goto failure;
 if(posix_spawn_file_actions_init(&actions)!=0)goto failure;actions_ready=1;
 if(posix_spawnattr_init(&attributes)!=0)goto failure;attr_ready=1;
 if(posix_spawnattr_setflags(&attributes,POSIX_SPAWN_CLOEXEC_DEFAULT)!=0||posix_spawn_file_actions_addinherit_np(&actions,0)!=0||posix_spawn_file_actions_adddup2(&actions,out[1],1)!=0||posix_spawn_file_actions_adddup2(&actions,err[1],2)!=0)goto failure;
 for(int at=0;at<2;at++)if(posix_spawn_file_actions_addclose(&actions,out[at])!=0||posix_spawn_file_actions_addclose(&actions,err[at])!=0)goto failure;
 char *const argv[]={(char*)launcher,NULL};
 /* Not detached: collector and fixed non-spawning actors inherit OWN session. */
 if(posix_spawn(&child,launcher,&actions,&attributes,argv,environ)!=0||child<=0)goto failure;
 if(posix_spawnattr_destroy(&attributes)!=0)failed=1;attr_ready=0;if(posix_spawn_file_actions_destroy(&actions)!=0)failed=1;actions_ready=0;
 if(!close_fd(&out[1]))failed=1;if(!close_fd(&err[1]))failed=1;
 while(!failed&&(!child_reaped||!out_eof||!err_eof)&&timely(absolute_limit)){
  if(!child_reaped){const pid_t w=waitpid(child,&status,WNOHANG);if(w==child)child_reaped=1;else if(w<0&&errno!=EINTR)failed=1;}
  struct pollfd streams[2]={{out_eof?-1:out[0],POLLIN,0},{err_eof?-1:err[0],POLLIN,0}};const int ready=poll(streams,2,10);if(ready<0&&errno!=EINTR)failed=1;
  for(int at=0;ready>0&&at<2;at++){if(streams[at].revents&(POLLERR|POLLNVAL))failed=1;if(streams[at].revents&(POLLIN|POLLHUP))if(!read_capture(streams[at].fd,at?error:output,at?&err_used:&out_used,at?&err_eof:&out_eof))failed=1;}
 }
 if(!close_fd(&out[0]))failed=1;if(!close_fd(&err[0]))failed=1;
 if(failed||!child_reaped||!out_eof||!err_eof||!WIFEXITED(status)||err_used||!timely(absolute_limit))goto failure;
 /* The exact protected collector writes this only AFTER BEGIN, all launched
  * no-fork actors' kernel-backed close events and matching original END.
  * Every actor's output is parsed privately; it cannot reach this frame pipe. */
 const size_t prefix=sizeof(frame)-1;
 if(out_used<prefix+7||memcmp(output,frame,prefix)!=0||(output[prefix]!='E'&&output[prefix]!='F')||output[prefix+1]!=':'||output[prefix+2]<'0'||output[prefix+2]>'4'||output[prefix+3]!='\n'||output[prefix+4]!='{'||output[out_used-2]!='}'||output[out_used-1]!='\n')goto failure;
 const int asserted_fail=output[prefix]=='F';
 if((asserted_fail&&WEXITSTATUS(status)!=1)||(!asserted_fail&&(WEXITSTATUS(status)!=74||output[prefix+2]=='0')))goto failure;
 for(size_t at=prefix+4;at<out_used-1;at++)if(output[at]==0||output[at]=='\n'||output[at]=='\r')goto failure;
 const size_t payload=out_used-prefix-4;struct result r={RESULT,(uint32_t)payload,(uint32_t)asserted_fail};
 if(!send_private(control,&r,sizeof(r),absolute_limit)||!send_private(control,output+prefix+4,payload,absolute_limit)||!close_fd(&control))goto failure;
 /* A validated FAIL survives incomplete interval/lifecycle. Kill the owned
  * session before parent publication; never claim END or reusable evidence. */
 if(asserted_fail){(void)kill(0,SIGKILL);_exit(74);}
 _exit(0);
#endif
failure:
 /* Failure cannot END/publish or repair observation. Killing only the direct
  * collector could strand mapper descendants; kill this OWN complete group. */
 (void)actions_ready;(void)attr_ready;(void)kill(0,SIGKILL);_exit(74);
}
int main(int argc,char **argv){
 if(argc!=1||argv==NULL||argv[0]==NULL||strcmp(argv[0],self)!=0||environ==NULL||!signal_preconditions())return 74;
 for(int fd=0;fd<3;fd++)if(fcntl(fd,F_GETFD)<0)return 74;
 const uint64_t began=now_ms();if(began==UINT64_MAX||began>UINT64_MAX-15000)return 74;absolute_limit=began+14900;
 if(!watchdog())return 74;int control[2]={-1,-1},gate[2]={-1,-1};if(!pipe_owned(control)||!pipe_owned(gate)||!nonblock(control[0])||!nonblock(control[1])||!nonblock(gate[0])||!nonblock(gate[1]))return 74;
 const pid_t parent=getpid(),child=fork();if(child<0)return 74;
 if(child==0){if(!close_fd(&control[0])||!close_fd(&gate[1]))_exit(74);worker(control[1],gate[0],began,parent);_exit(74);}
 const sig_atomic_t reserved=(sig_atomic_t)child;if((pid_t)reserved!=child){(void)kill(child,SIGKILL);return 74;}owned_pid=reserved;
 int failed=0,eof=0,status=0;size_t used=0;unsigned char bytes[sizeof(struct ack)+sizeof(struct result)+LIMIT];
 if(!close_fd(&control[1]))failed=1;if(!close_fd(&gate[0]))failed=1;
 while(!failed&&!eof&&timely(began+14000)){
  struct pollfd p={control[0],POLLIN,0};const int n=poll(&p,1,10);if(n<0&&errno!=EINTR){failed=1;break;}if(n>0&&(p.revents&(POLLERR|POLLNVAL))){failed=1;break;}
  if(n>0&&(p.revents&(POLLIN|POLLHUP))){unsigned char block[256];const ssize_t count=read(control[0],block,sizeof(block));if(count==0)eof=1;else if(count>0){if((size_t)count>sizeof(bytes)-used){failed=1;break;}memcpy(bytes+used,block,(size_t)count);used+=(size_t)count;}else if(errno!=EAGAIN&&errno!=EINTR){failed=1;break;}}
  if(!own_group&&used>=sizeof(struct ack)){struct ack a;memcpy(&a,bytes,sizeof(a));if(a.magic!=ACK||a.pid!=child||a.pgid!=child||a.sid!=child){failed=1;break;}own_group=1;
   const uint32_t go=GO;if(!send_private(gate[1],&go,sizeof(go),began+14000))failed=1;if(!close_fd(&gate[1]))failed=1;
  }
 }
 if(!close_fd(&control[0]))failed=1;if(!close_fd(&gate[1]))failed=1;
 struct result result={0};if(used>=sizeof(struct ack)+sizeof(result))memcpy(&result,bytes+sizeof(struct ack),sizeof(result));
 if(!eof||!own_group||result.magic!=RESULT||result.length==0||result.length>LIMIT||result.failed_assertion>1||used!=sizeof(struct ack)+sizeof(result)+result.length||!timely(began+14000))failed=1;
 /* Never reap the worker before deciding whether group cleanup is necessary:
  * its reserved PID anchors our acknowledged owned PGID. After reap, never
  * send a kill to a potentially reused numeric group identity. */
 if(failed){if(own_group){if(kill(-child,SIGKILL)!=0&&errno!=ESRCH)failed=1;}else if(kill(child,SIGKILL)!=0&&errno!=ESRCH)failed=1;}
 while(timely(began+14750)){
  /* Atomic w.r.t. watchdog: PID reservation can be released by waitpid. Never
   * let SIGALRM observe owned_pid after that release, including ECHILD. */
  sigset_t block,old;sigemptyset(&block);sigaddset(&block,SIGALRM);
  if(sigprocmask(SIG_BLOCK,&block,&old)!=0)return 74;
  const pid_t w=waitpid(child,&status,WNOHANG);const int wait_error=errno;
  if(w==child){reaped=1;owned_pid=0;own_group=0;}
  else if(w<0&&wait_error!=EINTR){owned_pid=0;own_group=0;failed=1;}
  if(sigprocmask(SIG_SETMASK,&old,NULL)!=0)return 74;
  if(w==child||(w<0&&wait_error!=EINTR))break;(void)poll(NULL,0,10);
 }
 const int normal_exit=WIFEXITED(status)&&WEXITSTATUS(status)==0;
 const int controlled_failed_cleanup=result.failed_assertion&&WIFSIGNALED(status)&&WTERMSIG(status)==SIGKILL;
 if(!reaped||failed||(!normal_exit&&!controlled_failed_cleanup))return 74;
 /* Supplemental normal-completion confirmation only. EPERM is NOT absence.
  * All actor closure must already precede END in the protected collector. */
 if(kill(-child,0)==0||errno!=ESRCH||!timely(began+14750))return 74;
 /* First native-capture publication, AFTER worker reap and additional group
  * absence. E requires original END and normal collector/worker completion.
  * F retains a known assertion FAIL after controlled owned-group cleanup;
  * it does NOT require or invent END. Partial writes cannot be accepted. */
 size_t at=0;const unsigned char *payload=bytes+sizeof(struct ack)+sizeof(result);
 while(at<result.length&&timely(absolute_limit)){const ssize_t n=write(1,payload+at,result.length-at);if(n>0)at+=(size_t)n;else if(n<0&&errno==EINTR)continue;else return 74;}
 /* A full write is necessary but not sufficient: publication itself consumes
  * the same absolute budget. Complete E/UNKNOWN and F/FAIL transport exit0
  * permits the native normal-result envelope; it never certifies the body. */
 return at==result.length&&timely(absolute_limit)?0:74;
}
