// Public registry metadata only; publisher authentication is a separate release gate.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

export const registryUrl=name=>`https://registry.npmjs.org/${encodeURIComponent(name)}`;
const repositoryIdentity=url=>String(url||'').replace(/^git\+/, '').replace(/\.git$/, '').replace(/\/$/, '');
export async function checkRegistry(pkg,{publisher='msiric',fetchImpl=fetch}={}) {
  const registry=registryUrl(pkg.name);
  try {
    const response=await fetchImpl(registry,{signal:AbortSignal.timeout(20000),headers:{accept:'application/json'}});
    if(response.status===404)return {state:'absent',name:pkg.name,registry,http:404};
    if(!response.ok)return {state:'unavailable',name:pkg.name,registry,http:response.status};
    const value=await response.json();
    const ours=value.name===pkg.name && value.maintainers?.some(m=>m.name===publisher) &&
      repositoryIdentity(value.repository?.url)===repositoryIdentity(pkg.repository?.url);
    return {state:ours?'owned':'unexpected',name:pkg.name,registry,http:response.status,
      publisher,versionPresent:!!value.versions?.[pkg.version],distTags:value['dist-tags']||{}};
  }catch(error){return {state:'unavailable',name:pkg.name,registry,reason:error.code||error.name};}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const pkg=JSON.parse(fs.readFileSync(new URL('../../package.json',import.meta.url),'utf8'));
  const result=await checkRegistry(pkg);
  console.log(JSON.stringify(result));
  if(!['absent','owned'].includes(result.state))process.exitCode=1;
}
