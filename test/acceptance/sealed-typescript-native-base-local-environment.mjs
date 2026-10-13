// Local copy-free native-parent preparation only. No auth, native, model or
// filesystem operation at import; no prepared environment is execution authority.
// The approved credential namespace is retained in place, never copied into H.
import {createHash} from 'node:crypto';
import {verifySealedTypeScriptBaseCollectorCopies} from './sealed-typescript-base-collector-copies.mjs';

const namespace='/private/tmp/redue-claude-noauth-ckwXOM/claude-config';
const preserved=['HOME','USER','LOGNAME','TMPDIR','PATH','SHELL','LANG','LC_ALL','LC_CTYPE','TERM',
  'HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','NO_PROXY','http_proxy','https_proxy','all_proxy','no_proxy'];
const forbidden=new Set(['BASH_ENV','ENV','NODE_OPTIONS','NODE_PATH','NODE_REPL_EXTERNAL_MODULE',
  'ANTHROPIC_API_KEY','ANTHROPIC_AUTH_TOKEN','ANTHROPIC_BASE_URL','ANTHROPIC_CUSTOM_HEADERS','ANTHROPIC_PROFILE',
  'GITHUB_TOKEN','GH_TOKEN','NPM_TOKEN']);
const allowedClaude=new Set(['CLAUDE_SECURESTORAGE_CONFIG_DIR']);
const minted=new WeakMap();
const fail=()=>{throw Object.assign(Error('LOCAL_NATIVE_ENVIRONMENT_UNAVAILABLE'),{code:'LOCAL_NATIVE_ENVIRONMENT_UNAVAILABLE'});};
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function snapshot(){
  const env=process.env;
  for(const key of Object.keys(env))if(forbidden.has(key.toUpperCase())||/^(?:DYLD_|LD_|OPENSSL_|ACTIONS_)/i.test(key)||
    /^(?:ANTHROPIC_|CLAUDE_)/i.test(key)&&!allowedClaude.has(key))fail();
  if(Object.hasOwn(env,'CLAUDE_SECURESTORAGE_CONFIG_DIR')&&env.CLAUDE_SECURESTORAGE_CONFIG_DIR!==namespace)fail();
  if(typeof env.HOME!=='string'||!/^\/Users\/[^/\x00-\x1f\x7f]+$/.test(env.HOME)||
    typeof env.USER!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(env.USER)||
    env.HOME!=='/Users/'+env.USER||Object.hasOwn(env,'LOGNAME')&&env.LOGNAME!==env.USER||
    typeof env.PATH!=='string'||env.PATH.length===0||Buffer.byteLength(env.PATH)>16384)fail();
  const selected={};for(const key of preserved)if(Object.hasOwn(env,key)){
    const value=env[key];if(typeof value!=='string'||Buffer.byteLength(value)>16384||value.includes('\0')||Buffer.from(value).toString('utf8')!==value)fail();selected[key]=value;
  }
  return selected;
}
// One real process environment, not caller-supplied/daemon/imported substitutes.
export function prepareSealedTypeScriptLocalNativeEnvironment(copies){
  if(arguments.length!==1)fail();
  const first=verifySealedTypeScriptBaseCollectorCopies(copies);
  if(first.outcome!=='COLLECTOR_COPIES_CURRENTLY_OBSERVED_NOT_EXECUTED')fail();
  const inherited=snapshot(),h=first.hostBase;
  if(!/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(h)||
    new Set([h,first.baseA,first.baseB]).size!==3||namespace.startsWith(h+'/'))fail();
  const environment={...inherited,CLAUDE_CONFIG_DIR:h+'/claude-host/claude-config',
    GH_CONFIG_DIR:h+'/claude-host/gh-config',CLAUDE_SECURESTORAGE_CONFIG_DIR:namespace,DISABLE_UPDATES:'1'};
  // Comparison is private; neither inherited values nor their per-key digests
  // are published. This is not a context-equivalence or compiler recipe rule.
  const fingerprint=createHash('sha256').update(JSON.stringify(inherited)).digest('hex');
  if(!equal(first,verifySealedTypeScriptBaseCollectorCopies(copies))||!equal(inherited,snapshot()))fail();
  const proposal=Object.freeze({schema:1,scope:'DISABLED_LOCAL_NATIVE_PARENT_ENVIRONMENT_ONLY',
    hostBase:h,fields:Object.freeze(Object.keys(environment)),
    additionalDenyRead:Object.freeze([namespace]),additionalDenyWrite:Object.freeze([namespace]),
    authentication:'NOT_VERIFIED',includedCapacity:'NOT_VERIFIED_BY_ENVIRONMENT',
    startupPolicy:'NOT_VERIFIED',credentialBodiesRead:false,credentialCopies:0,
    commands:Object.freeze([]),nativeLaunches:0,models:0,disabled:true,inferencePermitted:false,
    sealed:false,reuseEligible:false});
  minted.set(proposal,{copies,first,fingerprint});return proposal;
}
// Read-only private currency check. No getter exposes the parent environment;
// a reviewed future dispatcher must independently reconstruct it at launch.
export function verifySealedTypeScriptLocalNativeEnvironment(proposal){
  const record=minted.get(proposal),unknown=()=>Object.freeze({scope:'LOCAL_NATIVE_ENVIRONMENT_CURRENCY_ONLY',outcome:'UNKNOWN',sealed:false,reuseEligible:false});
  if(!record||record.invalid)return unknown();
  try{if(!equal(record.first,verifySealedTypeScriptBaseCollectorCopies(record.copies))||
    createHash('sha256').update(JSON.stringify(snapshot())).digest('hex')!==record.fingerprint)fail();
    return Object.freeze({scope:'LOCAL_NATIVE_ENVIRONMENT_CURRENCY_ONLY',outcome:'OBSERVED_NOT_AUTHENTICATED_OR_EXECUTABLE',hostBase:proposal.hostBase,sealed:false,reuseEligible:false});
  }catch{record.invalid=true;return unknown();}
}
