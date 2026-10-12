// Pure topology restriction for this explicit materialization only. No path is
// admitted for filesystem access by this function; callers validate every inode.
import {posix as path} from 'node:path';
const fail=()=>{throw Object.assign(Error('TREE_SYMLINK'),{code:'TREE_SYMLINK'});};
const text=value=>typeof value==='string'&&value.length>0&&Buffer.byteLength(value)<=4096&&
  Buffer.from(value).toString('utf8')===value&&!/[\u0000-\u001f\u007f\\:]/u.test(value);
export function sealedNpmShimTarget(root,rel,target){
  if(!text(root)||!root.startsWith('/')||path.normalize(root)!==root||root==='/'||
    !text(rel)||!text(target))fail();
  const parts=rel.split('/'),tail=target.split('/');
  if(parts[0]!=='node_modules'||parts.length<3||parts.at(-3)!=='node_modules'||parts.at(-2)!=='.bin'||
    parts.some(part=>!part||part==='.'||part==='..')||tail.length<3||tail[0]!=='..'||
    tail.slice(1).some(part=>!part||part==='.'||part==='..'))fail();
  const container=path.join(root,...parts.slice(0,-2)),physical=path.resolve(container,'.bin',target),
    relative=path.relative(root,physical);
  if(!physical.startsWith(container+'/')||!physical.startsWith(root+'/'))fail();
  return Object.freeze({physical,relative});
}
