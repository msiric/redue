#define REDUE_ANCESTOR_PURE_TEST
#include "../../src/portable-ancestor-fsevents.cc"
using namespace redue_ancestor;
int main(int argc,char** argv){
  if(argc!=2)return 64;
  const std::string mode=argv[1];
  if(mode=="initialization"){
    try{const auto scopes=initialization(std::cin);std::cout<<"{\"count\":"<<scopes.size()<<",\"ids\":[";bool first=true;for(const auto& s:scopes){if(!first)std::cout<<',';first=false;std::cout<<s.id;}std::cout<<"]}\n";return 0;}catch(...){std::cout<<"{\"code\":\"PROTOCOL\"}\n";return 64;}
  }
  if(mode=="limits"){
    std::ostringstream input;input<<"INIT 8192\n";const std::string value="/"+std::string(4095,'x');for(size_t i=0;i<8192;i++)input<<i<<" 4096\n"<<value<<'\n';
    std::istringstream bytes(input.str());try{initialization(bytes);return 1;}catch(...){std::cout<<"{\"code\":\"PROTOCOL\"}\n";return 64;}
  }
  if(mode=="request-loop"){
    Requests requests;std::string line;try{while(std::getline(std::cin,line))requests.next(line);return 0;}catch(...){return 64;}
  }
  if(mode=="request"){
    std::string line;std::getline(std::cin,line);try{const auto r=request(line);std::cout<<"{\"id\":"<<r.id<<",\"close\":"<<(r.close?"true":"false")<<"}\n";return 0;}catch(...){std::cout<<"{\"code\":\"PROTOCOL\"}\n";return 64;}
  }
  std::vector<Scope> scopes={{0,"/private/tmp/project-parent/node_modules/@typescript/lib-es2022/index.d.ts"},{1,"/private/tmp/project-parent/node_modules"}};
  Collector collector(scopes,[](const std::string& row){std::cout<<row<<'\n';});
  if(mode=="transient"){
    collector.occurrence(scopes[0].path,0x100,1);collector.occurrence(scopes[0].path,0x200,2);
  }else if(mode=="coalesced")collector.occurrence(scopes[0].path,0x300,1);
  else if(mode=="case")collector.occurrence("/PRIVATE/TMP/PROJECT-PARENT/NODE_MODULES/@TYPESCRIPT/LIB-ES2022/INDEX.D.TS",0x100,1);
  else if(mode=="unrelated")collector.occurrence("/private/tmp/unrelated/source-private.ts",0x100,1);
  else if(mode=="unicode")collector.occurrence("/private/tmp/project-parent/node_modules/@typescript/lib-es2022/inde\xe2\x84\xaa.d.ts",0x100,1);
  else if(mode=="unrelated-unicode")collector.occurrence("/unrelated/\xe6\x96\x87/source.ts",0x100,1);
  else if(mode=="malformed")collector.occurrence("/private/tmp/project-parent/../node_modules",0x100,1);
  else if(mode=="overflow-path")collector.occurrence(std::string(5000,'x'),0x100,1);
  else if(mode=="bad-id")collector.occurrence(scopes[0].path,0x100,0);
  else if(mode=="serial"){collector.testSerial(maxSerial);collector.occurrence(scopes[0].path,0x100,1);}
  else if(mode=="flags"){
    for(uint32_t flag:{1u,2u,4u,8u,16u,32u,64u,128u,0x800000u}){
      Collector each(scopes,[](const std::string& row){std::cout<<row<<'\n';});each.occurrence("/unrelated",flag,1);each.boundary("barrier",flag);
    }return 0;
  }else if(mode=="latch"){
    collector.occurrence("/unrelated",2,1);collector.occurrence(scopes[0].path,0x100,2);
  }else if(mode=="ancestor")collector.occurrence("/private/tmp/project-parent",0x800,1);
  else return 64;
  collector.boundary("barrier",1);return 0;
}
