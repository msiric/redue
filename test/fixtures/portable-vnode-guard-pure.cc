// Pure protocol/decision controls: no kqueue, open or vnode subscription compiled.
#define REDUE_VNODE_PURE_TEST
#include "portable-vnode-guard.cc"
int main(int argc,char** argv){using namespace vnode_spike;if(argc!=2)return 64;
  try{const std::string mode=argv[1];
    if(mode=="init"){const auto targets=initialization(std::cin);std::cout<<"{\"count\":"<<targets.size()<<",\"ids\":[";bool first=true;
      for(const auto& target:targets){if(!first)std::cout<<',';first=false;std::cout<<target.id;}std::cout<<"]}\n";}
    else if(mode=="requests"){Requests requests;size_t total=0;while(std::cin.peek()!=EOF){const auto request=requests.next(line(std::cin,64,total));std::cout<<"{\"id\":"<<request.id<<",\"close\":"<<(request.close?"true":"false")<<"}\n";}}
    else if(mode=="receipts"){for(const bool result:{receipt(4,4,-4,0x4061,0),receipt(4,4,-4,0x4061,1),receipt(4,5,-4,0x4061,0),receipt(4,4,-3,0x4061,0),receipt(4,4,-4,0,0),receipt(4,4,-4,0x4000,0),receipt(4,4,-4,0x4060,0),receipt(4,4,-4,0x4041,0),receipt(4,4,-4,0x4021,0),receipt(4,4,-4,0x61,0),receipt(4,4,-4,0x4063,0)})std::cout<<"{\"accepted\":"<<(result?"true":"false")<<"}\n";}
    else if(mode=="resources"){for(const bool result:{resourceFits(1,17),resourceFits(256,272),resourceFits(256,271),resourceFits(257,9999),resourceFits(0,9999)})std::cout<<"{\"fits\":"<<(result?"true":"false")<<"}\n";}
    else if(mode=="delivery"){for(const bool result:{deliveryValid(-4,0x61,0),deliveryValid(-4,0x20,0),deliveryValid(-4,0,0),deliveryValid(-4,0x60,0),deliveryValid(-4,0x41,0),deliveryValid(-4,0x21,0),deliveryValid(-4,0x4061,0),deliveryValid(-4,0x8061,0),deliveryValid(-4,0x63,0),deliveryValid(-4,0x261,0),deliveryValid(-3,0x61,0),deliveryValid(-4,0x61,1)})std::cout<<"{\"valid\":"<<(result?"true":"false")<<"}\n";}
    else if(mode=="drain-limits"){for(const bool result:{drainFits(0,std::chrono::milliseconds(0)),drainFits(4095,std::chrono::milliseconds(49)),drainFits(4096,std::chrono::milliseconds(0)),drainFits(0,std::chrono::milliseconds(50))})std::cout<<"{\"fits\":"<<(result?"true":"false")<<"}\n";}
    else if(mode=="events"||mode=="latch"||mode=="serial"){
      Collector collector({{0,1,2,0100644,"/private/tmp/file"},{3,1,3,0040755,"/private/tmp/directory"}});
      if(mode=="events"){for(uint32_t flag=1;flag<=64;flag<<=1)collector.event(0,flag,false);collector.event(3,2|8,false);collector.boundary("barrier",1);collector.boundary("barrier",2);}
      if(mode=="latch"){collector.event(0,128,false);collector.event(0,2,false);collector.event(256,2,false);collector.event(3,2,true);collector.boundary("barrier",1);collector.boundary("closed",2);}
      if(mode=="serial"){collector.serial=safeInteger;collector.event(0,2,false);collector.boundary("barrier",1);}}
    else throw std::runtime_error("PROTOCOL");return 0;
  }catch(const std::exception&){std::cout<<"{\"code\":\"PROTOCOL\"}\n";return 64;}
}
