import path from 'node:path';

export function userStateBase(platform=process.platform,env=process.env,
  home=process.env.HOME||'',paths=path) {
  if(platform==='win32')return paths.isAbsolute(env.LOCALAPPDATA||'')?
    env.LOCALAPPDATA:paths.join(home,'AppData','Local');
  if(platform==='linux')return paths.isAbsolute(env.XDG_STATE_HOME||'')?
    env.XDG_STATE_HOME:paths.join(home,'.local','state');
  return paths.join(home,'Library','Application Support');
}

export function stateIdentity(value,platform=process.platform) {
  return platform==='win32'?path.win32.normalize(value).toLowerCase():value;
}
