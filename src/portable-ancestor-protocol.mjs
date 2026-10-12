// Fixed raw-FSEvents worker protocol, not an observation authority or transport
// for imported evidence. Only the locally spawned, reviewed helper may supply it.
import {parsePortableJson} from './portable-envelope.mjs';
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const integer=n=>Number.isSafeInteger(n)&&n>=0;
export function ancestorInitialization(scopes){
 if(!Array.isArray(scopes)||scopes.length<1||scopes.length>8192)throw Error('ANCESTOR_PROTOCOL');
 const paths=new Set(),rows=[Buffer.from('INIT '+scopes.length+'\n')];
 for(const [id,scope] of scopes.entries()){
  const p=scope.candidate;
  if(typeof scope.descendants!=='boolean')throw Error('ANCESTOR_PROTOCOL');
  if(typeof p!=='string'||p.length>4096||!/^\/[\x20-\x7e]+$/.test(p)||/[\\:\r\n\t]/.test(p)||p.endsWith('/')||p.includes('//')||p.split('/').some(part=>part==='.'||part==='..')||paths.has(p))throw Error('ANCESTOR_PROTOCOL');
  paths.add(p);const bytes=Buffer.from(p,'utf8');rows.push(Buffer.from(id+' '+bytes.length+' '+(scope.descendants?'1':'0')+'\n'),bytes,Buffer.from('\n'));
 }
 const bytes=Buffer.concat(rows);if(bytes.length>8*1024*1024)throw Error('ANCESTOR_PROTOCOL');return bytes;
}
export class AncestorProtocol {
 constructor(scopes){if(!Number.isInteger(scopes)||scopes<1||scopes>8192)throw Error('ANCESTOR_PROTOCOL');this.scopes=scopes;this.serial=0;this.ready=false;this.uncertain=false;this.closed=false;}
 accept(line,{request=null,closing=false}={}){
  try{
   if(this.uncertain||this.closed||typeof line!=='string'||Buffer.byteLength(line)>65536)throw Error('ANCESTOR_PROTOCOL');
   const row=parsePortableJson(line);if(row.schema!==1)throw Error('ANCESTOR_PROTOCOL');
   if(row.type==='uncertainty'){
    if(!exact(row,['schema','type','code','serial'])||!integer(row.serial)||row.serial<this.serial||
     !['PROTOCOL','FSEVENTS_START','FSEVENTS_GAP','FSEVENTS_FLAGS','FSEVENTS_ID','FSEVENTS_PATH','FSEVENTS_SERIAL','FSEVENTS_BATCH'].includes(row.code))throw Error('ANCESTOR_PROTOCOL');
    this.uncertain=true;this.serial=row.serial;return {type:'uncertainty',serial:row.serial};
   }
   if(row.type==='occurrence'){
    if(!exact(row,['schema','type','scopeIds','serial'])||!integer(row.serial)||row.serial!==this.serial+1||
     !Array.isArray(row.scopeIds)||!row.scopeIds.length||row.scopeIds.length>this.scopes||
     row.scopeIds.some((n,i)=>!integer(n)||n>=this.scopes||i>0&&n<=row.scopeIds[i-1]))throw Error('ANCESTOR_PROTOCOL');
    this.serial=row.serial;return {type:'occurrence',serial:row.serial,scopeIds:row.scopeIds};
   }
   if(!exact(row,['schema','type','request','serial','uncertain'])||!integer(row.serial)||row.serial!==this.serial||row.uncertain!==false)throw Error('ANCESTOR_PROTOCOL');
   if(row.type==='ready'){
    if(this.ready||row.request!==0||request!==null||closing)throw Error('ANCESTOR_PROTOCOL');this.ready=true;
   }else if(row.type==='barrier'||row.type==='closed'){
    if(!this.ready||request===null||!integer(request)||request===0||row.request!==request||closing!==(row.type==='closed'))throw Error('ANCESTOR_PROTOCOL');
    if(closing)this.closed=true;
   }else throw Error('ANCESTOR_PROTOCOL');
   return {type:row.type,serial:row.serial};
  }catch{this.uncertain=true;throw Error('ANCESTOR_PROTOCOL');}
 }
}
