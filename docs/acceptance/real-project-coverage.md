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
