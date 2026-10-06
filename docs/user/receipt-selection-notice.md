# Receipt selection correction in alpha.3

**Known affected release: `@redue/cli@0.1.0-alpha.2`. Fixed in
`@redue/cli@0.1.0-alpha.3`.** No exploit or affected-user count is established.
REDUE remains an alpha.

If a wrapper persisted a newer outcome but its observer reload notification
failed, the observer could continue selecting an older passing receipt. Cached
and synchronized status could then present that older result as CURRENT and
eligible for reuse. A separate reproduced write-failure window left a new
immutable outcome recorded while replacing the selected receipt failed.

Until upgraded, do not rely solely on affected CURRENT output to skip checks.
Run verification when needed and inspect its actual outcome; a successful status
command is not proof that the latest execution passed.

## What changes

The observer refreshes REDUE-owned receipt selection before publishing status.
Clients check that a response represents the current readable selection. Missing,
unreadable, malformed, incompatible, or replaced selection cannot authorize
reuse. A new client connecting to an alpha.2 observer returns UNVERIFIED and
asks for a restart, even when the old response says CURRENT.

A small owned pending-update record also withholds applicability after an
incomplete receipt write. Successful recording clears only that check's pending
entry. It does not discard another check's incomplete outcome or automatically
promote an orphaned journal entry. Inspect the failed run and storage error, fix
the storage problem, then record that check again. An unreadable/malformed pending
record requires operator inspection; do not delete receipts to obtain green status.

Historical PASS/FAIL and immutable `runs-v1` files remain intact. Stable applicable
FAIL remains a failure and is never reuse-eligible. This guard tracks owned
receipt replacement; it does not replace input-content validation or promise an
atomic decision against concurrent edits/writes.

## Upgrade and restart

From each initialized project, stop its observer before replacing the installation.
After all observers for that installation have stopped, upgrade it once, then
restart each observer with its existing configuration and state selection:

```sh
redue stop
npm install --global @redue/cli@0.1.0-alpha.3
redue --version
redue start
redue status --sync --json
```

Use the same npm `--prefix`, project `--config`, and `--state-dir` you already use,
if customized. On Windows use `npm.cmd`/`redue.cmd` where required by the existing
shell policy. Stop all observers belonging to the installation before replacing
it, then start each with the upgraded binary. For an independently installed
candidate, its `stop` command can stop the older observer in the same explicitly
selected owned state. Do not run `remove-state`; receipts need not be deleted.

Restart preserves historical receipts and reconciles inputs. It does not promise
CURRENT: a newer failure, unstable execution, incomplete contract, changed input,
or observation uncertainty remains visible under the normal rules.
