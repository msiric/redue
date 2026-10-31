// node hidden-trial.mjs ROOT CHECK_JSON: init's trial of a check (plain
// against sandboxed), with the checkout's git-ignored entries hidden from the
// sandboxed run (sandboxTrial's `hide`). Prints the trial, with the hidden
// entries, as JSON. A process of its own, so the census can run it with the
// check's environment and, on Linux, under strace. Research only.
import {sandboxTrial} from '../src/sandbox.mjs';

const [root, check] = process.argv.slice(2);
const trial = await sandboxTrial(root, JSON.parse(check), {hide: true, timeout: 600_000});
console.log(JSON.stringify(trial));
