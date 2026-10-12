// Storage-free profile inventory. This is not portable eligibility or model
// acceptance. Print only selected public runner/runtime facts, never an env dump.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {directCompiler,directEnvironmentIssue} from '../../src/direct-typescript.mjs';
import {portableRuntimeSupported,portableRuntime} from '../../src/portable-runtime.mjs';

const role=process.argv[2];
assert(['producer','receiver','development'].includes(role),'Select an explicit preflight role');
assert.equal(process.platform,'darwin','The approved initial preflight is macOS');
assert.equal(process.arch,'arm64','The approved initial preflight is ARM64');
const root=fs.realpathSync(fileURLToPath(new URL('../..',import.meta.url))),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function command(file,args,input){
  const result=spawnSync(file,args,{cwd:root,input,encoding:'utf8',timeout:5000,maxBuffer:1024*1024,stdio:['pipe','pipe','pipe']});
  assert.equal(result.status,0,`Required read-only preflight failed: ${path.basename(file)} (${result.error?.code??result.status})`);
  return result.stdout.trim();
}
const device=command('/bin/df',['-P',root]).split('\n').at(-1).trim().split(/\s+/)[0];
assert.match(device,/^\/dev\/disk\d+(?:s\d+)*$/,'Unrecognized checkout volume; do not infer filesystem compatibility');
const volume=JSON.parse(command('/usr/bin/plutil',['-convert','json','-o','-','-'],command('/usr/sbin/diskutil',['info','-plist',device])));
const compiler=directCompiler(root),nodeSha256=sha(fs.readFileSync(fs.realpathSync(process.execPath)));
const helper=fileURLToPath(new URL('../../src/portable-runtime-darwin-arm64.node',import.meta.url));
assert.equal(sha(fs.readFileSync(helper)),'d16b6f14ed089c795bf763743a0212b9f4ee4dc2310c39a3231e038dc137dff3','Reviewed native helper bytes differ');
const native=createRequire(import.meta.url)(helper),cache=native.inspect();
const loaded=process.report.getReport().sharedObjects;
const virtual=loaded.filter(file=>!fs.existsSync(file));
assert(virtual.every(file=>native.contains(file)),'Unknown loaded runtime image');
const version=command(process.execPath,[path.join(root,'bin/redue.mjs'),'--version']);
command(process.execPath,[path.join(root,'bin/redue.mjs'),'--help']);
let prototype={supported:portableRuntimeSupported(),reason:null};
try{if(prototype.supported)prototype={...prototype,runtime:portableRuntime()};}
catch(error){prototype={supported:false,reason:/^PORTABLE_[A-Z_]+$/.test(error.code??'')?error.code:'PORTABLE_RUNTIME_UNSUPPORTED'};}
const label=key=>typeof process.env[key]==='string'&&/^[a-zA-Z0-9_.-]{1,100}$/.test(process.env[key])?process.env[key]:null;
const report={schema:1,role,scope:'storage-free host preflight; no evidence transfer or agent/model acceptance',
  runner:{imageOS:label('ImageOS'),imageVersion:label('ImageVersion'),environment:label('RUNNER_ENVIRONMENT')},
  system:{os:process.platform,arch:process.arch,release:os.release(),version:command('/usr/bin/sw_vers',['-productVersion']),build:command('/usr/bin/sw_vers',['-buildVersion']),
    filesystem:volume.FilesystemType??null,writable:volume.Writable??null},
  node:{version:process.version,sha256:nodeSha256},npm:{version:command('npm',['--version'])},
  compiler:{version:compiler.version,packageSha256:compiler.digest},redue:{metadataVersion:version},
  runtime:{cacheUUID:cache.uuid,overridden:cache.overridden,interposed:cache.interposed,readableImages:loaded.length-virtual.length,verifiedVirtualImages:virtual.length},
  relevantEnvironment:{issue:directEnvironmentIssue(),presentKeys:Object.keys(process.env).filter(key=>/^(?:NODE_|DYLD_|LD_|TS_ETW_|VSCODE_INSPECTOR_OPTIONS$)/i.test(key)).sort()},
  prototype,eligibilityEstablished:false};
console.log(JSON.stringify(report,null,2));
