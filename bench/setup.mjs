#!/usr/bin/env node
// Create a synthetic single-package npm TypeScript project that qualifies for
// REDUE's direct-TypeScript recipe, install it, commit it, and run `redue init`.
//
//   node bench/setup.mjs <dir> [modules=800]
//
// Needs network access for `npm install` (typescript 5.9.3, @types/node).
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {cleanEnv} from './env.mjs';

const [dirArg, countArg] = process.argv.slice(2);
if (!dirArg) { console.error('usage: node bench/setup.mjs <dir> [modules]'); process.exit(2); }
const dir = path.resolve(dirArg);
const count = Number(countArg || 800);
const redue = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../bin/redue.mjs');
if (fs.existsSync(dir) && fs.readdirSync(dir).length) {
  console.error(`${dir} is not empty; choose a new directory`); process.exit(2);
}
fs.mkdirSync(path.join(dir, 'src'), {recursive: true});
fs.mkdirSync(path.join(dir, 'docs'), {recursive: true});

fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
  name: 'redue-bench', version: '1.0.0', private: true, type: 'module',
  scripts: {typecheck: 'tsc --noEmit'},
  devDependencies: {typescript: '5.9.3', '@types/node': '22.10.2'},
}, null, 2) + '\n');
fs.writeFileSync(path.join(dir, 'tsconfig.json'), JSON.stringify({
  compilerOptions: {target: 'ES2022', module: 'NodeNext', moduleResolution: 'NodeNext',
    strict: true, skipLibCheck: false, types: ['node']},
  include: ['src'],
}, null, 2) + '\n');
fs.writeFileSync(path.join(dir, 'docs', 'notes.md'), '# Notes\n');
fs.writeFileSync(path.join(dir, '.gitignore'), 'node_modules\n');

for (let i = 0; i < count; i++) {
  const deps = [i - 1, i - 7, i - 31].filter(d => d >= 0);
  const imports = deps.map(d => `import {Service${d}, make${d}} from './m${d}.js';`).join('\n');
  const methods = Array.from({length: 12}, (_, k) => `  method${k}(input: Record<string, number>): Array<{key: string; value: number}> {
    return Object.entries(input).filter(([, v]) => v > ${k}).map(([key, value]) => ({key, value: value * ${k + 1}}));
  }`).join('\n');
  const fields = deps.map(d => `  readonly dep${d}: Service${d} = make${d}();`).join('\n');
  fs.writeFileSync(path.join(dir, 'src', `m${i}.ts`), `${imports}
import {createHash} from 'node:crypto';

export interface Shape${i}<T extends string = string> {
  id: T;
  weight: number;
  tags: ReadonlyArray<T>;
}

export type Mapped${i} = {[K in keyof Shape${i}]: Shape${i}[K] | null};

export class Service${i} {
${fields}
${methods}
  digest(value: string): string {
    return createHash('sha256').update(value + ${i}).digest('hex');
  }
}

export function make${i}(): Service${i} {
  return new Service${i}();
}
`);
}
fs.writeFileSync(path.join(dir, 'src', 'index.ts'),
  Array.from({length: count}, (_, i) => `export * as m${i} from './m${i}.js';`).join('\n') + '\n');

const run = (cmd, args, env = process.env) =>
  execFileSync(cmd, args, {cwd: dir, stdio: 'inherit', env, shell: process.platform === 'win32'});
run('npm', ['install', '--no-audit', '--no-fund']);
run('git', ['init', '-q']);
run('git', ['add', '-A']);
run('git', ['-c', 'user.email=bench@example.invalid', '-c', 'user.name=bench', 'commit', '-qm', 'bench fixture']);
run(process.execPath, [redue, 'init', '--recipe', 'typescript-direct'], cleanEnv());
const config = JSON.parse(fs.readFileSync(path.join(dir, 'redue.config.json'), 'utf8'));
if (config.checks?.[0]?.qualification !== 'npm-typescript-direct-v1') {
  console.error('init did not select the direct TypeScript recipe; see output above'); process.exit(1);
}
console.log(`\nBench project ready: ${dir} (${count} modules). Next: node bench/run.mjs ${dir}`);
