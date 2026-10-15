// Fixed CI preparation diagnostics only. No authority, environment selectors,
// arbitrary paths, command dispatch, extra descriptor, storage or timing reuse.
import {writeSync} from 'node:fs';
const groups=Object.freeze(['prerequisite','launcher_dependencies','launcher_source','launcher_copies','launcher_tool','launcher_compile','enclosure_source','enclosure_tool','enclosure_rows','enclosure_compile','original_projection']);
const stages=new Set(['NONE','PAIR','HOST','ROOTS','HOST_BUILD','BOUNDARY','BASE_SOURCE','BASE_COMPILE','BASE_OUTPUT','NATIVE_FIXTURE','NATIVE_RUNTIME_SHAPE','NATIVE_RUNTIME_BYTES','NATIVE_PROPOSAL','NATIVE_COMPILER_BYTES','NATIVE_LINKER_BYTES','NATIVE_CI_TOOL_SIZES','NATIVE_SDK','NATIVE_HEADERS','NATIVE_NAMESPACE','NATIVE_COPY','NATIVE_SOURCES','NATIVE_BUILD_PRECONDITION','NATIVE_COMPILE','NATIVE_OUTPUT','NATIVE_FINAL','LAUNCHER','ENCLOSURE']);
const tokens=new WeakMap();let active=null;
function tick(record){let n;try{n=performance.now();}catch{record.state='CLOCK_UNKNOWN';return null;}if(record.state==='CLOCK_UNKNOWN'||!Number.isFinite(record.began)||!Number.isFinite(record.last)||!Number.isFinite(n)||n<record.last||n-record.began>=65000){record.state='CLOCK_UNKNOWN';return null;}record.last=n;return n;}
function snapshot(record,final=false){
 if(record.sequence>=(final?9:8))return;
 const n=tick(record);if(!final&&n!==null&&record.sequence>0&&n-record.lastEmission<7000)return;
 const frame={schema:1,protocol:'fixed-enclosure-progress@2',kind:'COST',sequence:record.sequence++,elapsedMs:n===null?null:Math.round((n-record.began)*1000)/1000,state:record.state,guardStage:record.refusal??record.stage,refusal:record.refusal!==null,rows:record.rows.map((r,id)=>[id,r.entered,r.returned,r.failed,r.elapsed,r.active]),meaning:'INCLUSIVE_COMPLETED_CALLS_NOT_SUMMABLE_NOT_PROCESS_COUNTS'};
 const bytes=Buffer.from(JSON.stringify(frame)+'\n');if(bytes.length>768){record.state='CAPTURE_FAILED';return;}
 try{let at=0;while(at<bytes.length){const count=writeSync(1,bytes,at,bytes.length-at);if(!Number.isInteger(count)||count<1||count>bytes.length-at)throw Error('COST_WRITE');at+=count;}if(n!==null)record.lastEmission=n;}catch{record.state='CAPTURE_FAILED';}
}
export function startFixedCIPreparationCostCapture(){
 if(arguments.length!==0||active!==null)throw Error('FIXED_COST_CAPTURE_UNAVAILABLE');
 let n;try{n=performance.now();}catch{n=NaN;}const context=Object.freeze(Object.create(null));active={context,began:n,last:n,lastEmission:n,sequence:0,state:Number.isFinite(n)&&n>=0?'OBSERVED':'CLOCK_UNKNOWN',stage:'NONE',refusal:null,rows:groups.map(()=>({entered:0,returned:0,failed:0,elapsed:0,active:0}))};snapshot(active);return context;
}
export function beginFixedCIPreparationCost(group){
 if(active===null)return null;const id=groups.indexOf(group);if(arguments.length!==1||id<0){active.state='CAPTURE_FAILED';return null;}
 const row=active.rows[id],began=tick(active);if(row.entered>=9999||row.active>=64){active.state='SATURATED';return null;}
 row.entered++;row.active++;const token=Object.freeze(Object.create(null));tokens.set(token,{record:active,id,began});snapshot(active);return token;
}
export function endFixedCIPreparationCost(token,failed=false){
 if(token===null||active===null)return;const original=tokens.get(token);tokens.delete(token);
 if(arguments.length>2||typeof failed!=='boolean'||!original||original.record!==active){active.state='CAPTURE_FAILED';return;}
 const row=active.rows[original.id],n=tick(active);row.active--;if(failed)row.failed++;else row.returned++;
 if(n===null||original.began===null||row.elapsed===null)row.elapsed=null;else{const elapsed=row.elapsed+n-original.began;row.elapsed=Number.isFinite(elapsed)&&elapsed<=60000000?Math.round(elapsed*1000)/1000:null;if(row.elapsed===null)active.state='SATURATED';}
 snapshot(active);
}
export function fixedCIPreparationGuardStage(stage){if(active===null)return;if(arguments.length!==1||typeof stage!=='string'||!stages.has(stage)){active.state='CAPTURE_FAILED';return;}active.stage=stage;snapshot(active);}
export function fixedCIPreparationRefusal(){if(active===null)return;if(arguments.length!==0){active.state='CAPTURE_FAILED';return;}active.refusal??=active.stage;snapshot(active);}
export function finishFixedCIPreparationCostCapture(context){if(active===null)return;if(arguments.length!==1||context!==active.context){active.state='CAPTURE_FAILED';return;}snapshot(active,true);active=null;}
