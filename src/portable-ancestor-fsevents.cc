// Fixed CI-only raw occurrence collector. The parent must establish protected
// scope/host authority BEFORE launch; this process supplies no trust or CURRENT.
#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <functional>
#include <iostream>
#include <limits>
#include <mutex>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>
#ifndef REDUE_ANCESTOR_PURE_TEST
#include <CoreServices/CoreServices.h>
#include <dispatch/dispatch.h>
#include <signal.h>
#include <unistd.h>
#endif
namespace redue_ancestor {
constexpr size_t maxScopes=8192,maxPath=4096,maxInit=8*1024*1024,maxBatch=65536;
constexpr uint64_t maxSerial=9007199254740991ULL;
struct Scope { uint32_t id;std::string path;bool descendants; };
struct ProtocolError:std::runtime_error { explicit ProtocolError():std::runtime_error("PROTOCOL"){} };
bool asciiCanonical(const std::string& path) {
  if(path.empty()||path.size()>maxPath||path[0]!='/'||(path.size()>1&&path.back()=='/'))return false;
  std::string component;
  for(size_t i=1;i<=path.size();i++){
    if(i==path.size()||path[i]=='/'){
      if(path.size()>1&&(component.empty()||component=="."||component==".."))return false;
      component.clear();continue;
    }
    const unsigned char c=path[i];
    if(c<32||c>126||c=='\\'||c==':')return false;
    component+=char(c);
  }
  return true;
}
bool utf8(const std::string& text){
  for(size_t i=0;i<text.size();){const unsigned char c=text[i++];
    if(c<128)continue;unsigned count;uint32_t value,min;
    if(c>=0xc2&&c<=0xdf){count=1;value=c&31;min=0x80;}
    else if(c>=0xe0&&c<=0xef){count=2;value=c&15;min=0x800;}
    else if(c>=0xf0&&c<=0xf4){count=3;value=c&7;min=0x10000;}else return false;
    if(i+count>text.size())return false;
    while(count--){const unsigned char next=text[i++];if((next&0xc0)!=0x80)return false;value=(value<<6)|(next&63);}
    if(value<min||value>0x10ffff||(value>=0xd800&&value<=0xdfff))return false;
  }return true;
}
std::vector<std::string> components(const std::string& path){
  std::vector<std::string> result;size_t start=1;
  for(size_t i=1;i<=path.size();i++)if(i==path.size()||path[i]=='/'){if(i>start)result.push_back(path.substr(start,i-start));start=i+1;}
  return result;
}
enum class Match { irrelevant,relevant,unknown };
Match match(const std::string& candidate,const std::string& event,bool descendants){
  if(!asciiCanonical(candidate)||event.empty()||event.size()>maxPath||event[0]!='/'||
      (event.size()>1&&event.back()=='/')||!utf8(event))return Match::unknown;
  for(size_t i=0;i<event.size();i++){const unsigned char c=event[i];if(c<32||c==127||c=='\\'||c==':')return Match::unknown;}
  const auto wanted=components(candidate),actual=components(event);
  for(const auto& item:actual)if(item.empty()||item=="."||item=="..")return Match::unknown;
  if(event.find("//")!=std::string::npos)return Match::unknown;
  auto fold=[](std::string s){for(char& c:s)if(c>='A'&&c<='Z')c+=32;return s;};
  const std::vector<std::string> dataPrefix={"system","volumes","data"};
  bool potentialPrefix=!actual.empty();
  for(size_t i=0;i<std::min(actual.size(),dataPrefix.size());i++){
    bool ambiguous=false;for(unsigned char c:actual[i])if(c>127)ambiguous=true;
    if(ambiguous)return Match::unknown;
    if(fold(actual[i])!=dataPrefix[i]){potentialPrefix=false;break;}
  }
  if(potentialPrefix){
    if(actual.size()<dataPrefix.size())return Match::unknown;
    const std::vector<std::string> alias(actual.begin()+3,actual.end());
    bool possible=true,ambiguous=false;
    for(size_t i=0;i<std::min(wanted.size(),alias.size());i++){
      std::string component=alias[i];bool unknown=false;for(unsigned char c:component)if(c>127)unknown=true;
      if(unknown){ambiguous=true;break;}for(char& c:component)if(c>='A'&&c<='Z')c+=32;
      std::string expected=wanted[i];for(char& c:expected)if(c>='A'&&c<='Z')c+=32;
      if(component!=expected){possible=false;break;}
    }
    if(possible&&(ambiguous||!(alias.size()>wanted.size()&&!descendants)))return Match::unknown;
  }
  const size_t count=std::min(wanted.size(),actual.size());
  for(size_t i=0;i<count;i++){
    bool nonascii=false;for(const unsigned char c:actual[i])if(c>127)nonascii=true;
    if(nonascii)return Match::unknown;
    if(fold(actual[i])!=fold(wanted[i]))return Match::irrelevant;
  }
  return actual.size()>wanted.size()&&!descendants?Match::irrelevant:Match::relevant;
}
std::string boundedLine(std::istream& input,size_t cap,size_t& bytes){
  std::string line;char c;
  while(input.get(c)){if(++bytes>maxInit||line.size()>=cap||c=='\r'||c=='\0'||c=='\t')throw ProtocolError();if(c=='\n')return line;line+=c;}
  throw ProtocolError();
}
uint64_t number(const std::string& text,uint64_t maximum){
  if(text.empty()||(text.size()>1&&text[0]=='0'))throw ProtocolError();uint64_t n=0;
  for(char c:text){if(c<'0'||c>'9'||uint64_t(c-'0')>maximum||n>(maximum-uint64_t(c-'0'))/10)throw ProtocolError();n=n*10+uint64_t(c-'0');}if(n>maximum)throw ProtocolError();return n;
}
std::vector<Scope> initialization(std::istream& input){
  size_t bytes=0;const auto head=boundedLine(input,64,bytes);
  if(head.rfind("INIT ",0)!=0)throw ProtocolError();const size_t count=number(head.substr(5),maxScopes);
  if(count==0)throw ProtocolError();std::vector<Scope> scopes;std::vector<bool> ids(maxScopes,false);
  for(size_t i=0;i<count;i++){
    const auto header=boundedLine(input,64,bytes);const auto space=header.find(' '),second=header.find(' ',space==std::string::npos?0:space+1);
    if(space==std::string::npos||second==std::string::npos||header.find(' ',second+1)!=std::string::npos)throw ProtocolError();
    const auto id=number(header.substr(0,space),maxScopes-1),length=number(header.substr(space+1,second-space-1),maxPath),mode=number(header.substr(second+1),1);
    if(length==0||bytes+length+1>maxInit||ids[id])throw ProtocolError();ids[id]=true;
    std::string path(length,'\0');if(!input.read(path.data(),length))throw ProtocolError();bytes+=length;
    char end;if(!input.get(end)||end!='\n')throw ProtocolError();bytes++;
    if(!asciiCanonical(path)||path=="/")throw ProtocolError();scopes.push_back({uint32_t(id),path,mode==1});
  }return scopes;
}
struct Request { bool close;uint64_t id; };
Request request(const std::string& line){
  if(line.rfind("barrier ",0)==0)return {false,number(line.substr(8),maxSerial)};
  if(line.rfind("close ",0)==0)return {true,number(line.substr(6),maxSerial)};
  throw ProtocolError();
}
class Requests {
  bool any=false;uint64_t last=0;
public:
  Request next(const std::string& line){const auto value=request(line);if(any&&value.id<=last)throw ProtocolError();any=true;last=value.id;return value;}
};
class Collector {
  std::vector<Scope> scopes;std::function<void(const std::string&)> emit;mutable std::mutex mutex;
  uint64_t serial=0;bool uncertain=false;
  void uncertaintyLocked(const char* code){if(uncertain)return;uncertain=true;emit(std::string("{\"schema\":1,\"type\":\"uncertainty\",\"code\":\"")+code+"\",\"serial\":"+std::to_string(serial)+"}");}
public:
  Collector(std::vector<Scope> s,std::function<void(const std::string&)> e):scopes(std::move(s)),emit(std::move(e)){}
  #ifdef REDUE_ANCESTOR_PURE_TEST
  void testSerial(uint64_t value){serial=value;}
#endif
  void uncertainty(const char* code){std::lock_guard<std::mutex> lock(mutex);uncertaintyLocked(code);}
  void occurrence(const std::string& event,uint32_t flags,uint64_t eventId){
    std::lock_guard<std::mutex> lock(mutex);
    // MustScan, dropped events, wrap, unexpected history, root change, mounts,
    // and unknown provider bits permanently withdraw interval authority.
    if(flags&0x7f){uncertaintyLocked("FSEVENTS_GAP");return;}
    if(flags&0x80){uncertaintyLocked("FSEVENTS_GAP");return;}
    if(flags&~uint32_t(0x7fffff)){uncertaintyLocked("FSEVENTS_FLAGS");return;}
    if(eventId==0||eventId==std::numeric_limits<uint64_t>::max()){uncertaintyLocked("FSEVENTS_ID");return;}
    std::vector<uint32_t> ids;bool unknown=false;
    for(const auto& scope:scopes){const auto result=match(scope.path,event,scope.descendants);if(result==Match::relevant)ids.push_back(scope.id);else if(result==Match::unknown)unknown=true;}
    if(unknown)uncertaintyLocked("FSEVENTS_PATH");
    if(ids.empty())return;
    if(serial==maxSerial){uncertaintyLocked("FSEVENTS_SERIAL");return;}serial++;
    std::string list;for(uint32_t id:ids){if(!list.empty())list+=',';list+=std::to_string(id);}
    // Every raw relevant occurrence survives; no created/deleted aggregation.
    emit("{\"schema\":1,\"type\":\"occurrence\",\"serial\":"+std::to_string(serial)+",\"scopeIds\":["+list+"]}");
  }
  void boundary(const char* type,uint64_t id){std::lock_guard<std::mutex> lock(mutex);
    emit(std::string("{\"schema\":1,\"type\":\"")+type+"\",\"request\":"+std::to_string(id)+",\"serial\":"+std::to_string(serial)+",\"uncertain\":"+(uncertain?"true":"false")+"}");}
};
} // namespace
#ifndef REDUE_ANCESTOR_PURE_TEST
namespace {
std::mutex outputMutex;size_t outputBytes=0,outputRows=0;
void output(const std::string& line){
  std::lock_guard<std::mutex> lock(outputMutex);
  if(line.size()>65536||++outputRows>32768||outputBytes+line.size()+1>4*1024*1024)_exit(74);
  const std::string bytes=line+'\n';outputBytes+=bytes.size();size_t at=0;
  while(at<bytes.size()){const ssize_t n=write(STDOUT_FILENO,bytes.data()+at,bytes.size()-at);if(n<=0)_exit(74);at+=size_t(n);}
}
void callback(ConstFSEventStreamRef,void* context,size_t count,void* paths,const FSEventStreamEventFlags flags[],const FSEventStreamEventId ids[]){
  auto* collector=static_cast<redue_ancestor::Collector*>(context);
  try{
    if(!paths||!flags||!ids||count>redue_ancestor::maxBatch){collector->uncertainty("FSEVENTS_BATCH");return;}
    auto** names=static_cast<char**>(paths);
    for(size_t i=0;i<count;i++){
      if(!names[i]){collector->uncertainty("FSEVENTS_PATH");continue;}
      const size_t length=strnlen(names[i],redue_ancestor::maxPath+1);
      if(length>redue_ancestor::maxPath){collector->uncertainty("FSEVENTS_PATH");continue;}
      // Path exists only transiently during filtering; no raw path is emitted,
      // stored in history, statted, opened, or read by this helper.
      collector->occurrence(std::string(names[i],length),flags[i],ids[i]);
    }
  }catch(...){_exit(74);}
}
}
int main(int argc,char**){
  using namespace redue_ancestor;
  if(argc!=1)return 64;signal(SIGPIPE,SIG_IGN);
  std::vector<Scope> scopes;try{scopes=initialization(std::cin);}catch(...){output("{\"schema\":1,\"type\":\"uncertainty\",\"code\":\"PROTOCOL\"}");return 64;}
  Collector collector(std::move(scopes),output);
  const void* roots[]={CFSTR("/")};const CFArrayRef rootsArray=CFArrayCreate(nullptr,roots,1,&kCFTypeArrayCallBacks);
  if(!rootsArray){collector.uncertainty("FSEVENTS_START");return 70;}
  FSEventStreamContext context={0,&collector,nullptr,nullptr,nullptr};
  const auto stream=FSEventStreamCreate(nullptr,callback,&context,rootsArray,kFSEventStreamEventIdSinceNow,0.001,
    kFSEventStreamCreateFlagFileEvents|kFSEventStreamCreateFlagWatchRoot|kFSEventStreamCreateFlagNoDefer);
  CFRelease(rootsArray);
  if(!stream){collector.uncertainty("FSEVENTS_START");return 70;}
  const auto queue=dispatch_queue_create("redue.portable.ancestor",DISPATCH_QUEUE_SERIAL);
  if(!queue){FSEventStreamRelease(stream);collector.uncertainty("FSEVENTS_START");return 70;}
  FSEventStreamSetDispatchQueue(stream,queue);
  if(!FSEventStreamStart(stream)){FSEventStreamInvalidate(stream);FSEventStreamRelease(stream);dispatch_release(queue);collector.uncertainty("FSEVENTS_START");return 70;}
  // stdin processing runs on main, outside the serial callback queue. FlushSync
  // delivers already occurred callbacks; the parent enforces a hard deadline.
  int exitCode=0;Requests requests;uint64_t closeId=0;bool closed=false;
  try{
    FSEventStreamFlushSync(stream);collector.boundary("ready",0);
    size_t bytes=0;
    for(;;){const auto next=requests.next(boundedLine(std::cin,64,bytes));
      FSEventStreamFlushSync(stream);
      if(next.close){closeId=next.id;closed=true;break;}
      collector.boundary("barrier",next.id);
    }
  }catch(...){collector.uncertainty("PROTOCOL");exitCode=64;}
  FSEventStreamStop(stream);FSEventStreamInvalidate(stream);
  dispatch_sync(queue,^{});FSEventStreamRelease(stream);dispatch_release(queue);
  if(closed)collector.boundary("closed",closeId);
  return exitCode;
}
#endif
