// Programs a recorded run executed that REDUE's recorder did not see (Linux).
// strace (`-f -e trace=execve,execveat,clone,clone3,fork,vfork`) lists every
// program image; the run record (kept by eval/record-keeper.mjs) lists the
// Node processes that loaded the recorder and the programs they reported.
// A program is missed when a process that had loaded the recorder started it
// (fork, then exec) or became it (exec), and the record has no row for it:
// C with its PID, S with its name, X in its own record. Programs started by
// a shell, a package manager or another program the recorder does not run in
// are left to the guard, which reads their command text or names them.
import fs from 'node:fs';
import path from 'node:path';

// Node itself, or a script whose #! line names Node, which the kernel runs
// in the same image (strace names the script). Through `#!/usr/bin/env node`
// the image is env until env execs Node.
function node(file) {
  if (/^node(js)?$/.test(path.basename(file))) return true;
  let head = ''; try { const fd = fs.openSync(file, 'r'), buffer = Buffer.alloc(256); head = buffer.toString('latin1', 0, fs.readSync(fd, buffer, 0, 256, 0)); fs.closeSync(fd); } catch { return false; }
  return head.startsWith('#!') && /^node(js)?$/.test(path.basename(head.slice(2).split('\n')[0].trim().split(/\s+/)[0] || ''));
}

function readRecord(dir) {
  const headers = new Set(), started = new Map(), replaced = new Map();
  let names = [];
  try { names = fs.readdirSync(dir).filter(name => name.endsWith('.jsonl')); } catch { return null; }
  for (const name of names) {
    let rows; try { rows = fs.readFileSync(path.join(dir, name), 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line)); } catch { continue; }
    const header = rows[0]?.[0] === 'H' ? rows[0][1] : null;
    if (!header) continue;
    if (header.threadId === 0) headers.add(String(header.pid));
    const pid = String(header.pid), entry = started.get(pid) ?? {pids: new Set(), names: []};
    started.set(pid, entry);
    for (const [kind, ...value] of rows) {
      if (kind === 'C') entry.pids.add(String(value[0]));
      else if (kind === 'S') entry.names.push(path.basename(String(value[0])));
      else if (kind === 'X') replaced.set(pid, [...replaced.get(pid) ?? [], path.basename(String(value[0]))]);
    }
  }
  return {headers, started, replaced};
}

function execs(file) {
  let text = ''; try { text = fs.readFileSync(file, 'utf8'); } catch { return null; }
  // strace splits a call another process interrupted into two lines. An
  // exec by a thread other than the leader resumes under the leader's PID.
  const pending = new Map(), lines = [];
  for (let line of text.split('\n')) {
    const pid = /^(\d+)\s/.exec(line)?.[1];
    if (!pid) continue;
    if (line.endsWith('<unfinished ...>')) { pending.set(pid, line.slice(0, -'<unfinished ...>'.length)); continue; }
    const resumed = /^\d+\s+<\.\.\. (\w+) resumed>(.*)$/.exec(line);
    if (resumed) {
      let start = pending.get(pid), from = pid;
      if (!start && resumed[1].startsWith('execve')) for (const [tid, text] of pending) if (/^\d+\s+execve/.test(text)) { start = text.replace(/^\d+/, pid); from = tid; }
      line = (start ?? `${pid} ?(`) + resumed[2]; pending.delete(from);
    }
    lines.push(line);
  }
  const threadOf = new Map(), lastParent = new Map();
  for (const line of lines) {
    const fork = /^(\d+)\s+(clone3?|v?fork)\(.*= (\d+)$/.exec(line);
    if (fork) (/CLONE_THREAD/.test(line) ? threadOf : lastParent).set(fork[3], fork[1]);
  }
  const owner = pid => threadOf.has(pid) ? owner(threadOf.get(pid)) : pid;
  // In order: a fork starts a new process under its PID (a reused PID starts
  // over); a child's exec can come before its parent's clone returns.
  const events = [];
  for (const line of lines) {
    const fork = /^(\d+)\s+(clone3?|v?fork)\(.*= (\d+)$/.exec(line);
    if (fork && !/CLONE_THREAD/.test(line)) { events.push({fork: fork[3], parent: owner(fork[1])}); continue; }
    const exec = /^(\d+)\s+execve(?:at)?\((?:[^,"]+, )?"((?:[^"\\]|\\.)*)", \[(.*?)\], .*\)\s*= 0$/.exec(line);
    if (!exec) continue;
    const argv = [...exec[3].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(m => m[1]);
    events.push({pid: owner(exec[1]), file: exec[2], argv});
  }
  return {events, lastParent: pid => lastParent.has(pid) ? owner(lastParent.get(pid)) : null};
}

export function unrecordedPrograms(traceFile, recordDir) {
  const trace = execs(traceFile), record = readRecord(recordDir);
  if (!trace || !record) return null;
  if (!record.headers.size) return null;
  const image = new Map(), parent = new Map(), forked = new Set(), missed = [], names = new Map();
  const unclaimed = pid => { if (!names.has(pid)) names.set(pid, [...record.started.get(pid)?.names ?? []]); return names.get(pid); };
  for (const event of trace.events) {
    // A second fork under a PID is a new process; a child's exec can come
    // before its first fork line.
    if (event.fork) { if (forked.has(event.fork)) image.delete(event.fork); forked.add(event.fork); parent.set(event.fork, event.parent); continue; }
    const {pid, file, argv} = event;
    const first = !image.has(pid), actor = first ? parent.get(pid) ?? trace.lastParent(pid) : pid, actorImage = actor && image.get(actor);
    image.set(pid, file);
    // Only a Node process that loaded the recorder reports what it starts.
    if (!actor || !actorImage || !node(actorImage) || !record.headers.has(actor)) continue;
    if (first) {
      if (record.started.get(actor)?.pids.has(pid)) continue;
      const list = unclaimed(actor), at = list.indexOf(path.basename(file));
      if (at >= 0) { list.splice(at, 1); continue; }
    } else {
      const list = record.replaced.get(pid) ?? [], at = list.indexOf(path.basename(file));
      if (at >= 0) { list.splice(at, 1); continue; }
    }
    missed.push({how: first ? 'started' : 'replaced', program: path.basename(file), file, argv: argv.slice(0, 4)});
  }
  return missed;
}
