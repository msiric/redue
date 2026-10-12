// TEST-ONLY fixed-target vnode spike. Never part of the shipped evidence engine.
// The parent supplies reviewed local targets and owns a hard process deadline.
#include <algorithm>
#include <chrono>
#include <cstdint>
#include <iostream>
#include <limits>
#include <set>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>
#ifndef REDUE_VNODE_PURE_TEST
#include <fcntl.h>
#include <sys/event.h>
#include <sys/resource.h>
#include <sys/stat.h>
#include <unistd.h>
#endif
namespace vnode_spike {
constexpr uint64_t safeInteger=9007199254740991ULL;
constexpr size_t maxTargets=256,maxPath=4096,maxInput=2*1024*1024,maxEvents=4096;
constexpr uint32_t knownNotes=1|2|4|8|16|32|64;
struct Target{uint64_t id,dev,ino,mode;std::string path;};
uint64_t number(const std::string& text,uint64_t maximum){
  if(text.empty()||(text.size()>1&&text[0]=='0'))throw std::runtime_error("PROTOCOL");
  uint64_t n=0;for(const unsigned char c:text){if(c<'0'||c>'9')throw std::runtime_error("PROTOCOL");
    const uint64_t d=c-'0';if(d>maximum||n>(maximum-d)/10)throw std::runtime_error("PROTOCOL");n=n*10+d;}
  if(n>maximum)throw std::runtime_error("PROTOCOL");return n;
}
bool canonical(const std::string& path){
  if(path.size()<2||path.size()>maxPath||path[0]!='/'||path.back()=='/')return false;
  size_t begin=1;for(size_t at=1;at<=path.size();at++){
    if(at<path.size()){const unsigned char c=path[at];if(c<32||c>=127||c=='\\')return false;}
    if(at==path.size()||path[at]=='/'){const auto part=path.substr(begin,at-begin);
      if(part.empty()||part=="."||part=="..")return false;begin=at+1;}}
  return true;
}
std::string line(std::istream& input,size_t limit,size_t& total){
  std::string value;char c;while(input.get(c)){if(++total>maxInput||value.size()>limit)throw std::runtime_error("PROTOCOL");
    if(c=='\n'){if(value.size()>limit)throw std::runtime_error("PROTOCOL");return value;}value+=c;}
  throw std::runtime_error("PROTOCOL");
}
std::vector<Target> initialization(std::istream& input){
  size_t total=0;const auto header=line(input,32,total);
  if(header.substr(0,5)!="INIT ")throw std::runtime_error("PROTOCOL");
  const auto count=number(header.substr(5),maxTargets);if(!count)throw std::runtime_error("PROTOCOL");
  std::vector<Target> targets;std::set<uint64_t> ids;std::set<std::string> paths;
  for(size_t i=0;i<count;i++){
    const auto text=line(input,128,total);std::istringstream fields(text);std::string id,length,dev,ino,mode,extra;
    if(!(fields>>id>>length>>dev>>ino>>mode)||fields>>extra||text!=id+" "+length+" "+dev+" "+ino+" "+mode)throw std::runtime_error("PROTOCOL");
    Target t{number(id,maxTargets-1),number(dev,std::numeric_limits<uint64_t>::max()),number(ino,std::numeric_limits<uint64_t>::max()),number(mode,65535),""};
    const auto bytes=number(length,maxPath);if(!bytes)throw std::runtime_error("PROTOCOL");
    t.path.resize(bytes);if(!input.read(t.path.data(),bytes))throw std::runtime_error("PROTOCOL");total+=bytes;
    char newline;if(!input.get(newline)||newline!='\n'||++total>maxInput||!canonical(t.path))throw std::runtime_error("PROTOCOL");
    // Exact full st_mode; no symbolic link or other special object is admitted.
    if((t.mode&0170000)!=0100000&&(t.mode&0170000)!=0040000)throw std::runtime_error("PROTOCOL");
    if(!ids.insert(t.id).second||!paths.insert(t.path).second)throw std::runtime_error("PROTOCOL");targets.push_back(t);
  }
  return targets;
}
struct Request{uint64_t id;bool close;};
struct Requests{
  bool seen=false;uint64_t previous=0;
  Request next(const std::string& line){const auto split=line.find(' ');if(split==std::string::npos)throw std::runtime_error("PROTOCOL");
    const auto verb=line.substr(0,split);if(verb!="barrier"&&verb!="close")throw std::runtime_error("PROTOCOL");
    const auto id=number(line.substr(split+1),safeInteger);if(seen&&id<=previous)throw std::runtime_error("PROTOCOL");seen=true;previous=id;return{id,verb=="close"};}
};
struct Collector{
  std::set<uint64_t> admitted,dirty;uint64_t serial=0;bool uncertain=false;size_t outputBytes=0,outputRows=0;
  explicit Collector(const std::vector<Target>& targets){for(const auto& target:targets)admitted.insert(target.id);}
  void emit(const std::string& json){if(++outputRows>32768||(outputBytes+=json.size()+1)>4*1024*1024)throw std::runtime_error("OUTPUT_LIMIT");
    std::cout<<json<<'\n';std::cout.flush();if(!std::cout)throw std::runtime_error("OUTPUT_FAILED");}
  void unknown(const char* code){if(!uncertain){uncertain=true;emit(std::string("{\"schema\":1,\"type\":\"uncertainty\",\"code\":\"")+code+"\"}");}}
  void event(uint64_t id,uint32_t notes,bool invalid){
    if(invalid||!admitted.count(id)||!notes||(notes&~knownNotes)){unknown("VNODE_EVENT");return;}
    if(serial==safeInteger){unknown("VNODE_SERIAL");return;}dirty.insert(id);serial++;
    emit("{\"schema\":1,\"type\":\"occurrence\",\"scopeIds\":["+std::to_string(id)+"],\"serial\":"+std::to_string(serial)+"}");
  }
  void boundary(const char* type,uint64_t request){std::string ids;for(const auto id:dirty){if(!ids.empty())ids+=',';ids+=std::to_string(id);}
    emit(std::string("{\"schema\":1,\"type\":\"")+type+"\",\"request\":"+std::to_string(request)+",\"serial\":"+std::to_string(serial)+",\"dirtyIds\":["+ids+"],\"uncertain\":"+(uncertain?"true":"false")+"}");}
};
bool receipt(uint64_t expected,uint64_t ident,int filter,int flags,intptr_t data){return ident==expected&&filter==-4&&flags==0x4000&&data==0;}
bool resourceFits(uint64_t targetCount,uint64_t limit){return targetCount>0&&targetCount<=maxTargets&&limit>=targetCount+16;}
bool deliveryValid(int filter,uint16_t flags,intptr_t data){return filter==-4&&(flags&~0x0020)==0&&data==0;}
bool drainFits(size_t count,std::chrono::steady_clock::duration elapsed){return count<maxEvents&&elapsed<std::chrono::milliseconds(50);}
}
#ifndef REDUE_VNODE_PURE_TEST
namespace vnode_spike {
static_assert(EVFILT_VNODE==-4&&EV_ERROR==0x4000,"Reviewed event ABI");
static_assert((NOTE_DELETE|NOTE_WRITE|NOTE_EXTEND|NOTE_ATTRIB|NOTE_LINK|NOTE_RENAME|NOTE_REVOKE)==knownNotes,"Reviewed NOTE ABI");
struct Owned{
  int queue=-1;std::vector<int> fds;
  ~Owned(){for(const auto fd:fds)::close(fd);if(queue>=0)::close(queue);}
};
bool identity(int fd,const Target& target){struct stat stat{};return fstat(fd,&stat)==0&&
  static_cast<uint64_t>(stat.st_dev)==target.dev&&static_cast<uint64_t>(stat.st_ino)==target.ino&&static_cast<uint64_t>(stat.st_mode)==target.mode&&
  (S_ISREG(stat.st_mode)||S_ISDIR(stat.st_mode));}
void drain(Owned& owned,const std::vector<Target>& targets,Collector& collector){
  const auto started=std::chrono::steady_clock::now();size_t count=0;struct kevent events[32];const timespec zero{0,0};
  for(;;){if(!drainFits(count,std::chrono::steady_clock::now()-started)){collector.unknown("VNODE_DRAIN_LIMIT");return;}
    const int n=kevent(owned.queue,nullptr,0,events,32,&zero);if(n<0){collector.unknown("VNODE_DRAIN");return;}
    if(!drainFits(count,std::chrono::steady_clock::now()-started)){collector.unknown("VNODE_DRAIN_LIMIT");return;}if(n==0)return;
    count+=n;for(int at=0;at<n;at++){const auto& event=events[at];const auto found=std::find(owned.fds.begin(),owned.fds.end(),static_cast<int>(event.ident));
      const bool invalid=!deliveryValid(event.filter,event.flags,event.data)||found==owned.fds.end();
      const size_t index=found==owned.fds.end()?targets.size():static_cast<size_t>(found-owned.fds.begin());
      collector.event(index<targets.size()?targets[index].id:256,event.fflags,invalid);}
  }
}
}
int main(int argc,char**){using namespace vnode_spike;if(argc!=1)return 64;
  try{const auto targets=initialization(std::cin);Collector collector(targets);Owned owned;
    rlimit limit{};if(getrlimit(RLIMIT_NOFILE,&limit)!=0||!resourceFits(targets.size(),limit.rlim_cur)){collector.unknown("VNODE_RESOURCE");return 74;}
    owned.queue=kqueue();if(owned.queue<0){collector.unknown("VNODE_RESOURCE");return 74;}
    for(const auto& target:targets){const int fd=open(target.path.c_str(),O_EVTONLY|O_NOFOLLOW|O_CLOEXEC);
      if(fd<0){collector.unknown("VNODE_TARGET");return 74;}owned.fds.push_back(fd);
      if(!identity(fd,target)){collector.unknown("VNODE_IDENTITY");return 74;}
      struct kevent change{},received{};EV_SET(&change,fd,EVFILT_VNODE,EV_ADD|EV_CLEAR|EV_RECEIPT,knownNotes,0,nullptr);
      const timespec zero{0,0};const int n=kevent(owned.queue,&change,1,&received,1,&zero);
      if(n!=1||!receipt(fd,received.ident,received.filter,received.flags,received.data)){collector.unknown("VNODE_REGISTRATION");return 74;}}
    for(size_t i=0;i<targets.size();i++)if(!identity(owned.fds[i],targets[i])){collector.unknown("VNODE_IDENTITY");return 74;}
    drain(owned,targets,collector);collector.boundary("ready",0);Requests requests;size_t total=0;
    for(;;){const auto request=requests.next(line(std::cin,64,total));drain(owned,targets,collector);
      if(request.close){for(auto& fd:owned.fds){if(::close(fd)!=0)collector.unknown("VNODE_CLOSE");fd=-1;}owned.fds.clear();
        if(::close(owned.queue)!=0)collector.unknown("VNODE_CLOSE");owned.queue=-1;collector.boundary("closed",request.id);return 0;}
      collector.boundary("barrier",request.id);}
  }catch(const std::exception&){std::cerr<<"VNODE_PROTOCOL_OR_IO\n";return 74;}
}
#endif
