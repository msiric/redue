// The direct-TypeScript recipe refuses NODE_* / DYLD_* / LD_* values it cannot
// classify. Strip exactly those for REDUE and compiler processes so the
// benchmark measures the supported path. Reports what it removed so results
// stay honest.
import {directVariableIssue} from '../src/direct-typescript.mjs';

const blocked = key => directVariableIssue(key, process.env[key]) !== null;

export function cleanEnv(extra = {}) {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) if (!blocked(key)) env[key] = value;
  return {...env, ...extra};
}

export function strippedKeys() {
  return Object.keys(process.env).filter(blocked).sort();
}

// Accepted Node settings still change heap and GC behavior; name them so
// BENCH_RESULT numbers from different shells can be compared.
export function keptNodeKeys() {
  return Object.keys(process.env).filter(key => /^NODE_/i.test(key) && !blocked(key)).sort();
}
