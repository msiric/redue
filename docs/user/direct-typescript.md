# Explicit local TypeScript verification

This check means: the reviewed local TypeScript compiler completed the configured
check against declared, observed inputs and relevant execution context. It does
not mean npm or npm lifecycle scripts completed.

For a supported single-package npm project with a typecheck script of `tsc`
runs (see [script forms](#script-forms)) or no typecheck script and a root
`tsconfig.json`, installed dependencies, Node 22/24 and TypeScript 5.x or 6.0
(see [compiler identity](#compiler-identity)). TypeScript 7 is a native
compiler this recipe cannot run: `init` refuses it
(`direct-typescript-version-unsupported`):

```sh
redue init --recipe typescript-direct --check typecheck --dry-run
redue init --recipe typescript-direct --check typecheck
redue start
redue run typecheck
redue status --sync
```

The preview shows the discovered script and recorded direct invocation. Nothing
executes during init. package.json, environment and dependencies remain unchanged.
A generated check contains:

```json
{
  "name": "typecheck",
  "script": "typecheck",
  "kind": "typecheck",
  "command": ["@node", "@typescript-compiler:.", "--noEmit"],
  "cwd": ".",
  "qualification": "npm-typescript-direct-v1",
  "inputs": ["package.json", "package-lock.json", "tsconfig.json", "**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,json,jsonc}", "!node_modules/**", "!.git/**"]
}
```

`script` identifies the reviewed source recipe; `command` is what actually runs:
the resolved Node executable and local TypeScript implementation, with exact argv
and no shell. The entry is `lib/_tsc.js` where the package has one (5.7 and
later), without its outer compile-cache-enabling shim, and `lib/tsc.js`
otherwise. No compiler is fetched or bundled.

## Compiler identity

The entire installed `node_modules/typescript` must be an official package,
byte for byte, in one of two ways:

- TypeScript 5.5.2, 5.6.3, 5.9.3, 6.0.2 or 6.0.3: its files match the digest
  REDUE ships for that release.
- Any other TypeScript 5.x or 6.0 release: package-lock.json records the
  registry's `typescript` package at the installed version (no alias, an
  `https` tarball URL, not a file or git source) with an integrity (sha512,
  or sha1 where a registry records only sha1), npm's cache holds the tarball
  under that integrity, and the installed files are exactly the tarball's
  files. REDUE reads the cache only; it never downloads. The cache is the one
  npm uses: `npm_config_cache`, else `cache` in the project's `.npmrc`, then
  the user's, else `~/.npm` (`%LocalAppData%\npm-cache` on Windows); the
  global npmrc is not read. `npm-shrinkwrap.json` is not read on this path.
  `npm ci` fills the cache. When the tarball is missing the check stays
  recording-only with the reason `npm-tarball-uncached`; `npm cache add
  typescript@VERSION` adds it. The check's compiler identity is then the
  lockfile integrity, so a lockfile change re-probes.

CI runs the same contract suite against the last release of each minor from
5.0 to 5.8 that the reviewed releases do not cover. Later minors (6.1 and up)
wait until CI covers them. TypeScript 7 (the native compiler) is not
supported.

## Script forms

A typecheck script qualifies when it is one or more `tsc` runs joined by `&&`,
each with `--noEmit` and only these arguments, in any order: `-p`/`--project`
with a config file or directory inside the project, `--skipLibCheck`, and
`--pretty` (optionally `true` or `false`). For example
`tsc -p tsconfig.app.json --noEmit` or
`tsc --noEmit && tsc --noEmit -p tsconfig.node.json`. `tsc -b`, `--watch`,
other options, quotes, variables and other commands keep the script
recording-only.

A chain gets one check per run, named `typecheck.1`, `typecheck.2` and so on,
each with the script's name and that run's arguments in its command. Each run
is checked as its own program against its own config, and is reused only while
the script still has as many runs as the config has checks for it, one of them
with exactly those arguments. Adding or removing a run, or a pre- or
post-script, makes every check of the script not reusable until `init` runs
again. The script as a whole
(`npm run typecheck`) is skipped only when its current runs and the configured
checks correspond one to one and all are CURRENT (see [agents](agents.md)).

With no typecheck script and a root `tsconfig.json`, init proposes a
`tsc --noEmit` check with no `script` field, unless a script already runs a
TypeScript checker in another form (`tsc -b`, `vue-tsc`, `svelte-check`,
`tsgo`, `astro check`, `nuxi typecheck`). package.json is not changed. The
check is written only when the contract holds; otherwise no typecheck check is
added. The pnpm contract does the same for each workspace package with a
`tsconfig.json` and no typecheck script.

Existing configs are never overwritten. To compare choices, use a new project-local
`--config redue.direct.config.json` with init; this explicitly selects separate
state. To replace an existing check deliberately, preview JSON, stop its observer,
review/edit that check's config, and restart using the same config/state. Existing
npm receipts remain historical; the new command/interpretation needs a fresh run.
Do not delete receipts. `redue run` always executes the configured command.

## Existing npm configuration: deliberate replacement

First upgrade through the [alpha.4 containment](npm-launcher-notice.md), stopping
observers before the installation change and restarting with the same config/state.
The old npm check becomes recording-only; its receipts remain historical.
To opt into the direct recipe afterward:

1. Stop the observer, install the selected released version into the same prefix,
   and keep the original `redue.config.json` and any explicit `--state-dir` selection.
2. Run `redue init --recipe typescript-direct --check typecheck --dry-run --json`
   using that config selection. Inspect `proposed_config.checks` and the recorded
   invocation. This does not write anything, even when the config already exists.
3. In your editor, replace only the intended check object with the reviewed proposed
   object. Preserve its name, the top-level project configuration, and every other
   check. Do not replace the whole config with a one-check preview. Keep a local
   backup outside observed inputs if desired.
4. Run `redue start` with the same config/state. `redue status --sync --json` must
   not treat the old npm receipt as eligible compiler evidence.
5. Run `redue run typecheck`, then `redue status --sync --json`. A qualified success
   now records the direct compiler recipe with a new run ID. Old npm runs remain
   immutable history. Other check definitions are unchanged.

Substitute the actual selected check name throughout. Repeating plain `init`
does **not** migrate an existing config. A deliberately separate `--config` file
is useful for comparison, but has separate state by design. Do not create one
accidentally when intending to preserve the original selection.

Pre/post scripts, compound commands, wrappers, environment assignments, workspace
projects and unsupported compiler versions are not automatically converted.
Init retains the original script with a reason. Development-mode source-map helpers,
Node preloads/loaders/compile-cache settings, `TS_ETW_MODULE_PATH` (including empty or case aliases), unsupported compiler plugins, a
`composite` root tsconfig, a program that uses a referenced project's files,
outside-root inputs and uncertain observation withhold applicability. Extra custom probes cannot inherit this recipe's context
exception. Relevant source, declaration, config, membership and installed-content
changes invalidate or withdraw applicability normally. Installed files are observed
by identity, so reinstalling identical packages or restoring an installed file's
bytes also needs one rerun (see [configuration](configuration.md)).

Vitest writes its results under `node_modules/.vite/vitest` at every run.
They are not inputs, so a test run leaves the typecheck CURRENT. Everything
else under `node_modules/.vite` is still an input. A program that asks about
anything under `node_modules/.vite` (by any spelling or through a link that
resolves there), or lists `node_modules`, is UNVERIFIED: REDUE does not
observe what Vitest writes there. A check configured before 0.1.0-alpha.25 gets the new inputs on
its own and reports STALE once after the upgrade.

A root tsconfig with `incremental: true` is supported. tsc reads and writes
its build-info file (`tsBuildInfoFile`, or the default next to the config) on
each run, so REDUE leaves that file out of the inputs and lets the run write
only that file and the directories it needs; any other write makes the run
non-reusable. The result is what your own incremental tsc reports, so it
trusts TypeScript's build-info cache, which TypeScript discards after a
compiler or option change. The file must be inside the checkout and named
`*.tsbuildinfo`, with no glob characters in its path.
`assumeChangesOnlyAffectDirectDependencies` is refused: with it, the result
depends on earlier runs. REDUE reads the setting when the observer starts:
after turning `incremental` on or moving the file, restart the observer;
status says so until then. On Linux, a run that creates the build-info directory is an
observation gap, so the first run after that is not reusable.

A root tsconfig may reference other configs (`references`), for example a
composite `tsconfig.node.json`. Plain `tsc --noEmit` reads those configs but
does not build them, so REDUE treats them as configuration. If the program
uses a referenced project's sources or built outputs, the check is not
qualified.

On macOS and Linux, `redue run` records which files the compiler looked up and
compares them with what the observer's last probe saw. The probe only builds the
program. With `declaration: true`, tsc also resolves the project's dependencies
while it checks declarations, so the run looks up files the probe never did,
some outside the checkout, and reads those dependencies' `package.json`. The
receipt keeps the run's answers to those existence, `realpath` and
`package.json` lookups as run facts. Before every CURRENT answer, status asks
each one again; a cached `redue status` asks them again when it is read. If any
now answers differently, the check is STALE and the reason names the path. Any
other file the run read, or a directory it listed, that the probe never did
still makes the run non-reusable, as do more than 10,000 run facts. Receipts
with run facts use a new format, so earlier observers do not reuse them. A
direct receipt recorded before run facts is UNVERIFIED until the check runs
again. Windows does not record direct runs, so it has no run facts: there, a
lookup only declaration checks make is not checked again.

The versioned `npm-direct-typescript@1` interpretation retains relevant Node context
and identity. Reviewed compiler code does not parse npm settings or proxy variables;
these remain untouched in the child environment and are recorded only as a digest
of observed provenance. This is not an environment ignore option for arbitrary
commands or other providers. No remote service equivalence is claimed. Ordinary
cached status remains conservative; synchronize deliberately when worth the cost.

Explain/JSON report `verification_recipe: "npm-direct-typescript@1"` for receipts
recorded with this recipe. Report compiler evidence as compiler evidence. A user's
explicit request for `npm run typecheck` is not satisfied by this different command.

The injected `NODE_USE_ENV_PROXY=1` setting is admitted only on Node 22.13.0,
where it is inert; it remains strictly tracked. Other Node versions with this
setting need review and stay unqualified. REDUE does not alter the setting.

## Node settings

Since alpha.11 the direct recipe accepts these `NODE_*` settings:

- `NODE_OPTIONS`, when every token is one of `--max-old-space-size=<n>`,
  `--max-semi-space-size=<n>`, `--use-openssl-ca`, `--use-bundled-ca`,
  `--use-system-ca` or `--dns-result-order=ipv4first|ipv6first|verbatim`.
  Any other flag, quotes, backslashes or tabs are refused.
- `NODE_EXTRA_CA_CERTS`.
- `NODE_PATH`.

`NODE_ENV` set to `production`, `test` or empty was already accepted. Every other non-empty
`NODE_*` setting withholds applicability. The values are part of the recorded
execution context: a run under one value is not reusable under another. A
`--require` in `NODE_OPTIONS` still runs inside REDUE's own process before REDUE
refuses it. The npm, pnpm and Yarn recipes still refuse `NODE_OPTIONS` and
`NODE_PATH`.
