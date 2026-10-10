# Portable evidence resume

Read canonical [REDUE-PE-001](portable-evidence.md),
[tracker](portable-evidence-tracker.md), [decisions](portable-evidence-decisions.md)
and [independent review](../acceptance/portable-boundary-review.md). Resume the
existing `/Users/mariosiric/Documents/redue` worktree on `dev/portable-evidence`;
verify HEAD/status first. The planning baseline is history, never a rollback target.

**Current conclusion (2026-10-11): same-machine installed @2 mechanics pass;
hosted origin/runtime preconditions fail conservatively. No actual portable model,
matched-machine recipient or live authenticated CI acceptance is established.
G1 technical slice only; G2/G3 incomplete; G4 prepublication NOT READY.**

## Source, owners and approval boundaries

Verified root commit `70d54201d8c0bffd8dcf0354de7ac8e99829daee`; remote task branch
`2bc636acf96b8652ff9dcac1d3aa846a3a9532d2`. Reviewed bounded runtime/probe
diagnostics `57c3a3d`, native profiling test and platform fix `274fb42` are committed
but are not in the preserved exact 2bc artifact. Root70d5420 includes independent
C review; the verified integration tree is clean. Root owns shared CLI/daemon/facts/runtime/catalog; B owns
envelope/store/CI authentication and focused Windows test correction; C owns independent
critical-boundary review/adversarial tests; D owns onboarding/host and machine
helper reporting. Isolated worktrees remain `../redue-portable-import`,
`../redue-portable-review`, `../redue-portable-onboarding`. One writer per interface.
Draft [PR12](https://github.com/msiric/redue/pull/12), tracker issue11. No force push,
main merge, release tag or npm publication in this milestone.

Day0 **2026-10-10 21:24 UTC**; first substantive calibration2026-10-13 21:24UTC.
$0 additional daily/total spending for first72h, approved included capacity only.
Standard public macos-26 VMs and **10MiB included artifact storage/one-day retention**
are approved; current active4,449,062 +5MiB signer +512KiB package =10,216,230 bytes <10MiB;
serialize and recheck before uploads, no blind reruns.
Exact signing workflow proposal SHA-256
`5770b7f0ac9133fbf0190cf0e238ac800263b632d7f4741f3fddb04882591924`
is approved/enabled. That is not producer trust; exact current producer acceptance
policy still needs owner approval. Receiving-agent machine/resource question and
Claude **PENDING_OWNER_ACCOUNT** remain pending; do not ask again or launch models
until that specific in-context precondition passes. External natural use NOT STARTED.

## Exact artifact and actual results

Preserved candidate `.local/portable-evidence/candidates/2bc636a/redue-cli-0.1.0-alpha.10.tgz`,
SHA-256 **10ab71da58cd805010900a610b2ce0cb50adee375d697e898d90b8e049c0d71b**.
This is not public alpha.10 despite unchanged metadata. CI downloaded package
bytes have the same verified SHA; actual PR-merge source
`8d1f5d14dad3891f80f315178cc93c58e2c10e18` and 2bc636a share tree
`529d706f3eafa4bfcb970c11aeacef46dfc317db`. Do not regenerate or silently substitute it.

- Actual installed output `.local/portable-evidence/installed-2bc636a.log` PASS:
  controlled noLib TypeScript5.6.3 origin/export/import on one macOS machine,
  independent checkout and no recipient run. Origin
  `9d6870ed-0bf3-4acd-9248-fcbb96c50fc5`; evidence digest
  `83560d36ec9783697e61ee8a2b513304bae7d77f9d3c5b2e258f334838ce6c66`.
  Recipient/unrelated edit CURRENT/PASS eligible; relevant edit STALE/non-reusable.
  Both-host intact policy update/idempotence/removal and edited-content refusal
  PASS. No models. Single observations: wrapped11,236ms; recipient5,682ms;
  unrelated5,454ms; relevant5,724ms. Not complete-path economics/net savings.
- Signed route `38094702115`: actual producer selected local CURRENT/PASS but
  immutable portable origin incomplete, `PORTABLE_PROBE_TIMEOUT`. The launch
  established ETIMEDOUT at unchanged 10-second parent deadline; internal phase
  remains unknown. Stable interval/coverage true, facts missing. Signer skipped;
  no authenticated candidate or receiver/model trial.
- Profile `38094703930`: actual labels/native inventory MATCH, both
  `prototype.supported: false`, `PORTABLE_RUNTIME_UNSUPPORTED`. Inventory is not
  complete runtime profile acceptance. No compiler/current evidence was inferred.
- Exact package `38094703938`: Linux/nativeWindows PASS; macOS portable FAIL at
  export complete-origin assertion line102. Its different VM did not expose the
  same timeout diagnosis, so do not inherit the signed route's cause.
- Product `38094703929`: Linux22/24/macOS PASS; Windows has two test failures,
  established as workflow-byte CRLF conversion and POSIX-only expected-path text.
  B's focused `5d486260cb868afba7501d993ff7b2d727e6bbfc` forces LF only for the
  two exact signer files and uses native `path.join` in the assertion. Root and independent C frozen control suites14/14 PASS;
  D source GO/upgrade3PASS, its earlier signer attempt could not load missing yaml.
  Separate archive test command was host-rejected before execution; no bypass or
  independent14PASS claim. Native CI pending. Exact-package Windows success is a
  distinct route, not product acceptance.
- Full coherent archive `59009f8e6ab66c70162871ab10a40da8cfb58ea9`: 314 tests,
  297 PASS/one FAIL/16 skips. Failure was test field selection (`reason` human text
  versus structured `reason_code`); independently reviewed correction committed.
  C independently ran the corrected copied-Node target on frozen
  `2beab5e8a4df80cd351402c27a915c7750d6841d`:1/1 PASS43,121.49ms, origin
  `4406bef3-dad6-4448-942b-e9b12aaff614`, digest
  `d4d912e62f94ab86987654fe796033791eee5d9b1834f9ff82a1d9c2eb2ae789`.
  Do not replace the old full failure with a full rerun/PASS claim.
- Bounded runtime profiling test:1/1 PASS8.095s,
  `.local/portable-evidence/portable-profile-actual-author.tap`; independent C
  source review GO for bounded diagnostics, now committed57c3a3d/70d5420; not hosted execution certification. Local timing does not identify the hosted internal phase.

## Next commands and fail-closed gates

1. Verify actual root HEAD/uncommitted changes and current resource reservations.
   Read protected local `signed-producer-2bc636a-failed.log`, `profile-2bc636a.log`,
   `package-2bc636a-failed.log`, `regression-59009f8.{json,tap}` selectively;
   never dump raw environment/private paths or transcript data publicly.
2. Complete reviewed diagnostic integration and native CI for B's LF/path test
   correction; retain the completed target rerun separately from old full results. Commit coherent
   reviewed changes normally. Do not relax deadlines, runtime restrictions,
   continuity/selection barriers or treat local CURRENT as complete portable origin.
3. Use the newly bounded phase capture for one justified diagnostic attempt only
   after evidence review and reserved storage confirmation. Two materially
   different failed approaches require review before further retry. Preserve all
   actual failed origins and signer skips; no model trial follows a failed gate.
4. Receiving-agent resource and Claude approval are already requested. Until usable,
   continue independent deterministic review/onboarding work; do not provision,
   change managed policy, purchase capacity or copy credentials. Actual G2 model
   reuse still requires independent sessions, agent-visible eligible JSON, retained
   digest/run and no equivalent execution.
5. Producer trust remains a separate explicit owner decision after exact source,
   workflow/signature/subject identities exist. Workflow enablement alone never
   accepts an artifact. Live CI authentication requires the current owner-local
   registry at all publication barriers, never an imported policy or old approval.
6. After a coherent source/review change, create and validate new exact bytes only
   when justified. The preserved 2bc artifact and prior @1/b4 candidates are
   historical sources, not replacements for a final candidate. Use the existing
   [installed checklist](../contributor/portable-installed-checklist.md) and
   [V01–V22 pointers](../contributor/portable-acceptance-map.md). Main/publication
   gates still require owner approval and remain incomplete.

## Preserved history and scope limits

The tracker retains earlier run38093305258/38093307269 failures and preliminary
b0/b4/@1 bytes, installed upgrade fixture failures/corrections and independent
receipt/trust/caller/origin controls. Existing handoff/pilot installations/receipts
remain untouched. Do not repeat the project screen, change ordinary projects to
noLib, reinterpret @1 facts as @2 or copy observer authority.

Current @2 source profile binds official Node22.13.0 content, DarwinARM64/release
25.6.0, reviewed OpenSSL and complete native dyld/cache content. Raw caller facts
stay immutable. Ordinary default-library ancestor queries outside the observed
root remain unsupported. No two-machine, cross-agent, whole-task speedup, complete
latency reliability or external-adoption claim follows from one-machine mechanics.
Day14/28 targets remain evidence-based and conditional; do not reset Day0 or wait
for a checkpoint when safe independent work is available.
