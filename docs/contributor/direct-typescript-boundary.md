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
