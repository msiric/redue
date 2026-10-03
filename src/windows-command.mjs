import path from 'node:path';

// Windows cannot CreateProcess a .cmd/.bat file directly. Keep the logical
// argv in the receipt, and launch only the well-defined, quoted batch subset
// through cmd.exe. Unrepresentable arguments fail instead of being altered.
export function windowsLaunch(command,{platform=process.platform,
  comspec=process.env.ComSpec||process.env.COMSPEC||'C:\\Windows\\System32\\cmd.exe'}={}) {
  if(platform!=='win32')return {file:command[0],args:command.slice(1),options:{}};
  if(!/\.(?:cmd|bat)$/i.test(path.win32.extname(command[0])))
    return {file:command[0],args:command.slice(1),options:{}};
  if(command.some(value=>/[\r\n"%!^&|<>]/.test(value)))
    throw Error('Windows batch command contains characters that cannot be passed safely; use an executable or Node script as exact argv');
  const line='"'+command.map(value=>'"'+value+'"').join(' ')+'"';
  return {file:comspec,args:['/d','/s','/c',line],
    options:{windowsVerbatimArguments:true,windowsHide:false},mechanism:'cmd-batch'};
}
