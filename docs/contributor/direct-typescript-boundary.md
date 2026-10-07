# Direct compiler source boundary

Interpretation `npm-direct-typescript@1`, not a projection of npm launcher evidence.
Reviewed official registry distributions: [TypeScript 5.6.3](https://registry.npmjs.org/typescript/-/typescript-5.6.3.tgz)
and [5.9.3](https://registry.npmjs.org/typescript/-/typescript-5.9.3.tgz). Registry SHA-512
integrities were independently verified before source review. Whole-package canonical
SHA-256 identities are pinned in `src/direct-typescript.mjs`; hash lexically sorted
POSIX relative path + NUL + file SHA-256 + NUL. Links/special files and additional or
modified files reject qualification. A version label never grants the exception.

5.6.3 lib/tsc.js is the CLI implementation. 5.9.3 lib/tsc.js only attempts
node:module.enableCompileCache then requires _tsc.js; the recipe selects _tsc.js
explicitly. The implementation preserves __filename, argv.slice(2), cwd and bottom
executeCommandLine call. Neither entry branches on argv[1] or require.main. Config
and source are parsed as data, not loaded application modules. Existing TypeScript
config/listing/input machinery is reused, not an import-graph completeness claim.

Both reviewed implementations read NODE_ENV to enable external source-map-support
in development. That path is rejected. Node loader/preload/compile-cache and
inspector injection contexts are rejected; Node 22/24 identity and relevant prefixes
remain compared. Watch controls are conservatively rejected, and watch/build/
incremental/composite flags are outside exact --noEmit. Terminal color/formatting
is not the verification claim. No npm code, configuration parser, launcher, shell,
lifecycle or update notifier executes. npm/proxy variables cannot select code or
inputs in this reviewed compiler path. Their digest is retained as provenance,
not an applicability veto. Unknown npm settings are therefore inert for this
recipe, not admitted as supported npm launcher options.

Full and context-only probes validate implementation before loading it. Retained
membership queries also verify the current compiler and reject obsolete compiler
roots before executing query code. Only the one built-in probe is allowed to
qualify; an arbitrary proxy-sensitive custom probe must not inherit the exception.
Daemon probes use daemon environment, wrapper probes use caller environment; the
normal checkpoint comparison remains authoritative. Raw caller context is never
replaced with daemon context. A changed command/interpretation changes plan identity.

Tests: `test/direct-typescript.test.mjs`, the retained notifier counterexample
`test/npm-proxy-relevance.test.mjs`, and exact installed `package-smoke.mjs`.
Public alpha.3 impact and containment are separate: `docs/acceptance/npm-launcher-boundary.md`.

Actual Codex preflight additionally injects `NODE_USE_ENV_PROXY=1`. This is admitted
only on exact Node 22.13.0, whose [options source](https://github.com/nodejs/node/blob/v22.13.0/src/node_options.cc),
[initialization](https://github.com/nodejs/node/blob/v22.13.0/src/node.cc), and
[HTTP agent](https://github.com/nodejs/node/blob/v22.13.0/lib/_http_agent.js) do not
implement that setting. The installed runtime also lacks `--use-env-proxy` in its
allowed flags. Newer Node implementations require separate review; they remain
unsupported with this nonempty setting. The original flag remains in the strict
NODE_ applicability fingerprint, unchanged. This is admission of an inert setting
in a reviewed runtime, not removal of enforced proxy configuration.

## Additional reviewed implementation: 5.5.2

Coverage candidate adds exactly official TypeScript **5.5.2**, used by current
`microsoft/vscode-js-debug` at `b1c00772e46d4ed6e73442944fb5f66b533431d2`.
It does not admit arbitrary 5.5.x, change compiler argv, project selection,
package-manager layout or Node/environment rules.

[Registry distribution](https://registry.npmjs.org/typescript/-/typescript-5.5.2.tgz)
SHA-512: `NcRtPEOsPFFWjobJEtfihkLCZCXZt/os3zf8nTxjVH3RvTSxjrCamJpbExGvYOF+tFHc3pA65qpdwPbzjohhew==`.
All 120 distribution files match the target's ordinary locked installation.
Canonical SHA-256: `953b4844b5f6edc745be844b6c367c227b59029b73c4182f508f90cc47e21816`.
The same whole-package check covers `lib/tsc.js`, probe-loaded `lib/typescript.js`,
standard libraries and package metadata before either compiler entry is loaded.

Reviewed primary sources:
[CLI entry](https://github.com/microsoft/TypeScript/blob/v5.5.2/src/tsc/tsc.ts),
[Node system](https://github.com/microsoft/TypeScript/blob/v5.5.2/src/compiler/sys.ts),
[command execution](https://github.com/microsoft/TypeScript/blob/v5.5.2/src/compiler/executeCommandLine.ts),
and the actual published JS distribution. `sys.args` is `process.argv.slice(2)`;
cwd/config discovery and program membership use the existing filesystem API.
`--noEmit` performs normal compilation. The CLI does not execute project imports
as Node code. No npm/notifier/network module enters this path. The optional
`source-map-support` development branch remains rejected by NODE_ENV admission;
inspector, loaders, preloads, watch environment and unsupported config remain
rejected. TTY/color variables affect diagnostic presentation, not the supported
verification obligation. No new context projection is introduced.

Interpretation remains `npm-direct-typescript@1`: adding a distinct pinned
implementation does not reinterpret existing compiler evidence. Compiler digest,
entry, consumed contents and plan identity are already bound into checkpoints;
a 5.6.3 receipt cannot silently authorize 5.5.2. Existing old clients reject this
newly admitted version; restart with the candidate is required. Immutable outcomes
are unchanged. The shared adversarial suite runs against both 5.6.3 and 5.5.2;
the exact-package matrix additionally installs 5.5.2 through ordinary npm.
