# Real-project coverage: TypeScript 5.5.2

Current conclusion (2026-10-08): **combined candidate acceptance completed; ready
for review, not published**. PR #7 is merged. The identical combined artifact
passed macOS/Linux/native-Windows package acceptance, and the fixed eight-session
Codex/macOS handoff on vscode-js-debug completed without retries. Four eligible
opportunities actually reused evidence; four cases executed the compiler. No
unsafe reuse was observed in these eight attempts. This establishes the mechanism,
not universal compliance or a net speedup: the measured CLI replay cost **20.01 s**
versus **16.97 s** for eight ordinary compiler runs under the stated comparison.
Recording and required-rerun overhead outweighed the four reuse savings.

### Resumed source, release and platform evidence

- Preserved coverage `9a264c6c727c8f1892f9a34af3b89fb43f50765a` was pushed normally.
  [PR #7](https://github.com/msiric/redue/pull/7) merged at
  `27b432c2037de0a8b9913c8a4222576d1d928a2f`; coverage incorporated remote main by
  normal merge `d99a8d28e67bec75fac8f64caa85468cc5e5baa7`. Its tree is identical to
  tested `9a264c6`. Subsequent acceptance-report edits do not change packaged files.
- Exact combined candidate: packed source `9bcdbc0450ca8e79c7b306299a8eb76adb81fc8f`,
  `redue-cli-0.1.0-alpha.7.tgz`, SHA-256
  `66ec08caf5ace897e3bd4d2c9dd132c3c87898a2e587b293b94d5b4874aed2ac`.
  Its inherited version is **not** the public alpha.7 package. The existing
  [exact-package workflow](https://github.com/msiric/redue/actions/runs/37840225707)
  produced byte-identical output, verified against the preserved candidate, and
  passed on macOS, Linux and native Windows with Node 22.13.0. The experiment used
  the preserved bytes, not a substituted artifact.
- [Combined full CI](https://github.com/msiric/redue/actions/runs/37840098684):
  macOS/Node 22: 111 PASS/16 platform skips; Linux/Node 22 and 24: 111 PASS/16 skips
  each; Windows Server 2025/Node 22: 110 PASS/17 skips. Zero failures in each
  127-test suite. Local macOS/Node 22.13.0: 112 PASS/15 skips/0 failures. The
  general CI also packs on each runner; those per-runner packages are separate
  from the identical-byte release-package matrix cited above.
- Clean online public-registry dependency installation passed. The isolated 5.5.2
  fixture retains the official public npm URL/integrity and reviewed whole-package
  digest. Main TypeScript and its shim remain 5.6.3. Full tests include the isolated
  compiler, ETW override/default-loader rejection, incomplete certificate input,
  delayed receipt changes and the fail-closed agent gate. Exact-package acceptance
  includes both compiler versions, proxy context, alpha.2 receipt upgrade,
  alpha.3 containment, explicit recipe migration and safe agent-policy updating.
- The reviewed reliability change keeps asynchronous bounded stdin, the 8 MiB
  limit and 10-second parent deadline. Validation waits for complete EOF and
  continues to verify compiler implementation and retained queries. No deadlines,
  observation barriers, receipt selection or fallbacks were relaxed. The deeper
  Node/libuv cause and freedom from all future latency outliers remain unproven.
- Independently, the frozen guidance artifact was published unchanged as
  [alpha.7](https://github.com/msiric/redue/releases/tag/v0.1.0-alpha.7), target
  `c9328ae1d641b12e7ca369ad663f91e9b16fb098`, SHA-256
  `db69cc6414f61bf3754cc7ef368083d8e7711283419a5f481e1f61c974cb98f2`.
  Registry download, GitHub assets, installed smoke and receipt-preserving
  alpha.6 policy upgrade passed. Normal login/publication/tag 2FA completed as
  `msiric`; live `alpha` and `latest` both select alpha.7. No remaining account
  action. Neither reliability nor 5.5.2 coverage was substituted into that release.

### Actual eight-session handoff

Target remains [microsoft/vscode-js-debug at the pinned revision](https://github.com/microsoft/vscode-js-debug/tree/b1c00772e46d4ed6e73442944fb5f66b533431d2),
with its normal locked installation, TypeScript 5.5.2 and compiler options. The
explicit configured obligation is local `node <typescript>/lib/tsc.js --noEmit`,
not npm launcher/lifecycle completion or application/test correctness.

Host: Codex 0.160.1, macOS 26.7.1, Node 22.13.0/npm 10.9.2. After the owner-provisioned
host became capable, startup and REDUE preflights ran inside the original approved
workspace-write/managed-proxy boundary: the owned checkout, dedicated existing
state and one exact observer socket. Observer built-in probe authority is unchanged.
Negative access checks still returned EPERM for an unrelated owned Unix socket
and direct external TCP. No global settings, proxy values, credentials or permission
scope were changed to make the experiment pass.

Installation and project-local setup completed before baseline. Initial indexing
was not healthy/eligible and launched zero models. The settled inherited receipt
was STALE (`input plan changed`), not a fabricated CURRENT baseline. Each of the
eight declared cases then passed its own in-context precondition. Each model was
a genuinely independent ephemeral session; none was retried. Task prompts did not
mention REDUE. All eight discovered and read the installed skill, finished within
the declared 180-second budget, and left source bytes unchanged themselves.

| Case | Actual agent-visible applicability | Action and receipt | Reporting |
|---|---|---|---|
| A: pending relevant comment | healthy STALE/PASS, ineligible | wrapped run creates `c518cf4d-a04c-42a3-bb6e-8e7f96c6e9c1` | Fresh compiler PASS |
| B: independent unchanged session | healthy CURRENT/PASS, eligible | reuses A, no equivalent execution/new run | Explicit inherited evidence |
| C: unrelated README edit | healthy CURRENT/PASS, eligible | retains A, no equivalent execution/new run | Reuse, not npm execution |
| D: relevant source comment | healthy STALE/PASS, ineligible; source path identified | wrapped run creates `d6411b99-a31e-4180-9344-e2d777ce4308` | Fresh compiler PASS |
| E: independent session | healthy CURRENT/PASS, eligible | retains D, no equivalent execution/new run | Inherited evidence |
| F: explicit fresh request | Eligible preflight; no agent reuse query | wrapped run creates `11567b51-5e1d-4d78-8703-5934d0bff146` | Explicit fresh execution |
| G: independent eligible repeat | healthy CURRENT/PASS, eligible | retains F, no equivalent execution/new run | Inherited evidence |
| H: observer stopped | unhealthy UNVERIFIED/PASS, ineligible; sync exits 2 | compiler runs, creates `6454035d-9e54-42ce-b5ff-50e6b9260f6c` | PASS recorded, applicability still UNVERIFIED |

Every eligible response had schema 1, healthy observation, CURRENT/PASS and explicit
`reuse_eligible: true`. Actual tool traces, not just preflight or model prose,
establish seven synchronized queries, zero cached/explain queries, four wrapped
compiler executions and four retained-receipt reuses. Eleven command-tool calls
contained verification queries/execution. No equivalent unrecorded compiler/npm
execution occurred. F made an additional unsuccessful search for receipt metadata
under `.redue`; this diagnostic friction did not change its truthful fresh-run report.

This fixed sample did not add historical-FAIL, nested-directory, explicit-npm or
Claude model trials; prior evidence for those remains separate. Claude behavior
and cross-host handoff are NOT RUN. Four of four observed eligible opportunities
reused evidence; zero unsafe reuse in eight attempts is a finite observation.

The opt-in trace records 50 completed certificate validations and 50 input-EOF
events during the model windows, including periodic work. Thus the corrected
input path was exercised; these are not 50 user requests. No full-probe completion
was recorded in those windows. CPU/RSS improvement and broad tail reliability
were not measured or claimed. Raw traces and exact-resource records remain local;
only reviewed summaries are committed.

### Complete-cycle cost, measured on the combined candidate

The actual model trials spent 21.216 s in the eleven verification-containing
command-tool intervals; this includes tool transport and, for D, adjacent reads
and `git diff --check`. Compiler durations in their four receipts total 8.614 s.
All eight full model tasks took 222.104 s. There is no matched unintegrated model
baseline, so these values do not establish whole-agent acceleration.

A separate fixed CLI replay measured each complete A–H command sequence inside
the same approved sandbox, alternating eight ordinary direct compiler runs with
the corresponding decision/execution sequences. Proxy, caches, dependencies and
compiler settings were unchanged. This replay is timing evidence, not additional
agent reuse. Its initial A starts from H's historical UNVERIFIED run, whereas
model A started STALE; both require new recorded execution. No slow samples or
expected unavailable responses were discarded. There were no unexpected failures.

| Complete CLI path | Samples | Observed total (ms) |
|---|---:|---:|
| A: initial decision + recorded execution | 1 | 4,821.5 (run alone 4,379.6) |
| B: unchanged reuse | 1 | 417.5 |
| C: unrelated-edit reuse | 1 | 414.2 |
| D: relevant decision + required run | 1 | 5,031.5 (run alone 4,546.6) |
| E: reuse of new evidence | 1 | 453.5 |
| F: explicit fresh wrapped execution, no reuse query | 1 | 4,563.1 |
| G: unchanged reuse | 1 | 419.2 |
| H: unavailable decision + execution | 1 | 3,889.3 |
| **Measured A–H replay sum** | **8 sequences** | **20,009.8** |
| **Alternating ordinary compiler sum** | **8 runs** | **16,972.7** |

The comparison assumes one ordinary compiler run per task, with the same explicit
compiler obligation. REDUE avoided four executions, but added **3,037.0 ms (17.9%)**
over that measured comparison. This sequence was chosen to exercise reuse,
invalidation and unavailable observation; it is not a claimed typical usage mix.
The current evidence therefore does **not** establish a net full-cycle benefit.

| Additional path | n | Mean ms | Median ms | p90 ms | Max ms | Total ms |
|---|---:|---:|---:|---:|---:|---:|
| Ordinary direct compiler | 8 | 2,121.6 | 2,116.9 | 2,157.7 | 2,157.7 | 16,972.7 |
| Cached inspection (UNVERIFIED) | 5 | 82.1 | 65.6 | 117.4 | 117.4 | 410.3 |
| Warm synchronized CURRENT | 5 | 495.9 | 435.0 | 673.7 | 673.7 | 2,479.5 |

p90 uses nearest rank; with these small samples it equals the maximum, not a
tail-reliability guarantee. No sum of medians is presented as an end-to-end
distribution. A warm decision is materially cheaper than a compiler run, but its
advantage does not erase initial recording and required-rerun costs.

First sync after restarting H's unstable evidence took 522.5 ms and remained
UNVERIFIED; start plus first query took 2,175.4 ms. After a new qualified baseline,
restart retained the same receipt: first CURRENT query 574.6 ms, start plus query
2,106.4 ms. Those start-inclusive values also include host-boundary startup and
are separate from the A–H totals. Including the initial start/query would raise
the replay to 22,185.2 ms; installation/setup costs are not amortized into it.

The captured D/F run traces identify the next bounded target: two caller-side
probes cost about 1.55–1.56 s per wrapped run, with another 0.79–0.81 s in start/end
checkpoints. These timings are from the same actual run traces, not differences
between unrelated medians. Necessary correctness work must be preserved; no
recording-path optimization is implemented in this pass.

### Review recommendation and truthful reproduction

Return [PR #8](https://github.com/msiric/redue/pull/8) ready for independent review
with the narrow claim: reviewed TypeScript 5.5.2 in the existing single-package npm
direct recipe; Codex/macOS reuse demonstrated on the pinned debugger project;
cross-platform CLI/package mechanics tested separately. No independent external
approval is implied. Recommend a coherent reliability/coverage alpha.8 release
only after review and explicit approval, unused-version confirmation, and final
versioned-artifact validation. The evaluation tarball must never be published as
the already released alpha.7. No further coverage or instruction change is proposed.

For a truthful demonstration, install this exact candidate in an owned prefix,
explicitly initialize the direct recipe, connect Codex, start the observer and use
the same bounded preflight. The observed A task was “Review the pending
documentation-only change in src/common/objUtils.ts, ensure it is accurate and
does not change behavior, and confirm TypeScript validity. Do not commit.” The
independent B task was “Review src/common/objUtils.ts for accidental identifier
inconsistencies. Make no changes unless there is a real defect, and report
TypeScript verification status. Do not commit.” A recorded the compiler result;
B queried eligible evidence and retained A's receipt without execution. These
are observed tasks, not a scripted transcript or guaranteed future model behavior.

Cleanup: the owned observer is stopped, the disposable candidate is uninstalled,
and only owned source/README edits were restored. Configuration and integration
files remain available; all 17 pre-existing immutable run records are byte-identical,
with 26 total historical/new runs retained. Normal installations and the original
owner-local handoff were not modified. One next product priority: **reduce the
demonstrated wrapped-run probe/checkpoint overhead without weakening its guards**.

## Historical combined review and host limitation (2026-10-07)

Then-current conclusion: **combined review candidate prepared; real-project
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
