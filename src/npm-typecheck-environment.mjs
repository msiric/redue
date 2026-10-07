// Admission for the standalone npm 10.9.2 -> tsc --noEmit contract only.
// Values are never returned: the caller separately fingerprints every original
// npm_config_* key/value (including case and empty values).
import path from 'node:path';
export const npmEnvironmentInterpretation = 'npm-tsc-environment@2';
const proxyKeys = new Set(['proxy', 'https_proxy', 'http_proxy', 'noproxy']);
export function npmTypecheckEnvironmentIssue(env, {npmVersion, platform = process.platform} = {}) {
  if (env.NODE_OPTIONS || env.NODE_PATH || env.BASH_ENV || env.ENV)
    return 'execution-environment-unsupported';
  const seen = new Map();
  for (const [key, value] of Object.entries(env)) {
    if (/^(DYLD_|TSGO_)/i.test(key)) return 'execution-environment-unsupported';
    if (!/^npm_config_/i.test(key)) continue;
    if (/^npm_config_prefix$/i.test(key) && platform === 'win32' && path.win32.isAbsolute(value)) continue;
    const suffix = key.slice('npm_config_'.length).toLowerCase();
    if (!proxyKeys.has(suffix)) return 'execution-environment-unsupported';
    // http_proxy is an unknown, inert pass-through key in this inspected npm
    // version, not an alias for proxy. Other npm versions require source review.
    if (npmVersion !== '10.9.2') return 'npm-proxy-version-unsupported';
    if (seen.has(suffix) && seen.get(suffix) !== value)
      return 'npm-proxy-context-ambiguous';
    seen.set(suffix, value);
    if (typeof value !== 'string' || /[\x00-\x1f\x7f]/.test(value))
      return 'npm-proxy-value-unsupported';
    // npm ignores empty environment config, but passes the original environment
    // to the child. Empty and absent remain distinct caller identities.
    if (value === '' || (suffix === 'proxy' && value === 'false')) continue;
    if (suffix === 'noproxy') continue;
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol) || !url.hostname)
        return 'npm-proxy-value-unsupported';
    } catch { return 'npm-proxy-value-unsupported'; }
  }
  return null;
}
