// Keeps a recorded run's record for the census: REDUE removes it when the run
// ends. Hard-links each record file under <state>/test-record-* into <out> as
// it appears; the recorder appends through the same file, so the link holds
// every row after REDUE removes its own name. Runs until killed.
//   node eval/record-keeper.mjs <state dir> <out dir>
import fs from 'node:fs';
import path from 'node:path';

const [state, out] = process.argv.slice(2);
fs.mkdirSync(out, {recursive: true});
const kept = new Set(), records = () => { try { return fs.readdirSync(state).filter(name => name.startsWith('test-record-')); } catch { return []; } };
// Records left from earlier runs are not this run's.
const earlier = new Set(records());
function scan() {
  for (const dir of records().filter(name => !earlier.has(name))) {
    let names = [];
    try { names = fs.readdirSync(path.join(state, dir)).filter(name => name.endsWith('.jsonl')); } catch { continue; }
    for (const name of names) {
      const key = `${dir}/${name}`;
      if (kept.has(key)) continue;
      try { fs.linkSync(path.join(state, dir, name), path.join(out, name)); kept.add(key); } catch (error) { if (error.code === 'EEXIST') kept.add(key); }
    }
  }
}
try { fs.watch(state, {recursive: true}, scan); } catch {}
setInterval(scan, 5);
scan();
