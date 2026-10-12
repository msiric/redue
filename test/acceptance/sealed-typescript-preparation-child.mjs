// Fixed test/acceptance preparation child. No command, compiler or shell runner.
// Its parent must supply the separately reviewed filesystem boundary/deadline.
import {materializeSealedTypeScriptTree,TYPESCRIPT_TREE_LIMITS} from '../../src/sealed-typescript-tree.mjs';
import {fileURLToPath} from 'node:url';

export const PREPARATION_BYTES=8*1024*1024;
const knownCodes=new Set(['TREE_PLATFORM','TREE_PATH','TREE_CHANGED','TREE_OPTIONS','TREE_MANIFEST','TREE_FILE','TREE_LIMIT','TREE_DIGEST','TREE_SYMLINK','TREE_PLACEMENT','TREE_OWNERSHIP','TREE_PARENT_OCCUPIED','TREE_UNAVAILABLE',
  'PREPARATION_ARGUMENTS','PREPARATION_INPUT','PREPARATION_INPUT_SIZE','PREPARATION_SCHEMA','PREPARATION_OUTPUT','PREPARATION_FAILED']);
const fail=code=>{throw Object.assign(Error(code),{code});};
const safeCode=error=>knownCodes.has(error?.code)?error.code:'PREPARATION_FAILED';

// A deliberately narrow JSON grammar: one object with three distinct known
// fields, string roots and a manifest of string pairs. No generic object parser,
// reviver, getters, executable values or duplicate-key last-writer behavior.
export function parsePreparationInput(bytes){
  if(!(bytes instanceof Uint8Array)||bytes.byteLength>PREPARATION_BYTES)fail('PREPARATION_INPUT_SIZE');
  let source;try{source=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}catch{fail('PREPARATION_INPUT');}
  let cursor=0;const white=()=>{while(/[\x20\t\n\r]/.test(source[cursor]??'\0'))cursor++;};
  const require=character=>{white();if(source[cursor++]!==character)fail('PREPARATION_SCHEMA');};
  const string=(limit=TYPESCRIPT_TREE_LIMITS.pathBytes)=>{white();if(source[cursor]!=='"')fail('PREPARATION_SCHEMA');const start=cursor++;
    while(cursor<source.length){const code=source.charCodeAt(cursor++);if(cursor-start>limit*6+2)fail('PREPARATION_SCHEMA');
      if(code===34){let value;try{value=JSON.parse(source.slice(start,cursor));}catch{fail('PREPARATION_SCHEMA');}
        if(Buffer.byteLength(value)>limit||Buffer.from(value).toString('utf8')!==value)fail('PREPARATION_SCHEMA');return value;}
      if(code<32)fail('PREPARATION_SCHEMA');if(code===92){const escape=source[cursor++];if(escape==='u'){
          if(!/^[a-fA-F0-9]{4}$/.test(source.slice(cursor,cursor+4)))fail('PREPARATION_SCHEMA');cursor+=4;
        }else if(!'"\\/bfnrt'.includes(escape??'\0'))fail('PREPARATION_SCHEMA');}}
    fail('PREPARATION_SCHEMA');};
  const manifest=()=>{require('[');white();const rows=[];if(source[cursor]===']'){cursor++;return rows;}
    for(;;){if(rows.length>=TYPESCRIPT_TREE_LIMITS.files)fail('PREPARATION_SCHEMA');require('[');const rel=string();require(',');const digest=string(64);require(']');rows.push([rel,digest]);white();
      if(source[cursor]===']'){cursor++;return rows;}require(',');}};
  require('{');const result=Object.create(null),seen=new Set();
  for(;;){const key=string(16);if(!['root','manifest','parent'].includes(key)||seen.has(key))fail('PREPARATION_SCHEMA');seen.add(key);require(':');
    result[key]=key==='manifest'?manifest():string();white();if(source[cursor]==='}'){cursor++;break;}require(',');}
  white();if(cursor!==source.length||seen.size!==3)fail('PREPARATION_SCHEMA');return result;
}
export async function consumePreparationInput(input){
  const buffer=Buffer.alloc(PREPARATION_BYTES);let length=0;
  try{for await(const chunk of input){if(!(chunk instanceof Uint8Array))fail('PREPARATION_INPUT');if(chunk.byteLength>buffer.length-length)fail('PREPARATION_INPUT_SIZE');buffer.set(chunk,length);length+=chunk.byteLength;}}
  catch(error){if(knownCodes.has(error?.code))throw error;fail('PREPARATION_INPUT');}
  // No parse or filesystem work until the stream completed, including EOF.
  return buffer.subarray(0,length);
}
async function main(){let response,failed=false;
  try{if(process.argv.length!==2)fail('PREPARATION_ARGUMENTS');const bytes=await consumePreparationInput(process.stdin);
    const options=parsePreparationInput(bytes),materialization=materializeSealedTypeScriptTree(options);
    response=JSON.stringify({schema:1,ok:true,materialization});if(Buffer.byteLength(response)>PREPARATION_BYTES)fail('PREPARATION_OUTPUT');
  }catch(error){failed=true;response=JSON.stringify({schema:1,ok:false,reason_code:safeCode(error)});}
  process.exitCode=failed?74:0;process.stdout.on('error',()=>{});
  try{await new Promise((resolve,reject)=>process.stdout.write(response+'\n',error=>error?reject(error):resolve()));}catch{process.exitCode=74;}
}
if(process.argv[1]===fileURLToPath(import.meta.url))await main();
