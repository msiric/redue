# npm launcher applicability correction — alpha.4

Alpha.4 withdraws automatic applicability for npm-backed TypeScript checks using
`typescript-noemit-v1`. Alpha.3 was demonstrated to admit an npm invocation whose
update notification consumes unobserved remote responses, cache and time. Those
inputs can change the outer npm result without changing the tracked project or
caller identity. The controlled reproduction does not establish a public registry
malfunction, affected-user count, or compiler completion in the failing npm case.

Npm commands still execute exactly as configured through `redue run CHECK`.
They still record PASS/FAIL. Previous PASS remains historical PASS; applicability
is now UNVERIFIED, including after synchronization or a successful new npm run.
This is a correction to the claimed boundary, not evidence that the code failed.
Supported Yarn/pnpm and independently reviewed explicit contracts are unchanged.

Until upgraded, do not rely solely on automatic npm CURRENT to skip the npm
invocation. A different verification recipe requires explicit selection and fresh
evidence; it cannot reinterpret an old npm receipt. Alpha.4 does not ship the
experimental npm direct-compiler recipe or agent activation.

## Upgrade without losing history

First stop **every observer using this installation**, using each original config
and any explicit state directory. Then upgrade that same installation and restart
each observer with the same selections:

```sh
redue --config /path/to/project/redue.config.json stop
npm install --global @redue/cli@0.1.0-alpha.4
redue --config /path/to/project/redue.config.json start
redue --config /path/to/project/redue.config.json status --sync
```

Repeat the stop/start commands for each project. If you originally used
`--state-dir`, supply the identical directory on every REDUE command. If installed
with a custom npm `--prefix`, supply the same prefix during installation. On Windows
use `npm.cmd`/`redue.cmd` if required by existing PowerShell policy; do not change it.

**Do not delete receipts or use `remove-state` as an upgrade step.** An upgraded
client refuses an obsolete running observer interpretation and asks for stop/start.
Restart reconciles existing state and preserves immutable historical runs. This
correction does not silently change your project config or configured command.
