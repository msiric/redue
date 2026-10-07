# Real-project coverage: TypeScript 5.5.2

Current conclusion (2026-10-07): **combined review candidate prepared; real-project
handoff NOT RUN because the host execution boundary failed before model launch**.
PR #7 passed the bounded source review but its authorized remote merge was rejected
by the host approval layer; it remains open. PR #8 remains draft. Neither the
separate historical platform results nor the earlier project CLI timings below
are acceptance of the newly combined artifact. No new project/provider expansion
or evidence-semantics change was made in this review pass.

### Combined candidate and review cleanup

- Branch `dev/typescript-project-coverage`; packed source
  `9bcdbc0450ca8e79c7b306299a8eb76adb81fc8f` incorporates PR #7 through normal local
  merge `c737dff8909816d6dc1f81b1d4a4db6d9c94b318`. This local merge does **not**
  mean that PR #7 has merged into GitHub main.
- Exact filename `redue-cli-0.1.0-alpha.7.tgz`, SHA-256
  `66ec08caf5ace897e3bd4d2c9dd132c3c87898a2e587b293b94d5b4874aed2ac`.
  Its inherited alpha.7 metadata is not publication authorization: the frozen
  guidance release is the different `db69cc6414f61bf3754cc7ef368083d8e7711283419a5f481e1f61c974cb98f2`
  artifact. Local npm manifest, checksum and source-identity record are retained.
- Review found a concrete contributor fixture problem: the root aliased 5.5.2
  development dependency had replaced the main `node_modules/.bin/tsc` shim.
  Commit `5ed6f0b` moves only that test compiler into an isolated private
  [fixture](../../test/fixtures/typescript-5-5-2/package-lock.json). Its lock points
  to the official public npm distribution and pins the previously reviewed
  SHA-512. Main TypeScript remains 5.6.3 and its shim resolves to that compiler.
  `npm test` installs the fixture through `pretest`; normal package installation
  has no new installation hook. No project/user/global registry configuration
  was changed. A clean offline installation used integrity-checked, cached public
  package bytes because registry DNS was unavailable. This is not a new online
  registry verification.
- Recomputed whole-package digests match the reviewed distributions: 5.5.2,
  120 files, `953b4844b5f6edc745be844b6c367c227b59029b73c4182f508f90cc47e21816`;
  main 5.6.3, 121 files,
  `e674b5dc4dac50f6e91be30094aeea983a1f340231717e62b0b6199ae3049eb2`.
- The existing ETW environment rejection remains before API loading in full,
  context-only and retained-certificate probes. Added
  [adversarial tests](../../test/macos-direct-probe.test.mjs) exercise explicit,
  empty and lowercase overrides through all three entry modes, and insertion at
  the default relative loader location. Every case rejects before the owned
  module executes. Canonical package membership covers the default location;
  strict caller `TS_ETW_` identity is unchanged. The historical counterexample
  concerns the earlier **unreleased** 5.5.2 candidate, not a demonstrated defect
  in a released compiler contract.

### Reliability review and local validation

