# Explicit local TypeScript verification (unreleased candidate)

This check means: the reviewed local TypeScript compiler completed the configured
check against declared, observed inputs and relevant execution context. It does
not mean npm or npm lifecycle scripts completed.

For a supported single-package npm project with an existing standalone
`tsc --noEmit` script, installed dependencies, Node 22/24 and TypeScript 5.6.3/5.9.3:

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
and no shell. TypeScript 5.6.3 uses `lib/tsc.js`; 5.9.3 uses `lib/_tsc.js` directly,
without its outer compile-cache-enabling shim. No compiler is fetched or bundled.
The entire installed package must match reviewed official distribution bytes.

Existing configs are never overwritten. To compare choices, use a new project-local
`--config redue.direct.config.json` with init; this explicitly selects separate
state. To replace an existing check deliberately, preview JSON, stop its observer,
review/edit that check's config, and restart using the same config/state. Existing
npm receipts remain historical; the new command/interpretation needs a fresh run.
Do not delete receipts. `redue run` always executes the configured command.

Pre/post scripts, compound commands, wrappers, environment assignments, workspace
projects and unsupported compiler versions are not automatically converted.
Init retains the original script with a reason. Development-mode source-map helpers,
Node preloads/loaders/compile-cache settings, unsupported compiler plugins or
incremental/composite configuration, outside-root inputs and uncertain observation
withhold applicability. Extra custom probes cannot inherit this recipe's context
exception. Relevant source, declaration, config, membership and installed-content
changes invalidate or withdraw applicability normally.

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
