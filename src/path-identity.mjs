import path from 'node:path';
import fs from 'node:fs';

// Windows callers may supply an 8.3 spelling while filesystem APIs and
// TypeScript report the long name. Canonicalize existing paths at observation
// boundaries; keep logical link paths separately for invalidation.
export function realObservedPath(value) {
  return process.platform==='win32'?fs.realpathSync.native(value):fs.realpathSync(value);
}

// Use the host path implementation in production. Passing path.win32 makes
// the identity rules testable elsewhere; those tests are not NTFS acceptance.
export function normalizedPath(value,paths=path) {
  const resolved=paths.resolve(value);
  if(paths!==path.win32)return resolved;
  if(/^\\\\\?\\UNC\\/i.test(resolved))return '\\\\'+resolved.slice(8);
  if(/^\\\\\?\\[A-Za-z]:\\/.test(resolved))return resolved.slice(4);
  return resolved;
}

export function samePath(left,right,paths=path) {
  return paths.relative(normalizedPath(left,paths),normalizedPath(right,paths))==='';
}

export function withinPath(file,root,paths=path) {
  const relative=paths.relative(normalizedPath(root,paths),normalizedPath(file,paths));
  return relative===''||(!paths.isAbsolute(relative)&&relative!=='..'&&
    !relative.startsWith('..'+paths.sep));
}

export function observedRelative(root,file,paths=path) {
  if(!withinPath(file,root,paths))return null;
  return paths.relative(normalizedPath(root,paths),normalizedPath(file,paths))
    .split(paths.sep).join('/');
}

export function validInputRelative(rel,platform=process.platform) {
  if(typeof rel!=='string'||!rel||path.posix.isAbsolute(rel)||
    rel.split('/').includes('..'))return false;
  if(platform==='win32'&&(path.win32.isAbsolute(rel)||/^[A-Za-z]:/.test(rel)||
    rel.includes('\\')))return false;
  return true;
}
