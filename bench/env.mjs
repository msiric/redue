// The direct-TypeScript recipe refuses most NODE_* / DYLD_* / LD_* overrides.
// Strip them for REDUE and compiler processes so the benchmark measures the
// supported path. Reports what it removed so results stay honest.
const blocked = /^(NODE_(?!ENV$)|DYLD_|LD_|TSGO_|TSC_|TS_ETW_)/i;

export function cleanEnv(extra = {}) {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) if (!blocked.test(key)) env[key] = value;
  return {...env, ...extra};
}

export function strippedKeys() {
  return Object.keys(process.env).filter(key => blocked.test(key)).sort();
}
