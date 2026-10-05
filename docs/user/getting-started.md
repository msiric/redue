# Install and use REDUE

Requirements: Git; Node 22 or newer with npm; an existing local JS/TS checkout
with its dependencies installed. Linux additionally needs `python3`. Supported
storage is local APFS on macOS, NTFS on Windows, and the documented native Linux
filesystems. Network/FUSE/overlay mounts are not qualified Linux storage.
Node 22 and 24 are the release-test matrix; newer majors are not yet acceptance claims.

The alpha candidate is an ordinary npm tarball. From REDUE source:

```sh
npm ci
npm pack
npm install --global ./redue-0.1.0-alpha.1.tgz
redue --version
```

These commands also work in PowerShell (use `npm.cmd`/`redue.cmd` when a local
PowerShell script policy blocks generated `.ps1` shims; do not change policy).
No build step, custom installer, account, or login service is required. Installing
npm dependencies uses the registry; normal local observation does not require network.

For a reversible user-owned prefix, POSIX shells:

```sh
npm install --global --prefix "$HOME/.local/redue-alpha" ./redue-0.1.0-alpha.1.tgz
export PATH="$HOME/.local/redue-alpha/bin:$PATH"
```

PowerShell:

```powershell
$reduePrefix = Join-Path $env:LOCALAPPDATA 'redue-alpha-install'
npm.cmd install --global --prefix $reduePrefix ./redue-0.1.0-alpha.1.tgz
$env:PATH = "$reduePrefix;$env:PATH"
redue.cmd --help
```

These PATH changes affect only the current shell. Alternatively invoke the
installed entry point directly: POSIX `node "$HOME/.local/redue-alpha/lib/node_modules/redue/bin/redue.mjs"`;
Windows `node "$reduePrefix/node_modules/redue/bin/redue.mjs"`.

## First project

From the project root:

```sh
redue init --dry-run
redue init
redue start
redue run typecheck
redue status
redue explain typecheck
```

Use a check actually printed by `init`. For a workspace:
`redue init --workspace @example/package --check typecheck`.
Initialization previews detected commands and qualification confidence before writing
`redue.config.json`. An existing config is never overwritten. No checks are run and
no dependencies installed. A missing/unsupported boundary is explained.

“Ready to qualify” means REDUE has a supported recipe whose prerequisites will be
validated. It is not a receipt. “Recording-only” can record PASS/FAIL without claiming
reusability. Qualification can change when configuration or installation changes.

`run` streams normal output and preserves execution environment and cancellation.
For the narrow pnpm TypeScript contract, `init` explicitly shows the direct installed
compiler invocation it selects; other scripts run through the package manager.
Only use configs and probes from trusted repositories: these execute local code.

`status` is cached and conservative. `status --sync` and `explain` revalidate caller
context and may execute read-only probes. Synchronization can be slower than a cheap
check, especially on Windows. Choose deliberately. A timeout is UNVERIFIED, not green.

## Lifecycle and removal

`start` starts this config's owned observer, or reports that it is already running.
If already running, use `status`; do not create a second state directory just to
start another observer. Startup may report initialization before inputs are ready.
`stop` stops that observer and retains historical evidence. After restart, observation
is reconciled before reuse.

```sh
redue stop
redue start
redue remove-state
npm uninstall --global redue
```

For an isolated installation, use the same `--prefix` on uninstall. Remove state
**before** uninstalling the command. No broad recursive deletion command is needed.
`remove-state` checks its ownership marker and stops only that observer. It does not
remove project files, dependencies, another tool's watches, or other REDUE configurations.
To remove project configuration, inspect and delete `redue.config.json` yourself.

Runtime state is separate from durable project config. Legacy directory spelling is
retained for compatibility, not copied into your config:

| OS | Default state base |
| --- | --- |
| macOS | `~/Library/Application Support/vstate/` |
| Linux | `$XDG_STATE_HOME/vstate/`, otherwise `~/.local/state/vstate/` |
| Windows | `%LOCALAPPDATA%/vstate/` |

A checkout/config identity selects a dedicated child directory. Use
`--state-dir /your/owned/redue-project-state` to choose a dedicated directory outside
all observed roots; its basename must start with `redue-` or legacy `vstate-`.
For a removed checkout, `redue --state-dir /your/owned/redue-project-state remove-state`
still works without rebuilding its compiler/configuration. Ownership/active-run conflicts
are actionable errors, never resolved merely by deleting an old lock.