[PR #7](https://github.com/msiric/redue/pull/7) HEAD remains
`a19d17ecc660a36982b16c6c4347c5bf5eaa67ab`. Review found no new correctness blocker:
stdin is consumed asynchronously, checked against the existing 8 MiB limit while
receiving, and parsed/validated only after EOF. Parent certificate timeout remains
10 seconds. Compiler membership, retained filesystem queries, observation and
receipt-selection guards remain authoritative; failed certificate validation
falls back to established discovery. Opt-in diagnostics do not grant applicability.
The reproduced defect was synchronous input consumption; the deeper Node/libuv
cause and universal tail reliability remain unproven. Its existing separate
[package matrix](https://github.com/msiric/redue/actions/runs/37643135167) and
[full CI](https://github.com/msiric/redue/actions/runs/37643333839) passed.

Combined local validation on macOS/Node 22.13.0:

- Focused compiler/EOF/certificate/ETW tests: 5/5 PASS for 5.6.3 and 5/5 PASS for
  isolated 5.5.2. Includes malformed/incomplete/oversize input and changes before
  EOF. Existing delayed newer-FAIL and observation-gap coverage is retained; its
  full daemon tests have not been rerun under this constrained host.
- Shared mechanics/input/receipt/incomplete-write/evaluation-gate tests: 42 PASS,
  3 platform skips, zero failures. The gate now recognizes an explicit STALE
  precondition without accepting CURRENT or UNVERIFIED as its substitute.
- Exact tarball installs through npm into an owned disposable prefix. All 62
  intended files match packed source; no acceptance fixtures, local state or
  private paths are included. Help/version, real project compiler installation,
  direct-recipe preview/init, Codex/Claude setup, doctor, idempotency, edited-block
  refusal, preserving user text during removal, and uninstall PASS. Doctor does
  not claim behavior verification. No owner/friend installation was changed.
- Combined full observer/package workflow and Linux/native-Windows CI: **NOT RUN**.
  Remote main and both PR heads were verified with read-only GitHub access, but
  CLI network access failed and the merge tool returned
  `MCP tool call requires approval, but approval policy is never`.
  No alternate mutation route was attempted after this explicit denial.

### Fixed handoff plan and observed host preflight

The retained debugger checkout/revision, canonical state directory and exact
socket were checked against its product ownership record before applying the
approved session-only profile. No other fixture's permissions were reused.
Codex 0.160.1 was retained, with the managed proxy, other socket/network denials,
and sandbox unchanged; no credentials or global settings were copied or changed.

Predeclared maximum: eight independent ephemeral model sessions, 180 seconds each,
no score-driven retries: A relevant pending change requiring recorded verification;
B unchanged handoff; C unrelated documentation; D relevant source change;
E handoff of new evidence; F explicit fresh execution; G independent eligible
repeat; H stopped-observer negative. Ordinary task prompts and local trace plans
are retained. The [fail-closed gate](../../test/acceptance/agent-trial-gate.mjs)
must establish each case's specific condition before launching a model.

The exact installed-candidate access preflight failed **before executing REDUE**:
Codex exited 1 with `failed to start managed network proxy: failed to build network
proxy: reserve managed loopback proxy listeners`. The gate recorded
`HOST_BOUNDARY_UNAVAILABLE`, `launched: false`. A preceding sandbox capability
check had also returned `sandbox_apply: Operation not permitted`. The written
owner approval did not remove these host-enforced restrictions. No weaker profile,
proxy bypass, new state identity or unsandboxed model execution was attempted.

All A–H model trials: **NOT RUN**. Agent-visible eligibility, actual reuse,
equivalent executions, model overhead and combined verification-cycle economics
are therefore **NOT MEASURED**. No unsafe-reuse claim is drawn from zero attempts.
Claude and cross-host behavior also remain NOT RUN. The 17 historical runs and all
26 existing state files were byte-checked unchanged; the observer remains stopped.
Owned disposable installed packages were uninstalled; no model/observer was started.

### Release and next decision

Public main is still `c9328ae1d641b12e7ca369ad663f91e9b16fb098`. Frozen alpha.7 bytes
remain unchanged and were not published in this pass. Fresh registry metadata
could not be retrieved (DNS `ENOTFOUND`); the last verified alpha.6/alpha.5 alpha/latest
tags are historical, not a new live assertion. Prior alpha.7 authentication failure
remains documented with its frozen artifact; no retry loop or version substitution.

Recommendation: retain PR #8 as draft and do not publish the combined artifact.
PR #7 needs its authorized merge through a host context that permits that action;
the prepared coverage commits need push/combined CI, then the same fixed handoff
in the approved native execution context. One next product priority remains the
**complete real-project verification-cycle evaluation**, not more coverage or
instruction redesign. A coherent follow-up version (provisionally alpha.8) must be
checked unused and separately approved after those gates; this alpha.7-labelled
evaluation tarball must not substitute for the frozen guidance release.

## Prior guarded coverage evidence (separate, not combined acceptance)

Final source review found and rejected the 5.5.2 API ETW module override before
loading; the earlier unguarded artifact is superseded and must not be released.
Twelve current public HEADs were screened before selection. Two ordinary locked
npm installations were measured/checked; only one new compiler implementation is
being admitted. No scripts, compiler versions, dependency layouts or verification
options were changed to make a project fit. This is compiler evidence, not
application/tests.

The reviewed guidance and completed model comparison are separate:
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
browser downloads used an owned disposable cache. Neither verification
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
not claimed as compiler savings. The final candidate workflow is measured below; CURRENT queries alone do not
establish saved runs.

The HyperFormula current locked 4.0.8 project also installed normally and its
standalone check passed, but qualifying it would require a second implementation
review. It remains excluded in this pass, not counted as a product adoption.

## Installed candidate workflow and economics

Final guarded runtime `e0753244c7b9cd999574d18d1966f1ce3aa2e97a`, tarball SHA-256
`8fba4a9e87d3de05e52ffe40b533f42484c8ef8be64d05a5dee9fb5fa4b2908b`.
This unreleased artifact is not the alpha.7 guidance release artifact despite its
inherited version field. The exact same bytes passed the
[macOS/Linux/native-Windows package matrix](https://github.com/msiric/redue/actions/runs/37645605913),
including the added 5.5.2 case and existing upgrade/policy/other-compiler cases.
[Full regressions](https://github.com/msiric/redue/actions/runs/37645866411) passed:
macOS Node 22 and Windows Node 22 each 107 passed/16 skipped; Linux Node 22
108 passed/15 skipped; Linux Node 24 also passed. No failing tests. The following
test-only capture correction has separate local 4/4 acceptance and no packed
file changes; a fresh CI run checks the final review HEAD.

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
| Initial wrapped run + sync | 1 | 4635.8 | 4635.8 | 4635.8 | 4635.8 | 4635.8 |
| Cached status (conservative UNVERIFIED) | 10 | 60.3 | 59.3 | 64.9 | 65.7 | 602.6 |
| Unchanged synchronized decision | 10 | 407.9 | 396.3 | 412.2 | 515.0 | 4078.6 |
| Unrelated-edit synchronized decision | 5 | 460.8 | 400.1 | 565.6 | 565.6 | 2303.9 |
| Relevant edit: sync + required run + sync | 3 | 5964.1 | 6008.5 | 6051.9 | 6051.9 | 17892.4 |
| Stop + start + first sync | 3 | 2044.7 | 1963.0 | 2234.7 | 2234.7 | 6134.1 |
| First sync alone after restart | 3 | 468.8 | 432.5 | 572.8 | 572.8 | 1406.3 |
| Explicit fresh wrapped run | 3 | 4430.3 | 4373.7 | 4645.0 | 4645.0 | 13291.0 |

Unchanged decision/ordinary-compiler median ratio is 0.191: about 1.67 seconds
less CLI work per *potential* reuse opportunity in these separate measured paths.
Initial wrapped execution itself cost 4,243 ms; its compiler invocation was roughly
2.05 seconds in the earlier instrumented run. Recording and relevant-change workflows have real overhead. A user
who needs fresh verification pays it; a CURRENT query alone is not a saved run.

All ten unchanged and five unrelated queries retained baseline receipt
`c77b8b76-f1e2-4cd2-bb9f-e739b2b8f996`. Relevant changes returned STALE with historical
PASS, then new wrapped outcomes became CURRENT. All three restarts inherited
`31f9dbb0-1579-4637-a0fa-191a2f97d6c2`. No historical receipt was converted or deleted.

New-project model trials: **NOT RUN yet**. The earlier approved exact socket/state
belongs to a different disposable checkout. A minimal equivalent grant for this
checkout and its one observer endpoint was requested once. No model was launched
outside that boundary. Existing activation successes remain historical evidence,
not counted again here. Claude and cross-host behavior remain NOT RUN.

One additional real project completes the deterministic workflow; the desired
second project is not claimed. Eleven screened projects remain excluded for the
recorded gaps. This result establishes useful *CLI reuse economics*, not causal
agent-task savings or general ecosystem coverage.


## Final source-review counterexample and containment

Official 5.5.2 `lib/typescript.js` can load an arbitrary module through
`TS_ETW_MODULE_PATH` when input probes load its API (the CLI entry lacks this path).
A controlled owned module ran under the prior **unreleased** candidate's full
probe, which returned exit 0. With the guard, the same call returned exit 2,
`direct-execution-environment-unsupported`, and the module did not run. No released
5.6.3/5.9.3 defect or REDUE false-CURRENT reproduction is claimed by this test.

Qualification now rejects defined override values, including empty/case aliases,
and strictly fingerprints `TS_ETW_` so a caller cannot substitute the clean daemon
context. The environment is unchanged. The default relative loader location is
inside the pinned compiler distribution, whose full membership must match.
Plan/context identity changes conservatively; old candidate evidence needs a fresh
baseline. Source review details and adversarial tests are linked above. Final
artifact and workflow results are recorded above. The initial post-upgrade query
was made before indexing was ready and conservatively returned no check rows; it
is not counted as an applicability result. A fresh baseline then established the
final guarded measurements. All 36 recorded sequences completed successfully, including the separate
source-restoration baseline. No poor result was discarded.


## Historical attempts and harness corrections

- Pre-ETW-guard runtime `9d61c5f`, artifact
  `6295cf9779e86a0226f3d58192505f62335914e916a45b4dcd92b077312214db`:
  unchanged CLI median 379.3 ms, max 401.1 ms (n=10), no failed measured
  sequences; installed three-platform acceptance passed. Superseded by the
  loader guard; not release evidence for the final runtime. Local raw rows and
  receipts retained. They are not added to the final sample count.
- Node 24 CI exposed a nested-test reporter assumption, not compiler failure.
  The isolated 5.5.2 suite now requests TAP explicitly and still checks its
  nonzero test count; the corrected Node 24 run passed.
- [CI 37644238002](https://github.com/msiric/redue/actions/runs/37644238002)
  failed one macOS assertion: the second query after an injected gap had already
  reached STALE instead of UNVERIFIED. `observationGap()` publishes uncertainty,
  then schedules deterministic recovery after 100 ms. The test discarded that
  first response and asserted the later query was still uncertain. The harness
  now retains and strictly checks the gap response, independently requiring the
  recovered query to detect the deletion as STALE/PASS. No runtime or expected
  semantic state was relaxed. The separate failed-reconciliation test remains
  strictly UNVERIFIED while reconciliation is unavailable.
