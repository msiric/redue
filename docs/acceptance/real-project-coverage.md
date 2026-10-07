# Real-project coverage: TypeScript 5.5.2

Current conclusion: **candidate under acceptance, not released**. Twelve current
public HEADs were screened before selection. Two ordinary locked npm installations
were measured/checked; only one new compiler implementation is being admitted.
No scripts, compiler versions, dependency layouts or verification options were
changed to make a project fit. This is compiler evidence, not application/tests.

The released guidance and completed model comparison are separate:
[activation evidence](agent-activation.md). Tail diagnostics are a separate branch:
[slow-query evidence](https://github.com/msiric/redue/tree/investigate/slow-direct-query).

## Complete metadata screen (2026-10-07)

Compiler column is the declared requirement, except where the exclusion explicitly
names an inspected locked version. All links pin the screened revision.

| Project | Revision | Declared TypeScript | Relevant command | Result/gap |
|---|---|---|---|---|
| [TypeStrong/typedoc](https://github.com/TypeStrong/typedoc/tree/6d8c856bbb46b089371952981f113c3e318818fd) | `6d8c856bbb46` | `6.0.3` | doc:c: node bin/typedoc --tsconfig src/test/converter/tsconfig.json; doc:cd: node --inspect-brk dist/lib/cli.js --tsconfig src/test/converter/tsconfig.json | pnpm, TypeScript 6.0.3, project references; multiple gaps. |
| [dsherret/ts-morph](https://github.com/dsherret/ts-morph/tree/f288183ddb496adc6f4c5b6929830b5b73437185) | `f288183ddb49` | `not declared` | No standalone tsc check | Workspace/build graph; no standalone root check. |
| [handsontable/hyperformula](https://github.com/handsontable/hyperformula/tree/af2d59dc61ec1434498c7233d06e77370e7235b8) | `af2d59dc61ec` | `^4.0.8` | bundle:typings: tsc --emitDeclarationOnly -d --outDir typings; verify:typings: tsc --noEmit | Normal npm installation and direct check PASS, but locked TypeScript 4.0.8 is a second compiler review; excluded from chosen extension. |
| [isaacs/node-lru-cache](https://github.com/isaacs/node-lru-cache/tree/7e71a1f3babdc68dfbadde91f28eaeea919dad9b) | `7e71a1f3babd` | `not declared` | typedoc: typedoc --tsconfig ./.tshy/esm.json ./src/*.ts | Generated tshy configuration/build invocation; no standalone selected noEmit command. |
| [liriliri/eruda](https://github.com/liriliri/eruda/tree/0c55928fec802fb2102934c4b5928686178b467b) | `0c55928fec80` | `not declared` | No standalone tsc check | No TypeScript verification contract. |
| [microsoft/vscode-js-debug](https://github.com/microsoft/vscode-js-debug/tree/b1c00772e46d4ed6e73442944fb5f66b533431d2) | `b1c00772e46d` | `^5.5.2` | test:types: tsc --noEmit | SELECTED: locked TypeScript 5.5.2 is the only initial admission gap; normal direct and npm check PASS. |
| [react-hook-form/react-hook-form](https://github.com/react-hook-form/react-hook-form/tree/36e53296193eb98fc8ffe9db2165cf53ceb62b8e) | `36e53296193e` | `^6.0.3` | type: tsc --noEmit; test:type: tsc -p src/__typetest__/tsconfig.json | pnpm, TypeScript 6.0.3; outside chosen npm/compiler extension. |
| [remarkablemark/html-react-parser](https://github.com/remarkablemark/html-react-parser/tree/c2095e423d7185bbf82aeee79161ef73b7aff982) | `c2095e423d71` | `6.0.3` | benchmark: ts-node --project tsconfig.build.json benchmark; build:cjs: tsc --project tsconfig.build.json | TypeScript 6.0.3 plus named config/references and generated output inputs. |
| [sindresorhus/got](https://github.com/sindresorhus/got/tree/e1d87d2ced01d5b7d855a7dc8b091bf7b014a1e4) | `e1d87d2ced01` | `^5.9.3` | test: xo && tsc --noEmit && NODE_OPTIONS='--import=tsx/esm' ava; test:coverage: xo && tsc --noEmit && NODE_OPTIONS='--import=tsx/esm' c8 ava | No lockfile; compound test invocation, emitted build. |
| [sindresorhus/ky](https://github.com/sindresorhus/ky/tree/0d59458a0a58e1c3d7c6db0ab17ed5c7cd671e47) | `0d59458a0a58` | `^5.9.3` | test: xo && npm run build && tsc --project tsconfig.test.json && ava; build: del-cli distribution && tsc --project tsconfig.dist.json | No lockfile; compound build/test and named config. |
| [sindresorhus/p-queue](https://github.com/sindresorhus/p-queue/tree/180ab9e25cd10b6f548767d7176076b50d25e188) | `180ab9e25cd1` | `^5.9.2` | build: del-cli dist && tsc; test: xo && node --import=tsx/esm --test test/*.ts && del-cli dist && tsc && tsd | No lockfile; compound test/build path. |
| [sindresorhus/type-fest](https://github.com/sindresorhus/type-fest/tree/e9f614f191aa039e4aefa2d41d62c2a3fd070cfd) | `e9f614f191aa` | `^5.9.2` | test:tsc: node --max-old-space-size=6144 ./node_modules/.bin/tsc; test:minimum-lib: node --max-old-space-size=6144 ./node_modules/.bin/tsc -p tsconfig.minimum-lib.json | No lockfile; Node memory-flag wrapper and named project selection. |

## Selected extension

Exactly official **TypeScript 5.5.2** in the existing single-package npm direct
recipe. Target: `microsoft/vscode-js-debug`, `test:types = tsc --noEmit`.
Normal `npm ci` included its real Playwright postinstall and Husky preparation;
browser downloads stayed in the disposable checkout. Neither verification
script nor package/lockfile was edited. No pre/post `test:types` lifecycle exists.
The separate generation/build/test commands are not claimed by this receipt.

Whole-package implementation digest and source review:
[compiler boundary](../contributor/direct-typescript-boundary.md).
The existing input, config, compiler-content, runtime, observer and receipt
protections remain authoritative. No named-project, emit, incremental, workspace,
new provider or environment-policy extension accompanies this change.

## Baseline measurement

Same Mac, Node 22.13.0/npm 10.9.2; normal installed compiler and caches. Five
alternating direct and npm runs all passed. Direct compiler median 2,070 ms,
max 2,277 ms; npm launcher median 2,286 ms, max 2,680 ms. Launcher overhead is
not claimed as compiler savings. Candidate decision and complete workflow
measurements are pending; CURRENT queries alone do not establish saved runs.

The HyperFormula current locked 4.0.8 project also installed normally and its
standalone check passed, but qualifying it would require a second implementation
review. It remains excluded in this pass, not counted as a product adoption.

## Installed candidate workflow and economics

Runtime `9d61c5f`, local tarball SHA-256
`6295cf9779e86a0226f3d58192505f62335914e916a45b4dcd92b077312214db`.
This unreleased artifact is not the alpha.7 guidance release artifact despite its
inherited version field. The CI-packed exact artifact is identified separately.

Actual installed commands: `redue init --recipe typescript-direct --check typecheck`,
project-local Codex setup, start, wrapped baseline, synchronized inherited status,
unrelated `.md` edits, relevant source comments, wrapped rerun, three stop/start
cycles. All expected states passed. Existing compiler/script/lockfile bytes were
retained. Initial Playwright downloads were moved to the separately owned cache
outside the checkout before REDUE cost measurement, so extra test-browser files
did not artificially enlarge the observed source tree. Required browser assets
were preserved; verification command and dependencies were unchanged.

These are actual CLI workflow measurements on macOS/Node 22.13.0, not model reuse
claims. Each row measures the complete listed sequence directly, not a sum of
separate medians. Failed commands: zero. No samples discarded.

| Measured path | n | Mean ms | Median ms | p90 ms | Max ms | Total ms |
|---|---:|---:|---:|---:|---:|---:|
| Ordinary compiler | 5 | 2106.2 | 2070.0 | 2277.4 | 2277.4 | 10531.1 |
| npm `test:types` | 5 | 2357.3 | 2285.6 | 2679.5 | 2679.5 | 11786.7 |
| Initial wrapped run + sync | 1 | 4711.1 | 4711.1 | 4711.1 | 4711.1 | 4711.1 |
| Cached status (conservative UNVERIFIED) | 10 | 63.2 | 59.3 | 70.6 | 89.8 | 631.6 |
| Unchanged synchronized decision | 10 | 382.1 | 379.3 | 391.7 | 401.1 | 3820.6 |
| Unrelated-edit synchronized decision | 5 | 386.8 | 390.6 | 392.7 | 392.7 | 1933.8 |
| Relevant edit: sync + required run + sync | 3 | 5826.6 | 5790.8 | 5924.4 | 5924.4 | 17479.8 |
| Stop + start + first sync | 3 | 1847.5 | 1814.7 | 1919.4 | 1919.4 | 5542.5 |
| First sync alone after restart | 3 | 381.8 | 381.7 | 385.0 | 385.0 | 1145.4 |
| Explicit fresh wrapped run | 3 | 4157.0 | 4150.2 | 4175.5 | 4175.5 | 12471.1 |

Unchanged decision/ordinary-compiler median ratio is 0.183: about 1.69 seconds
less CLI work per *potential* reuse opportunity in these separate measured paths.
Initial wrapped execution itself cost 4,275 ms; its compiler invocation was roughly
2.05 seconds. Recording and relevant-change workflows have real overhead. A user
who needs fresh verification pays it; a CURRENT query alone is not a saved run.

All ten unchanged and five unrelated queries retained baseline receipt
`39348b4f-f9ae-4478-b0d4-24b00e045767`. Relevant changes returned STALE with historical
PASS, then new wrapped outcomes became CURRENT. All three restarts inherited
`b4ef1d6b-0b82-45c0-914f-b87783a4bff7`. No historical receipt was converted or deleted.

New-project model trials: **NOT RUN yet**. The earlier approved exact socket/state
belongs to a different disposable checkout. A minimal equivalent grant for this
checkout and its one observer endpoint was requested once. No model was launched
outside that boundary. Existing activation successes remain historical evidence,
not counted again here. Claude and cross-host behavior remain NOT RUN.

One additional real project completes the deterministic workflow; the desired
second project is not claimed. Eleven screened projects remain excluded for the
recorded gaps. This result establishes useful *CLI reuse economics*, not causal
agent-task savings or general ecosystem coverage.
