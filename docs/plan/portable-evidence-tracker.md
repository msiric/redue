# REDUE-PE-001 execution tracker

Canonical scope and gates: [portable-evidence.md](portable-evidence.md), revision1.0, with the explicit owner-approved demonstration-pair amendment D4
recorded in [decisions](portable-evidence-decisions.md). Applicability/trust gates are unchanged.


## Current checkpoint — exact request accepted; foreground completion remains unknown

2026-10-15: [run38661085164](https://github.com/msiric/redue/actions/runs/38661085164)
used reviewed workflow3eb677a/runtimebc50a9f, attempt1. Owner prerequisites and331
source/mock tests passed; normal environment review was used. Independent DIR138
ACCEPT_SCOPE confirms UNKNOWN/FOREGROUND_RAW_OR_RENDERED_RESULT_UNAVAILABLE.
At least one canonical bounded tool request and a matching result envelope reached
foreground validation. The report does not distinguish absent/malformed raw result,
unsupported fields/flags, renderer disagreement or invalid witness metadata. It
establishes no accepted helper completion or native enforcement. Native exit0 and
reaping were observed (8.583s native,17.828s controller); no timeout, one helper build,
all before/after currentness guards passed and owned cleanup completed.

Report4,238 bytes SHA256
`56b473611df30550cc37d74ba6f9d6b8a950c3e9e7294421edfb183ad6789191`;
redacted execution log324,062 bytes SHA256
`60ab6dec2f2df3ce7bb05dfe9b84400e48abc942726e9b3ce26b1db3bab92fac`.
Raw model frames/error text were deliberately not retained. Eight independent pure
controls validate the interpretation's limits; no actual failed operand is inferred.

Next: bounded DIR139 pinned-source review and DIR140 static foreground-refusal
classification, with unchanged acceptance predicates/access order and fresh review
before any further operation. No additional native run is queued. Earlier scoped
six-check prerequisite remains closed; this new witness is not G2/seal/reuse.
Copilot included Actions capacity remains separately pending. G0partial/G1–G4
incomplete, alpha.11 unpublished, fixed pilot and immutable evidence preserved.

## Historical checkpoint — exact witness input reviewed; one changed-procedure attempt ready

2026-10-14: [run38636497478](https://github.com/msiric/redue/actions/runs/38636497478)
used workflowd968/runtime2ca, attempt1. Independent133 ACCEPT_SCOPE retains
UNKNOWN/NATIVE_TOOL_SCOPE: COMMAND_MISMATCH at tool item1, with no prior accepted
request. Native spawn/close/reap and exit0 were observed; native6.286s/controller
13.701s. Currentness guards passed, one helper was built and owned cleanup completed.
The actual requested command was deliberately not retained. Its mismatch cause and
helper execution remain unproven; exit0/cleanup are not enforcement evidence.
Report SHA256 `c03612bf1446182c77d9cc0a4acd4c71b576a5d240623b5a9681f457285f89c7`;
log321,457 bytes SHA256
`00aec7bc498dd240ec23ad8f62790938ab716088bc23a9e02b61b7be53e1ce9a`.

DIR134/135 ACCEPT is integrated/pushed as runtime
`bc50a9f1111625151a3c805f050a718bfe8252d6`. The witness-only prompt supplies exact
JSON tool input (unchanged quoted command, timeout15000); generation and full argv
validation share the same private selection. Old prompts/argv, accepted command,
permissions, context, guard order, limits and cleanup remain unchanged. Reviewer139
supplied+9 independent source/pure-mock controls pass. Root139 focused PASS and1055
shared PASS/1 optional C-build SKIP; three shared controls use owned temporary files.
Shared579.514ms, TAP SHA256
`4b6ceb0248e9ee0ff42615618df792bb78d8820dae7ef2256786164349853846`.
These tests establish neither native enforcement nor why the earlier command differed.

DIR136/137 workflow ACCEPT is pushed and remotely verified at
`3eb677ac828a3f74c3c9bb43e3375b0598db6126`, file SHA256
`f374643783b8d3562f72b1c0a58dea8f203bbfd496f8d0a53b44aa98338d9382`.
Only two runtime pins changed. Root9 source/mock/syntax and reviewer8 source/pure-mock
controls pass. Protected source alone is aligned; original owner review timestamp
2026-10-14T19:26:03Z is preserved. Input provenance validation passes, digest
`e5c329910465c0a94a5dea1ebbed40a1a236cc1bd151084f3568349f719d453a`.
No secret value was accessed; no signing/trust/access/spending authority expanded.

Next: one NEW normal owner Actions UI run of portable-claude-diagnostic.yml on
`dev/portable-claude-diagnostic`, not Re-run jobs. CLI dispatch403 remains unchanged
and is not retried. Collect and independently review its actual result before any
further approach; no retries for a score. This is not G2 or agent reuse. G0partial,
G1–G4 incomplete; Copilot included Actions capacity is separately pending. Earlier
scoped six-check prerequisite stays closed; alpha.11 unpublished and pilot preserved.

## Historical checkpoint — native ran; precise tool-refusal reporting ready

2026-10-14: [run38632067782](https://github.com/msiric/redue/actions/runs/38632067782)
used workflow41832/runtime7064, attempt1. Independent127 ACCEPT_SCOPE verifies
UNKNOWN/NATIVE_TOOL_SCOPE despite successful before/after currentness and native
spawn/close/reap with exit0. Native7.487s/controller19.145s, one helper build,
owned cleanup;328 source/mock tests passed. Helper execution and failed tool
subcondition are unproven; raw frames were deliberately discarded. A valid first
request followed by a rejected second request can yield this same reason. Neither
normal exit nor cleanup proves enforcement, and this diagnostic is not G2/reuse.
Report SHA256 `ae6f5922ef86aca66592a4e89b60043a99e608fb67e5344bfecc49f9177e8b5c`;
log321,328 bytes SHA256
`030b0012b6fe6f27978fe279144921a4c079953e0b00889668ac2e9f9ea26638`.

Reviewed reporting128/129 is integrated/pushed at runtime
`2ca6809061eef19ca529f30974b956944d9c091c`. It preserves every tool-scope predicate,
its order/short circuit and all acceptance conditions. Only the first static
refusal class, ordinal and prior-accepted-request boolean are added; no raw tool
names/keys/IDs/commands/descriptions. Prior acceptance is not execution proof.
Reviewer174 supplied+38 independent old/new equivalence controls pass; root174
focused and1052 shared PASS/1 optional actual C-build SKIP. Shared18-file run725.431ms,
TAP SHA256 `8e12f978895a4c4c5758c0b841906264c4258aec774fc64270e91489aa109592`.
Three shared controls use owned temporary files; others source/mocks. Actual previous
subcause remains UNKNOWN and is not retroactively supplied by these new diagnostics.

Pinned public native187 source review130 confirms timeout is optional in its schema;
omission defaults to120000ms, separately capped600000ms. Optional background and
sandbox-override booleans have no inserted defaults. Execution parses a copy;
streamed tool-input blocks retain original requested data. This does not identify
the actual failed field or justify weakening the reviewed explicit1..15000ms bound.
Native binary SHA256 remains a59a16ba4922adab7a145728f215d042184d349f5f7e72cddb7fc114250a4ce3.
Exact source spans/hashes are retained in the protected resume record, not raw code.

Workflow131/132 is independently accepted, fast-forward pushed and remotely verified
at `d968a60eb5ecba103ee424537444fedbcd551bcf`, SHA256
`28066e97bccf0ab53de66ac4bf0e3e2138f558e4d4cc8a58c370f443106d8fa9`.
Only two runtime pins changed; flags, command, credentials, four-turn/two-minute
limits, permissions and all other bytes remain unchanged. Root9 source/mock/syntax
and reviewer8 source/pure-mock controls pass. Protected account source alone is
aligned; owner reviewed_at19:26:03Z remains unchanged. Input validation passes,
fact digest `f386ab706e176fea1c6c847f187bf6eb539cd5fc2d3f5985c4bb8a2aa89c3a6c`.

Next: one NEW normal owner Actions UI run of portable-claude-diagnostic.yml on
`dev/portable-claude-diagnostic` (not Re-run jobs), normal configured review, then
actual closed/refusal result collection. This is diagnosis, not retries for a score;
no new login/account confirmation is required. Unchanged CLI dispatch403 is not
retried. No actual native attempt has used the new reporting revision yet.
G0partial/G1–G4 incomplete; Copilot included Actions capacity separately pending.
Scoped earlier Claude six-check prerequisite stays closed. Alpha.11 unpublished;
fixed pilot/immutable receipts preserved; complete portable economics unmeasured.

## Historical checkpoint — argument binding correction reviewed; new native run pending

2026-10-14: the latest hosted attempt38629169088 remains UNKNOWN before native
launch. Its exact guard report and independent122 review confirm ACTUAL_BINDINGS
refusal, selected startup-source absence passing, one unexecuted helper build and
owned cleanup. No model, native child witness, seal or reuse was demonstrated.
An independent pure reproduction established one sufficient structural defect:
required-argument metadata rejected the unchanged real argv builder's flag order.
Other actual binding conditions remain unproven; older failures are not backfilled.

The minimal correction123/124 is reviewed and integrated in runtime
`7064c3a6bbdc79823b5a5ff12de2d0b55eb6fe4f`. Only the required-list order changes;
all flag/value literals, actual invocation, ordered matcher, full argv equality,
security controls and guard short circuit remain unchanged. Tests now use the real
pure builder. Reviewer303 supplied+12 independent checks pass; root303 focused and
1011 shared PASS, with1 optional actual C-build test intentionally unselected.
Shared TAP SHA256 `55079b5617c878c30ec08da109e882e949e88d4dcfb3d86c9f44d0129c70fd87`;
three shared controls use owned temporary files; others are source/mocks.

Workflow125/126 is independently accepted, normally fast-forward pushed and remote
bytes verified at `41832e20520a26b87d9c0ced9f7aaa911126fb69`, SHA256
`74b519e67ae2f8b352d427f1eab9bc1f0eee0c95801a1d35a61ffe1070b8f189`.
Only two source pins changed. Root9 source/mock/local-syntax controls and reviewer8
source/pure-mock controls pass. Protected account fact source alone is aligned;
owner reviewed_at2026-10-14T19:26:03Z remains unchanged, input validation passes,
fact digest `be9422827a4ccdc8d5c61a0dd4f46f2b14e81a52eae91d948489e37b58d39f69`.
No secret value was accessed, timestamp renewed, or permission/trust expanded.

Next: one NEW normal owner Actions UI run of portable-claude-diagnostic.yml on
`dev/portable-claude-diagnostic` (not Re-run jobs), normal configured environment
review, then actual result collection and fresh review. CLI dispatch403 is unchanged
and not retried. No new login/account confirmation is needed. Keep four turns,
two-minute total job and$0. Failed prerequisites still launch zero models.
G0partial/G1–G4 incomplete; scoped prior Claude six-check prerequisite stays closed;
Copilot included Actions capacity separately pending. Alpha.11 is unpublished,
fixed pilot/immutable receipts untouched, portable complete-path economics unmeasured.

## Historical checkpoint — actual binding refusal and sufficient argument-order mismatch

2026-10-14: runtime `e9da40308da1011ed65c61b7ced9c3fe2b91b353` includes the
reviewed native child-binding/stdio witness and truthful partial-bootstrap/build
reporting repair. Independent113C ACCEPT:703 supplied and14 independent controls.
Root725 PASS comprises703 source/mock and22 shared controls, including3 actual
owned temporary-filesystem controls; no native/model enforcement is inferred.
TAP SHA256 `20dddb15909d78e88304c6a8f51960dc1e5d83135d1fd2f732fa1a6da41a9203`.
Initial reporting counterexamples and all prior failed/UNKNOWN attempts are retained.

Exact native workflow `cc9bd04bfc25e7d4535c792d388cb3ace682f368` is independently
accepted115C and normally fast-forward pushed to `dev/portable-claude-diagnostic`.
Remote file SHA256 `db48dd83a06092133346221eae60b56a07ef2673331dd1021eed12b1e7def0d0`
is verified. Body matches accepted proposal `b1dd7e5` after its first comment.
Root9 source/mock/local-syntax controls PASS; fresh reviewer8 source/pure-mock
controls PASS. One standard macOS job, read-only permissions, protected environment,
four turns/two-minute whole-job limit, no uploads/signing/trust changes or retries.
The credential-bearing Node parent performs the fixed C build using a compiler
child with only the literal TMPDIR environment; it must not be described as a
credential-free parent. Actual run evidence is recorded below.

Owner reconfirmed personal-Pro/no-organization/no-managed-policy/included-$0
facts in this thread. Protected statement was refreshed and read-back verified:
source `e9da40308da1011ed65c61b7ced9c3fe2b91b353`, reviewed_at2026-10-14T19:26:03Z.
Local validation of those actual nonsecret protected inputs passed; fact digest
`b2eaaf22055f5325e82f8e59473fe87512cdc9196a39ac44fbcf37ef9095390d`.
This is input validation, not hosted/native enforcement or OAuth-validity proof.
No secret value accessed; capacity/permissions/credentials unchanged. Original
expired statement is preserved privately. The owner launched the exact workflow;
root approved its normal configured pending-environment review underD8/D9.
CLI dispatch403 remains unchanged and was not retried.

[Run38624884034](https://github.com/msiric/redue/actions/runs/38624884034), attempt1,
head `cc9bd04`, checked runtime `e9da403`, completed FAILURE. Independent117
ACCEPT_SCOPE verifies one exact report: UNKNOWN/PRE_NATIVE_SOURCE_UNAVAILABLE,
4030.772ms, one helper build BUILT_NOT_EXECUTED, nativeLaunchAttempted:false,
no native spawn/observation, owned fixture removed, no reported timeout/overrun.
Prerequisite check and257 source/mock controls passed. This is not native enforcement.
The phase aggregates startup-source absence, applied bindings, native/manifest,
fixture/build/startup and activation currentness: the failed subguard is not known.
Do not infer credential failure, policy denial or source mutation from this report.
Repair118B is independently accepted119B and integrated at
`c5907db99e26ad4f1bb7255815cb42c4c3f0d15a`: closed guard labels/counts and match
booleans only; unperformed comparisons remain null. Original11-conjunct order and
f→b→s verifier calls are preserved. The first reporting candidate changed predicate
access order and was rejected; its getter counterexample/failures are retained.
Reviewer122 supplied+7 independent controls and root122 focused controls pass.
Root integrated995 PASS/1 SKIP in602.621ms:18 affected files,3 owned temporary
filesystem controls, others source/mocks; optional actual C engineering build not
selected. TAP SHA256
`238d01e8411b8718d1f6e44b9eabd9c421c2b8126758b78577bff16a195f19ea`.
No validation predicate, command, environment, timeout, permission or authority was
relaxed. The actual predecessor's precise failure remains unknown, not backfilled.
Workflow120/121 is independently accepted at
`23de199375b9939cba217dcd39edccf9a745de7c`, normally fast-forward pushed and remote
bytes verified: SHA256
`fe66d4f9dac2a31756bafd2eafc779ee87c99f7348947c43dc0d9a40bd351392`.
Only two source literals changed to `c5907db`; all other workflow bytes are identical.
Root9 source/mock/local-syntax controls PASS; reviewer8 source/pure-mock controls PASS.
Protected account statement's source alone was aligned and read-back verified;
truthful owner reviewed_at19:26:03Z remains unchanged. Actual nonsecret input
validation passes with fact digest
`fb1e1bf86a002d7b6f45169f1f0528b79aa64f9ec9a71639949c85fd801a031a`.
No credentials, permissions, trust, capacity facts or deadlines changed.
The owner dispatched the exact new workflow; root approved its normal configured
environment review. The resulting attempt is preserved below. The numeric API-ID
browser link was a coordinator mistake and is retired; use the filename URL.
CLI dispatch403 is unchanged and was not retried. Failed prerequisites still
launch zero models; all earlier failures remain preserved.
Actual log259,921 bytes SHA256
`f90f5e92f06649142db587d4a16f1152579f69c56cf4de116df886fd443cead3`;
normalized report1,727 bytes SHA256
`d8dd4049c42131da7ddfc488693adb1d21593703991efcf9b266496775f739c4`.
The extra owner-dispatched shell-preflight run38623893819 is preserved separately;
it is not the native diagnostic and supplies no new native/machine/reuse claim.

[Run38629169088](https://github.com/msiric/redue/actions/runs/38629169088), attempt1,
head `23de199`, runtime `c5907db`, completed FAILURE/UNKNOWN in the diagnostic.
Independent122 ACCEPT_SCOPE verifies the exact report: ACTUAL_BINDINGS refusal,
selected-source absence passed, later currentness verifiers uncalled, one helper
build/unexecuted, owned cleanup, no native launch or model observation.312 source/
mock controls passed; diagnostic4357.718ms. Report SHA256
`5775a3d2c9be38834f083edf7cee730260c6876706137b8bbca7f6d1186c79d3`;
log307,300 bytes SHA256
`9778acdfebbf436d24f6c6b9d384a2332fdad0d2d4e80adedd8eff21094bacf6`.
Independent pure reproduction confirms one sufficient structural failure: required
argument metadata orders setting-sources before strict-MCP, while the actual pure
argv builder orders strict-MCP/MCP-config before setting-sources. Existing ordered
matcher returns false for the real invocation; same literals in actual order pass.
This does not prove preceding binding predicates passed or that this subcondition
was reached in the actual short circuit; the previous run is not backfilled.
123 owns only the required-list ordering correction and accurate pure argv tests.
Actual invocation, matcher, full equality, permissions and all other guards remain
unchanged. Fresh candidate review precedes integration and any further operation.
No owner interaction or new login is needed during this in-scope repair.

[Public startup run38615104204](https://github.com/msiric/redue/actions/runs/38615104204)
remains scoped PASS on both independent VMs, accepted112: five fixed shell cases,
one unexecuted C helper build, zero native/model/compiler checks. That is not native
boundary, pre-main, seal, CURRENT or reuse proof. Earlier hosted six-check Claude
prerequisite stays closed within its scope. Copilot included Actions capacity is
separately pending. G0partial/G1–G4 incomplete; alpha.11 remains unpublished,
fixed pilot/receipts untouched, complete portable-workflow economics unmeasured.

Review incidents remain explicit: the earlier negative filter ran3 owned filesystem
controls despite a read-only instruction; reviewer115 initially used default shell
before reading AGENTS, with unintended startup effects unobserved. Corrected115B/C
calls explicitly use Bash without login. Neither instruction scope is OS enforcement.

## Historical checkpoint — public startup cases passed on both hosted VMs

2026-10-14: [run38615104204](https://github.com/msiric/redue/actions/runs/38615104204)
completed successfully on both independent standard macOS jobs. Exactly five fixed
public cases per job matched expected output: ROOT_A, ROOT_B, empty-present MANPATH,
Bash login and Bash nonlogin. Private currentness passed, controls were removed,
one fixed C helper was built but not executed. No native agent/model/compiler check
ran; all profile/seal/reuse authority remains false. Independent112 ACCEPT_SCOPE.
This is standalone shell behavior, not native Claude enforcement or portable reuse.

Reviewed workflow `bc1d05b83bf540f31a28ed9604ffd7618816a430` uses runtime
`52a3b7f37637fa6c1362b68ec79ecc95f114d7f4`, no storage API or uploads.
Its partial-bootstrap reporting defect was reproduced independently and repaired;
prior failures/UNKNOWN records remain unchanged. Exact evidence is in
[sealed-input acceptance](../acceptance/portable-sealed-typescript.md).

Fixed native child witness108 is independently accepted/integrated at
`d545c90e0a44890457f3e7a1f426668500f9b91e`; root623 source/mock controls PASS.
It has not executed. Next: source-only versioned native startup/foreground wiring111,
then fresh critical review before any actual native operation. No permissions,
credential access, trust, signing or recipe authority have expanded. No owner action
is currently requested. G0partial/G1–G4 incomplete; Copilot included Actions capacity
remains pending; earlier scoped Claude prerequisite stays closed. Alpha.11, fixed
pilot, protected records and immutable receipts remain unchanged/unpublished.

## Historical checkpoint — latest hosted result retained; startup basis reviewed

2026-10-14: [run38606711077](https://github.com/msiric/redue/actions/runs/38606711077)
completed with both jobs FAILURE. Receiver data is independently verified as
UNKNOWN: Bash inspection emitted invalid-instruction warnings; the separate fixed
path_helper inspection completed. No native agent, model or compiler check ran.
Producer stopped at ARTIFACT_RESPONSE_HEADERS_UNKNOWN with HTTP403; the cause is
unestablished. Do not retry or bypass either the existing dispatch denial or this
storage-route failure. Prior failed/UNKNOWN attempts remain retained.

CI-specific startup source basis100 is independently reviewed and integrated at
`de6612bf9890d1b1eb6dc685a157ba25f5f5bd7c`. Root shared acceptance:352 PASS,
comprising349 source/mock controls and3 actual owned temporary-filesystem controls;
none establishes native enforcement. A reviewer mistakenly ran those filesystem
controls despite a read-only instruction; the filter failure is recorded separately.
The local source basis remains unchanged and all native/portable authority stays false.

Fixed authentication-free observation103 is reviewed/integrated at
`52a3b7f37637fa6c1362b68ec79ecc95f114d7f4`; root357 source/mock controls PASS.
Native source edges105 establish outer login startup before sandbox-exec when no
snapshot exists, not actual branch selection or enforcement. Next: review the
storage-free workflow107 and prepare the unchanged-route native witness108.
Standalone observations cannot establish Claude's boundary; no model launches
until actual protected-workflow prerequisites pass.
G0partial/G1–G4 incomplete; Copilot included Actions capacity separately pending;
the earlier scoped Claude diagnostic remains closed. Alpha.11 remains unpublished;
fixed pilot and immutable receipts are unchanged. Details and exact evidence are in
[sealed-input acceptance](../acceptance/portable-sealed-typescript.md).

## Historical checkpoint — verified UNKNOWN report; reviewed fixes pushed

2026-10-14: run38598991001 bothFAILURE; receiver complete exact report recovered
and independently accepted as UNKNOWN data only. Producer validation phase/cause
unobserved; no producer artifact. No native/model/typecheck execution or authority.

Reviewed parser and safe second-target collection are integrated/pushed at
`ccf2847a12c09f8a2fd61409e67c3493c9ff780a`; root173 mocks PASS.
Final diagnostic workflow `5d6228dd793a03d50e8ee83eb583120539b15d9f` is reviewed,
pushed and remotely verified, SHA256
`0a695e39b25fe18c17d7a7fd17ea35b8ad6ce263b9fa74f991424c10e320b568`.
Root62 workflow controls PASS. All prior failures/UNKNOWN results remain preserved.

Next: NEW owner normal Actions UI run → dev/portable-sealed-host-preflight.
Do not retry API403, use Re-run jobs, repin startup or launch models. Collect actual
safe phase and fixed path_helper data before reviewing native startup prerequisites.
Exact evidence, source/review limits and storage snapshot are in the
[current acceptance summary](../acceptance/portable-sealed-typescript.md).
G0partial/G1–G4 incomplete; Copilot capacity pending; scoped Claude diagnostic closed;
alpha.11 unpublished, fixed pilot/receipts unchanged. No blanket native/portable PASS.

## Historical checkpoint — actual static inspection UNKNOWN; repair underway

2026-10-14: [run38586798824](https://github.com/msiric/redue/actions/runs/38586798824)
used workflow016fa017/runtimee3095472. Both independent jobs failed conservatively.
Intact version/help objects and their stdout hashes are verified; the tool reports
Apple LLVM21.0.0. Bash inspection exited0 without signal/error, but emitted stderr;
TOOL_EXECUTION_INCOMPLETE remains UNKNOWN. Actual stderr cause was not captured.

Both large logged reports are malformed (offset671859/671863); no masked bytes were
reconstructed. Direct job logs preserve the actual data; only intact prefixes and
scalar metadata were decoded. The complete Bash body/hash, later path_helper data,
final input closure and cleanup are not established from these partial records.
Producer log SHA256 `ef0afc2338be02264f4938f462a4b475ff35cf6a074789d6a842926d52865917`;
receiver `7ecfb1803cf8fb2e1cf9e827dc373e91066c59f334c9bb6c273941fd868366ee`.
The whole-run CLI log omitted these long records; no internal CLI cause is assumed.
Every failed/partial collection attempt is retained privately, not relabeled PASS.

Independent081 source review confirms ARM64 subtypeE is the valid printer spelling;
current literalARM64E parsing is incompatible. This separate format defect does not
explain away stderr. Independent082 accepts the partial interpretation and a bounded
public-data transport proposal withinD8, not any unwritten implementation/workflow.
083 owns one isolated repair: actual header columns, redacted stderr classification,
and an exact public-report file with hard storage/decompression bounds. Nonempty
stderr stays UNKNOWN; no raw stderr/environment/private files/binary copies. Existing
artifact metadata is3,980,014 bytes; two proposed payloads are capped2MiB each plus
bounded overhead, one-day retention, fresh usage check and no unrelated deletion.

Next: inspect/review exact083 source before wiring or another actual operation.
No new owner action is requested during this locally unblocked repair. Earlier same
helper builds remain scoped success. No native agent/model/compiler check executed
in this inspection job. Startup/fork behavior, loader closure, seal, actual portable
machine/agent reuse and economics remain unestablished. G0partial; G1–G4 incomplete;
Copilot included Actions capacity separately pending; closed hosted Claude evidence
unchanged. Alpha.11, fixed pilot and immutable receipts remain preserved/unpublished.

## Historical checkpoint — reviewed fixed public inspection ready

2026-10-14: actual run38579790669 built the same helper on both independent VMs;
that scoped success and the original inventory failures remain recorded below.
No helper, native agent or model executed. Independent076 ACCEPT_SCOPE confirms it.

Inspector075B atf8ba565 is independently accepted:91 mock tests plus30 independent
controls PASS. Both earlier misleading-format cases fail on the predecessor and
remain preserved. Exact implementation is integrated at runtime
`e3095472a1b701c0d6475e7e39d93b91833ef0ce`; root combined192 mock tests PASS,
TAP SHA256 `4dc452c9973c670dd6ce264673e7a63e11b7e0864821c1f1a49ba961dacfc4c6`.
Actual installed-tool compatibility, output volume and shell behavior are unobserved.

Workflow079/080 is independently accepted at `016fa017457f7bf4f9df765e9593e46a5598109b`:
40 supplied controls plus50 independent controls PASS; root40 PASS. SHA256
`037d3acd43ba2b68e8c0c075a2802bba4e45c57d806a9822f60806dcfb742ef2` is pushed and
verified remotely, with that exact runtime pin. Initial normal push failed with
remote commit_refs; remote unchanged/read checks preceded one successful bounded
normal retry. Cause was not established; no credential or alternate-transport change.

Next: one NEW normal owner Actions UI run of portable-preflight.yml on
`dev/portable-sealed-host-preflight` (not Re-run jobs). Existing API403 is not retried.
Same two standard VMs, manual actor/ref/attempt guards, read-only permissions and
two-minute limits. This job performs only the fixed tool's bounded version/help and
public-binary disassembly collection; it does not repeat the completed C build.
No credentials, model calls, target execution, uploads, cache, signing or trust change.
Job success means collection only. Unsupported options/layouts, incomplete process
or uncertain cleanup remain UNKNOWN. No automatic startup repin follows.

Collect the actual outputs, then independently inspect relevant instructions/callees.
Source strings or exit0 cannot establish behavior. Sealing, native startup/loader
protection, full profile and actual portable machine/agent reuse remain unestablished.
G0partial; G1–G4 incomplete. Copilot included Actions capacity remains separately
pending. Existing hosted Claude prerequisite stays closed in its actual scope.
Alpha.11 is unpublished; Day0, fixed pilot and immutable receipts remain unchanged.

## Historical checkpoint — actual pre-auth builds observed on both VMs

2026-10-14: [run38579790669](https://github.com/msiric/redue/actions/runs/38579790669)
used reviewed workflowf26ad105/runtimee5e90865 on two independent macOS26.6.2/25G83,
macos-26-arm64 image20260907.0351.1 jobs. Both retained inventory UNKNOWN/exit74,
so the run remains FAILURE. Both separate fixed C-build steps succeeded: one attempt,
exit0, no signal or compiler output, private currentness observed and owned cleanup.
Identical helper SHA256 `7136bbf2e7e601e61ffea1353214879815f6ba8fb5675eb9ce059905ad10df72`.
Outcome is BUILT_NOT_EXECUTED; helper/native/model/compiler-check counts are zero.
Fresh independent076 review ACCEPT_SCOPE confirms these distinct actual outcomes.

The fixed root llvm-objdump was observed, not invoked:37,016,144 bytes,
SHA256 `1dcc1432db4d828cf8cd71a84cb8d9bf63a7ca80b5eeec711a9e5f13a3f5f98e`.
Full log SHA256 `240366907cdd4198b862e128c10eb3f15f8d827ed85abf23d8f5c581be3af6df`;
reports SHA256 `864f2b9470fa2679327df901b48bef166efc4c6d9a0fa839ee8ee82b347a89d1`.
Private mode600 evidence and all earlier failures are retained.

075 owns isolated fixed public-binary inspection implementation;077 primary-source
research warns that LLVM exit0 does not prove successful arm64e disassembly.
Version/options, empty stderr, actual architecture and complete output need review;
unknown instructions/imports cannot prove shell startup. No automatic startup repin,
native launch, model, trust/signing or receipt change follows from these observations.
Next is fresh independent inspector review before one bounded actual inspection.
No new owner operation is requested while that work remains locally unblocked.

Complete SDK/loader closure, actual startup/native protection, sealing and portable
machine/agent reuse remain unestablished. G0partial; G1–G4 incomplete. Copilot included
Actions capacity stays separately pending. The closed hosted Claude prerequisite is
not repeated. Alpha.11 remains unpublished; Day0, fixed pilot and receipts unchanged.

## Historical checkpoint — reviewed runner build check ready

2026-10-14: collected [38560378792](https://github.com/msiric/redue/actions/runs/38560378792).
Both independent VMs supplied identical root CLT/compiler and SDK26.5 observations;
original guards still returned UNKNOWN. No compiler check, native or model ran.

Reviewed070 CI-only build binding and071A fixed llvm-objdump inventory are integrated
at runtime `e5e908656eac9982a01ee4381b7828d5432cacdb`. Local SDK27 behavior stays unchanged.
Root combined510 mock tests PASS with one existing opt-in SKIP; TAP SHA256
`3a7dd96599ecc24a6c60b9e6f7763274e6703ec0ac96893561f95924f9442463`.
This is source/mock acceptance, not actual build or native enforcement.

Fresh nonauthor072 review ACCEPT at workflow `f26ad10575ffe02f56c4c3fd500d557e41ee03ae`:
64 independent controls and all Bash syntax checks PASS; root17 harmless/source/mock
controls PASS. Author validation failures remain preserved. Exact workflow SHA256
`67b13adc0ca506ca570a5814108e7203eb784653c00f10ff5c1e915dc81cd795` is pushed and
verified remotely, pinned to that runtime. Two standard macOS jobs, read-only GitHub
permissions, two-minute bounds and no artifacts/cache/credentials/models remain.
The new step performs one fixed C helper build and private currentness checks; it
never executes that helper. Missing guards remain UNKNOWN; inventory failure still
leaves the job failed. Cleanup cannot confer evidence or erase an uncertain namespace.

Next: owner normal Actions UI, portable-preflight.yml → Run workflow →
`dev/portable-sealed-host-preflight` → Run workflow (NEW, not Re-run jobs).
Existing API403 is not retried or bypassed. Collect actual C build result separately
from retained inventory failures and fixed inspection-tool facts before further use.
Actual C build, tool invocation, complete profile, seal and portable reuse remain
unestablished. Copilot included Actions capacity stays separately pending; the closed
hosted Claude prerequisite is not repeated. G0partial; G1–G4 incomplete; alpha.11
unpublished, pilot and immutable receipts unchanged.

074 source assessment rejects substituting an API snapshot for the approved staged
CLI recipe: ambient System closures and deferred resolution remain unclosed; a new
API recipe would change the obligation and require a consequential owner decision.
No such change was adopted. Day0 and gates remain unchanged.

## Historical checkpoint — matching supplemental CLT facts collected

2026-10-14: [run38560378792](https://github.com/msiric/redue/actions/runs/38560378792)
completed on reviewed08d7e01/runtime6d0c6a1. Both independent VMs returned identical
structured reports. The supplemental root CLT observations completed: clang is
290,664,032 bytes, SHA256 f30550eab15fdf5ab8c0dc54c52679711241e5d4b636b027e18c09fef531775d;
SDK alias closes to literal MacOSX26.5.sdk with eight root-owned header identities.
Original LOCAL27/128MiB/Xcode-owner checks still refuse; job outcome remains UNKNOWN.
No compiler check, native agent or model executed. This is observed data, not
execution-profile admission, complete machine compatibility or portable reuse.

Full log SHA256 e63207d004db2dfaf463a485ae57fb1c8cf4a082f4717032677cc45a48eb411f;
structured reports SHA256 fcc04973a3cda710f6fb6ecae2468c8bb1cc3d349648bf041d5b2a1ce2b89f3d.
Saved in existing private owner-local evidence; every prior failure remains retained.

Next unblocked work070: explicit reviewed CI-only pre-auth build binding, preserving
local27 and legacy assets behavior. It binds exact current tool/header bytes and
private fixture/currentness; no imported profile JSON, Xcode fallback or new receipt
claims. Work071A separately inventories only the fixed ROOT llvm-objdump needed
for read-only inspection of changed public Bash/path_helper binaries. Those targets
will not execute during static inspection. Current tool identity is unknown, so
inspection invocation remains gated. Neither task changes producer trust/signing.
One integration owner, isolated authors and fresh critical-boundary review remain.

No new owner operation requested now. Copilot included Actions capacity remains
separately pending; source-bound Claude facts require freshness only when runnable.
The successful hosted six-check prerequisite remains closed within its actual scope.
Sealed execution, two-agent/two-machine reuse and economics are unestablished;
G0partial and G1–G4 incomplete. Alpha.11 stays unpublished; pilot/receipts unchanged.

## Historical checkpoint — reviewed inventory and managed-startup repairs

2026-10-14: actual [run38555298834](https://github.com/msiric/redue/actions/runs/38555298834)
used reviewed53c6/b58 on two independent macOS26.6.2/25G83 ARM64 VMs. Both returned
identical UNKNOWN reports: selected Xcode tools are caller-owned, CLT clang exceeds
the old128MiB inspection bound, literalSDK27 is absent, and linker/Bash/path_helper
hashes differ from the preparation pins. No profile compatibility or native/model
acceptance is inferred. Original38552782841 UNKNOWN and all failures remain retained.

Fresh independent067B ACCEPT at08d7e01/runtime6d0c6a1:77 mock tests plus24 independent
controls. The fixed root CLT alias and512MiB streamed clang capture are explicitly
OBSERVATIONAL_NOT_BUILD_ACCEPTED; original builder128MiB/SDK27/pins and Xcode refusal
remain. Review caught a late alias replacement gap in034; both identical fault
controls now refuse. Predecessor75PASS/2FAIL TAP remains preserved. No authority flag
was enabled. Dedicated inventory branch was pushed normally to08d7e01.

Fresh independent068 ACCEPT at846dd9a:136 mock tests plus17 independent controls.
Apple Bash may prefer a managed profile; the new@3 witness requires metadata-only
ENOENT at its fixed path before provisioning and throughout currentness. Failure
permanently invalidates that witness. No protected body is opened; binary pins are
unchanged. This repairs an unreleased source prerequisite, not proof of a released
defect or historical profile presence. Actual runner binary behavior remains unproven.

Both reviewed changes are integrated at `b9e6be6ec0ad0fd6e123e49cf857e8b9a60c0b21`; root combined213PASS,
393.6675ms, TAP SHA256 `dc2915687d2f1009aeef40dc83df4bf1af2fa4a32737a22f42e6221c17c94178`. This is mock/source acceptance,
not native enforcement, exact-package/platform acceptance or portable agent reuse.
Author expectation failures and reviewer harness correction are retained explicitly;
independent controls ran from stdin, so no invented reviewer artifact hash is given.

Next: one NEW owner UI inventory run ondev/portable-sealed-host-preflight at08d7e01,
checked runtime6d0c6a1. API dispatch403 remains unretried; no account cause inferred.
The old execution profile can still make the overall job red; inspect supplemental
root CLT facts without treating them as execution admission. Then review actual
bindings before any native/model launch. Copilot included Actions capacity remains
separately pending. Existing scoped hosted Claude PASS stays closed. G0partial and
sealedG1–G4 incomplete; alpha.11 unpublished; immutable receipts/pilot unchanged.

## Historical checkpoint — first precise VM inventory diagnosis

2026-10-14 11:17 UTC: owner-dispatched run [38555298834](https://github.com/msiric/redue/actions/runs/38555298834)
used branch `b58a80f60c84f9ed2794e4d04876f9727571b743` and reviewed source
`53c6eb352d3099956aa3ef9d42ea7b05be3e764e`. Both independent macOS jobs completed
with UNKNOWN/exit74. The precise established failures match: xcrun-selected Xcode
clang/ld are CALLER-owned rather than ROOT-owned; selected and literal CLT clang
exceed their respective bounded inspection limits; literal CLT SDK27.0 is absent;
selected SDK directory validation refused. No compiler check, native agent or model
executed. Matching Node22.13/Darwin25.6 and partial hashes do not approve a profile.

The earlier run38552782841 and its less precise UNKNOWN report remain preserved.
Repair066 retained all guards and independently captured partial fixed groups and
redacted rejection reasons. Fresh nonauthor review accepted exact b58/53:
44 focused mock tests plus20 independent controls PASS; root integrated44PASS.
Code-only integration `0aab2cae81936dc6da06436f3532f58aa4bd6512` preserves the
integration's unrelated ordinary-query workflow. Dedicated inventory branch was
pushed normally; no CLI403 retry, signing, trust or permission expansion occurred.
Reports/logs and failed author expectations are preserved in existing private state.
Full log SHA256 `c56ab519182cf70c03cd90a82c3b4075a7e3ccbaba43a7f51087510673a8c79c`;
structured reports SHA256 `8d63c5d5d1ecb7989dceb96647dfa83f0d7892b229a6968c42287e4370df61b2`.

Next bounded task067: independent source/profile review of observation limits and
actual root-owned CLT/SDK discovery, before changing any execution binding. No
blind rerun or weakening root ownership to accept Xcode is authorized by these
facts. Existing native prerequisite remains CLOSED scoped PASS; sealed origin,
recipient reuse and complete-path economics remain unestablished. Copilot included
Actions capacity remains separately pending. Alpha.11 is unpublished; Day0, gates,
protected resources, pilot and receipts remain unchanged.

## Historical execution status — BLOCKED after corrected handoff (2026-10-14 00:35UTC)

Three consecutive post-resume checks show no dedicated inventory run. The reviewed
registration/test-only correction is merged asde2fd9f; exact workflow bytes and
GitHub active registration are verified. The old missing-default-file/UI problem is
fixed. The separate CLI dispatch denial remains unretried, and no account cause
is inferred. Owner action already requested: normal Actions UI portable-preflight.yml,
Run workflow ondev/portable-sealed-host-preflight at8f49e77.

The independent sealed-boundary dependency audit remains applicable: actual VM
profile/enforcement facts are still missing, so connecting sealed execution or
origin authority would invent those facts. No safe useful downstream task is
established without this external operation. Resume by collecting the actual run
and independently evaluating both VMs. No new model/checker/CI dispatch, scope,
trust, spending, publication, receipt deletion or pilot update. Goal and gates
unchanged; not release-ready. Current work and private handoff are preserved.

## Historical operation — registration merged; actual inventory pending

2026-10-14 00:30UTC: PR15 merged normally asde2fd9f after independent063/064 ACCEPT
and all four normal CI38489104025 jobs PASS at exacthead748a9ab. Main now contains
the exact workflow SHAeb5c39bd5cfdeb595ea577427a090f7a83f98e88788d753ed788daf49d0a01d8;
GitHub reports registered active workflow380854940, Sealed-input public tool inventory.
No source/permission/signing/trust expansion or product runtime change occurred.
Original38487256107 macOS selector timeout remains preserved as FAIL; the reviewed
test-only partition repair retained all assertions and180s bounds.

The separateCLI403 remains unretried, and no account-permission cause is inferred.
The owner UI handoff is now usable: refresh portable-preflight.yml, Run workflow,
selectdev/portable-sealed-host-preflight at8f49e77, Run workflow. Two approved
standardmacOS read-only/storage-free jobs, no model/secret/compiler execution or
upload. No such inventory run exists yet. Collect its actual per-VM results and
independently compare requiredtool/profile facts before anynative/model launch.

The existing portable integration’s explicit test grouping/diagnostics remain
unchanged after root aborted its own conflicting cherry-pick. Current runtime and
private evidence are preserved; no forced push, receipt deletion or pilot upgrade.
Goal remains active and incomplete; sealedexecution/portable agent reuse/economics
are unestablished. Alpha.11 remains unpublished. Existing Claude fact/native gates
and Copilot includedActions capacity remain separate, not implicitly satisfied.

## Historical registration operation — corrected CI pending

2026-10-14 00:18UTC: PR15 final head748a9ab registers the exact reviewed storage-free
workflow on default main, enabling the missing owner UI route. Workflow bytes
remain eb5c39bd5cfdeb595ea577427a090f7a83f98e88788d753ed788daf49d0a01d8;
fresh independent063 accepted its unchanged ref/actor/source/permission gates.

Original normal CI38487256107: both Linux jobs and Windows PASS; macOS FAIL
in existing552 harness (ETIMEDOUT180s). Harmless actualNode controls and pinned
22.23.2 source reproduced the cause: the negative include pattern matches the
parent and admits all11 child cases. Test-only79ad964 repairs discovery with
a positive skip and recording with matching positive inclusion. Every current
case executes once (8+3), all bodies/assertions and180s group limits unchanged.
Fresh independent064 ACCEPT; actual isolated552 parent PASS133386.713ms, TAP
SHA7d584e694bf81e413afdb373678592a26f621ce8041797c5fb910bbfa535b9a7.
Main5.6.3 compiler/shim and isolated5.5.2 preserved; no runtime/evidence change.

New normal CI38489104025 is confirmed live on finalhead748a9ab. No merge yet.
Wait on that same run, then recheck exact revision/checks before normal merge.
The portable integration already has a different explicit grouping/diagnostic
repair; root inspected the cherry-pick conflict and aborted its owned operation,
preserving it unchanged. No lost work or history rewrite.

Actual hosted inventory/native/model calls remain NOT RUN. Existing CLI403 stays
unretried; default-branch absence explains missing UI, not account permissions.
This correction is not native enforcement, sealed execution or portable reuse.
The existing goal remains active, gates incomplete, alpha.11 unpublished.

## Historical registration checkpoint — first CI pending

2026-10-14 00:04UTC: owner screenshot exposed a missed UI prerequisite: the inventory
workflow is absent from default branch main (fresh contents404). GitHub documents
that default-branch registration is required for its Run workflow button. The old
CLI403 is separate and remains unretried; no account permission cause is inferred.
Prior blocked/audit conclusions below are historical, not current task ownership.

FocusedPR15 adds only the exact reviewed inventory workflow to current main.
Candidate82f5271, SHAeb5c39bd5cfdeb595ea577427a090f7a83f98e88788d753ed788daf49d0a01d8.
Fresh independent063 ACCEPT: scope/YAML/Bash checks and29 pinned mock tests pass.
Normal PR CI38487256107 is confirmed live; both Linux checks passed, macOS/Windows
remain running. No inventory/native/model call has occurred. Root waits on that
same run, then rechecks exact revision before normal merge under standing authority.
Only after registration can the owner use the existing UI handoff. No signing,
producer trust, permissions, publication or verification semantics change.

The owner resumed the existing goal; no new goal or coordinator was created.
Portable gates remain incomplete. Current integration runtime is unchanged.

## Historical execution status — BLOCKED at 2026-10-13 22:39UTC

Three consecutive checks confirm the same missing hosted inventory operation; no
run handle exists. Fresh independent dependency audit061 at54f2418 found no safe
small downstream binding before actual native-view/origin evidence. The prior
dispatch403 is neither retried nor bypassed. Remaining action: owner normal Actions
UI, `portable-preflight.yml`, branch `dev/portable-sealed-host-preflight` at8f49e77.
Resume by collecting that run and independently comparing both actual VM profiles;
then satisfy the existing native/account gates. Copilot included Actions capacity
remains a separate pending fact. No new resource or account request is introduced.

Integration/source and review records are preserved; the original objective,
Day0, G0–G4 gates and release boundary remain unchanged. This is a capability
block, not product acceptance or a test failure. Alpha.11 stays unpublished.

## Current checkpoint — reviewed inventory ready for actual host facts

2026-10-13 22:32UTC, reviewed inventory integrated as `f97538e`; dedicated
`dev/portable-sealed-host-preflight` fast-forwarded and pushed to `8f49e77` after
fresh remote comparison (0 remote-only / 5 local-only commits). The integration's
separate ordinary-query workflow was left untouched. Exact source/test bytes match
reviewed060B; root29PASS,86.736ms, TAP SHA
`539af352b1f3ee4198b089aebfb683c6afcc0a05bea34c14363e2162796cef98`.

Fresh independent060B ACCEPT includes49 independent controls and29 focused tests.
Literal CLT clang/ld are observed separately from canonical xcrun-selected tools.
Missing/changed/unsafe required tools retain partial public facts and UNKNOWN;
all authority flags remain false. The predecessor utility finding and author/reviewer
fixture failures remain retained, with review files preserved owner-locally.
Review SHA `0e062c96f91e6cdaa2bc11591cc5150ca59afa7f62234ff15260fb1ecdd99bce`.

Next task is actual public-tool inventory on the two approved standard macOS VMs.
No run exists yet. The unchanged dispatch403 is not retried or bypassed: owner
normal Actions UI must run `portable-preflight.yml` on
`dev/portable-sealed-host-preflight`. This manual, read-only, storage-free workflow
has two independent jobs and no model credentials, uploads, signing or compiler
check. Matching labels cannot establish matching profiles. Interpret actual results
before any native/model launch. The fixed native metadata proposal remains disabled;
its protected nonsecret account/capacity fact also needs owner refresh when runnable.
Existing secret presence is known; no login or credential-copying request.
Copilot included Actions capacity remains separately PENDING.

Same Herdr director/pane and existing goal; explicit native roles and fresh review
continue. G0partial; sealedG1/G2/G3/prepublicationG4 incomplete. Actual sealed compiler
execution, portable two-agent/two-machine reuse and complete-path economics remain
unestablished. Historical hosted six-check native prerequisite stays CLOSED scoped
PASS. No new native/model/CI execution, signing, trust, permissions or publication.
Alpha.11, fixed pilot, current work and immutable receipts are preserved.

## Historical checkpoint — 21:53UTC

2026-10-13 21:53UTC, integration `d6f3a55` after fresh independent057B ACCEPT.
The fixed native metadata diagnostic is now implemented; no native/model run occurred.
It creates fresh private fixture/build/startup state in one process, applies exact
nonbare environment/argv/settings, validates protected activation and currency, then
uses bounded transport and one-shot interpretation. Source-controlled startup stays
separate from enforcement; collected metadata may remain UNKNOWN. No seal, receipt,
portable applicability or agent-reuse authority is granted.

Fresh review of predecessor1c62d93 found unconditional managed skills/agents/styles
loading despite empty user/project setting sources:2PASS/3FAIL. Repairf7c5ee2 requires
metadata-only managed .claude absence before/after, with permanent invalidation.
Identical independent assertions now5PASS; fresh late/EPERM controls3PASS. Original
failures are preserved. Review SHA
`5ee3b69310acced883670a62dd0f63b8bc284a474bbc95dd2c62301c62e7bcde`.
Root combined11-suite run604PASS/one explicit OS SKIP,518.579ms; TAP SHA
`d8cf23fe9d72d2bc28b80ed8968d952e9be98c8383fc24fe69a48c1b328bd295`.
The original bare@1 constructor remains honest historical source-only evidence;
@2 NONbare preserves the explicit OAuth source route without claiming actual login.

Task059 wiring received fresh independent data-only ACCEPT and is integrated
b4a4092. Proposal SHA3c0a1c6a7494c2210d155f24b05974c1f0075c9efdd7c5832f51795dca98cce8;
14 independent wiring/activation controls passed; it is NOT enabled/dispatched.
Task060 inventory completion was REVISE: xcrun-selected Xcode tool hashes do not
establish the required literal CLT clang/ld bytes. A fresh nonauthor reviewer
reproduced that utility gap while all authority flags remained false.060B owns
minimal separate required-tools capture and source repin, before fresh review.
No native/model/CI calls, uploads, signing, new trust or permissions occurred.
The old hosted six-check PASS stays CLOSED and will not be repeated. Actual launch
still needs the reviewed workflow route, runner toolchain/profile facts and a fresh
protected account/capacity statement. No failed prerequisite launches a model.
GitHub reads/task-branch pushes work; prior dispatch403 is unrepeated. The inventory
branch has no run; Copilot included Actions billing fact remains independently pending.

G0partial; sealedG1/G2/G3/prepublicationG4 incomplete. No actual sealed compiler
execution or portable agent/two-machine reuse; complete-path economics NOT MEASURED;
external usage NOT STARTED. Day0 and72-hour calibration stand; forecast conditional/
high-risk. Alpha.11, pilot, existing credentials and immutable receipts unchanged.

## Historical checkpoint — 21:20UTC

2026-10-13 21:20UTC, integration `6de7e2e` (startup witness `9dd0a32`).
Same original Herdr director and goal; one integration owner. 054B received fresh
independent ACCEPT at exact `4708878`, then both transport commits were integrated.
Original timing failures remain retained. Monotonic deadline overruns cannot become
green; escalation occurs before bounded cleanup ends; only actual close establishes
reaping. Mock/transport acceptance is not native enforcement. Root exact combined
10-suite run:569PASS/one explicit OS SKIP,517.271ms; TAP SHA
`0a1157063d715a3baee4d5a1c58ed19514f8f7317a1da7e26562cd35cc526a5d`.

056 startup source witness received independent ACCEPT before integration. It binds
fresh owned HOME/config/PATH-helper inputs and reviewed stock startup source;
controlled native shell startup remains NOT_EMPIRICALLY_OBSERVED. One actual
same-process fresh fixture/build/startup/currentness constructor exited0 in1613.876ms
(body only, excluding CLI startup/import); native/helper/compiler-check/model were
NOT executed. Record SHA
`f43448edc45d5ccc427476177fedb764e7393d7fca37f9203772e92cda5c7270`.
The fixed C compilation is setup, not a verification or sealing event. Process-ended
private identities cannot be recovered from JSON. Prior053 build record preserved.

Next concrete task057 owns the usable fixed native diagnostic entry in an isolated
worktree, combining fresh private preparation, actual protected activation/env/argv,
bounded collection and post-close checks. Independent prerequisite review is active.
No native/model/CI operation has started. Source/currentness flags cannot substitute
for empirical enforcement, complete credential protections or origin stability.

Fresh GitHub reads report repository admin/push and environment metadata available;
these do not prove dispatch/write capability. The exact prior workflow403 remains
unrepeated. Inventory branch75613f9 still has no run. Existing protected OAuth secret
presence is confirmed without reading its value. The nonsecret owner policy fact is
reviewed2026-10-12T11:09:43Z, stale under its unchanged24h gate; no timestamp or
account facts were autonomously refreshed. No login/secret setup is requested based
on presence alone. Copilot included Actions4-credit/$0 fact remains pending.

G0partial; sealedG1/G2/G3/prepublicationG4 INCOMPLETE. Historical hosted Claude
six-check prerequisite stays CLOSED scopedPASS. Actual portable cross-agent/
two-machine reuse NOT ESTABLISHED; sealed complete-path economics NOT MEASURED;
external usage NOT STARTED. Alpha.11/fixed pilot/receipts unchanged. No new signing,
trust, permission, account or public action. Day0 unchanged; meaningful72h calibration
is due21:24UTC, not an instruction to wait or weaken gates. External blocked durations
are recorded per task; no fabricated aggregate blocked-time total.


## 72-hour calibration — 2026-10-13 21:24UTC

Day0 remains2026-10-10 21:24UTC. This is the scheduled calibration, not completion
or a wait instruction. Current reviewed integration6de7e2e plus checkpoint6ab8989
is pushed normally; task057 remains active on the actual critical path.

The old portable origin interpretations were withdrawn after concrete continuity
counterexamples. The owner-approved sealed recipe is still pending execution:
real preparation exists, but no actual stable-input origin/native seal or fresh
portable recipient reuse has been established. Successful old data-only transfers
and hosted six-check enforcement remain scoped historical evidence, not a new G1/G2
pass. G0partial; current sealedG1/G2/G3/prepublicationG4 incomplete. External field
usage NOT STARTED. Complete sealed-path economics NOT MEASURED; one340.6MB staged
preparation took81.513s and must eventually be included rather than hidden.

The next new diagnostic is not launch-ready: fresh source review058 confirms that
056's required--bare suppresses explicit subscription OAuth. This does not invalidate
its honestly source-only constructor result; it prevents using that witness for the
approved authenticated launch.057 is repairing the nonbare source boundary; fresh
independent review follows. Original parser/transport failures stay preserved.

Lane blockers are distinct: pending Copilot included Actions billing fact;
stale24h protected Claude account/capacity statement; inventory workflow dispatch's
prior403 (not retried); and unestablished sealed origin/recipient implementation.
GitHub reads and normal task-branch push now work. No account/login prerequisite is
inferred from secret presence, and no protected fact timestamp was refreshed.
These intervals overlap implementation; the record does not justify a cumulative
blocked-hours deduction. Root also corrected an idle-worker message/trigger mistake;
that engineering delay is not recorded as external blocked time.

Forecast revision: Day14/Day28 remain targets, but there is currently no evidence-
backed unconditional completion date. Demonstration is at high risk until the real
sealed origin slice and authenticated independent host handoff work; release-ready
forecast depends on that slice plus V01–V22, installed upgrades, independent review
and whole-path economics. No gate is weakened or reset to preserve those dates.
Next calibration follows actual native/origin evidence or a material blocker change,
not another broad test campaign. Publication stays owner-gated; alpha.11 unchanged.

## Historical checkpoint — 20:11UTC

2026-10-13 20:11UTC, integration `442f305`. The original Herdr director is
RUNNING in its existing pane; task ownership and the active goal are unchanged.
Installed native implementer/reviewer/researcher guidance is exercised explicitly;
automatic role-file selection and reviewer OS isolation are not claimed.

048D/048E repairs are independently ACCEPTED and integrated. Root96PASS/one default
SKIP; the actual owned engineering control then exited0, saved5944 bytes with
verified SHA `1d68ed0282ebe1f2741641b4e492f556387045debea4918d02a30683be0511dc`,
and confirmed owned-process cleanup. Four synthetic descriptor slots matched in
the baseline and were absent/different after the fixed C-to-Node replacement.
Inner control4099.868ms; supervisor4281.547ms before durable ACK. Full numeric
supervisor duration was not retained; exit0 confirms its final deadline check.
This is engineering evidence, NOT native-agent stdio or sealing. Both earlier
UNKNOWN attempts and their zero/absent captures remain preserved.

050 fixed pre-auth observer build/disabled proposal is independently ACCEPTED and
integratedd19d124, root188PASS.052 initially required revision: incomplete normal
native user metadata was refused. Original failures are retained.052B now requires
actual UUID/timestamp framing without synthesizing it or granting freshness.
Fresh independent source-faithful controls35PASS and broader443PASS/one SKIP;
root443PASS/one SKIP194.091ms at442f305, TAP SHA
`ed913ceff02ecebf24629dfbd6baf7c1a8f8104835eb936117805c60a74fc461`.
The disabled single direct-command parser can report only source-derived command
exit-zero; kernel child close/reaping, actual native enforcement and sealing stay
unestablished. Old marker route and security denials are unchanged.

Task053 completed: one actual existing pre-auth metadata-helper build exited0,
786.806ms, fixed compiler dispatch count1. Immediate live currentness passed;
helper was NOT executed. Private recordSHA
`27ffd03e2ef6d640385e4b826d1a47a78fb4a867d4620469ab545f4c5ef98bcd`;
helperSHAde44acfaf9bac523e49827ca963f3691415b6f4c7718e8d96612586b247fea0c.
The process ended; saved JSON cannot restore its private live identities. Complete
SDK closure remains unestablished. Task054 now owns the bounded same-process
existing diagnostic path, preserving actual account/startup/build gates and the
four-turn/120s limit. No actual native/model/CI operation has started.
No new controller, native/model/CI call, trust or permission change is authorized
by a source/mock PASS. G0partial; sealedG1/G2/G3/prepublicationG4 incomplete.
The hosted Claude six-check prerequisite remains CLOSED scopedPASS. Existing
GitHub admin403 and Copilot included-Actions-capacity fact remain separate blockers;
no repeated request. Alpha.11/pilot/receipts unchanged; complete sealed-path economics
NOT MEASURED and actual portable agent/two-machine reuse NOT ESTABLISHED.

## Historical checkpoint — reviewed CLI and actual prepared project

2026-10-13 19:32UTC, runtime `d69590b`; exact results in current
[resume](portable-evidence-resume.md), limits in [acceptance](../acceptance/portable-sealed-typescript.md).

| Task | Status | Actual result / next gate |
| --- | --- | --- |
|041B selected preparation | ACCEPT/integrated85409ca |217 root PASS/one SKIP; real sandboxed debugger materialization81512.978ms, not sealed |
|044B explicit sealed choice | ACCEPT/integrateda418620 |25 root PASS; conflicting selection fixed; actual configured execution still refused pending |
|045 current code closure | ACCEPT/integrated3c48b21 |103 exact leaves;217 root PASS/one SKIP; actual canonical constructor only |
|042B descriptor data/control | ACCEPT/integrateddb99164 |234 root PASS/one OS SKIP; strict PID repair; no OS control yet |
|046 actual native assertion | COMPLETE/source audit |Native Bash fd shapes UNKNOWN; no parent/seal claim from synthetic pipes |
|047B metadata-only native probe | ACCEPT431da90/integrated1c35001 |230 root PASS;27 fresh controls; syntax only, no helper/native/model |
|048C owned OS observation capture | ACCEPT/integratedd69590b |85 root PASS/one SKIP; first actual attempt UNKNOWN before launch, preserved |
|048D engineered startup admission | Isolated repair ACTIVE |Exact UID-bound Darwin marker only; no native/global/context exemption |
|050 fixed native observer build/proposal | Frozen bba77f2/fresh review ACTIVE |One pinned build; disabled policy; source/mocks only |
|051 native tool-exit semantics | COMPLETE/source audit |Single direct-command route requires complete normal raw result; actual stdio unobserved |
| Sealed product gates | INCOMPLETE |Native immutable origin, recipient authority, real agent/machine handoff outstanding |

All failures retained; alpha.11/pilot unchanged. No signing, permission/trust expansion
or public action. Existing external caps/admin facts unchanged; goal remains active.

## Historical checkpoint — fresh review returned; three bounded writers active

2026-10-13 17:50UTC, integration `f3cd33c` / runtime `6912ea4`.
Exact evidence and limits: current [resume](portable-evidence-resume.md).

| Task | Status | Result / next gate |
| --- | --- | --- |
|041 selected preparation | CHANGES_REQUIRED / frozen cd5c556 |Four independent late identity controls fail; no seal/reuse authority; old evidence preserved |
|041B final group closure | Import author ACTIVE |Repair named source/parent/Node/stage after body IO; independent successor review before preparation |
|042 real FIFO descriptor control | Stage-results author ACTIVE |Correct Node/libuv socketpair mismatch with fixed test-only parent; source/mock only until review |
|043 product-path audit | COMPLETE / source only |Sealed preview disconnected from actual config/run; no new authority |
|044 explicit sealed admission | New isolated implementer ACTIVE |Actual CLI/plan identity; run blocked before probes/execution until native capability exists |
| Director loop | RUNNING |Existing pane/thread; native delegation → returned source → fresh independent REVISE → author repair and next task |
| Portable product gates | INCOMPLETE |Native sealed origin, recipient and actual cross-agent/two-machine evidence outstanding |

No new permission/trust/signing/publication. Existing caps, Day0 and calibration
unchanged. Prior tests and engineering builds remain historical, not gate passes.

## Historical checkpoint — selection identity corrected; two bounded tasks active

2026-10-13 17:24UTC, integration `6912ea4`; exact evidence/limits in current
[resume](portable-evidence-resume.md). Prior results remain historical, not gate passes.

| Task | Status | Evidence / next gate |
| --- | --- | --- |
|038 initial fixed-selection data | REVISE / preserved09db33b |Root omitted-match + reviewer omission/superset counterexamples; no reusable evidence |
|038B truthful fixed/declared distinction | ACCEPT / integrated255382c |132 root PASS; fresh42 controls/three imports; old@2/@3 unchanged |
|039 native descriptor audit | COMPLETE/source only |Pinned Darwin SETEXEC+CLOEXEC semantics; stdio/loader/parent proof still required |
|040B campaign-only descriptor guard | ACCEPT / integrated6912ea4 |715 root PASS/one SKIP +45 independent controls/21 variants; syntax-only exit0; native authority false |
|041 selected preparation binding | Implementer ACTIVE/import worktree |Finite current public module leaves, unchanged bounded empty-env prep path; review before actual staging |
|042 standalone descriptor control | Stage-results author ACTIVE |Fixed nonsecret directbaseline→Carm, review before OS selection; not native enforcement |
| Last real engineering build | Six builds complete6ec4209 |24030.586ms/reaped, no compiled helper execution or native/model operation |
| Portable product gates | INCOMPLETE |Actual sealed execution, recipient interpretation and real agent/machine reuse outstanding |

No new trust/signing/permissions/release action. Existing external facts unchanged;
Claude scoped prerequisite closed. Alpha.11/pilot/Day0/calibration preserved.

## Historical checkpoint — reviewed preparation observed; product authority pending

2026-10-13 16:32UTC, integration `d74f83a`; current [resume](portable-evidence-resume.md)
binds source, tests, private evidence and limits. Same sole director; no owner relay.

| Task | Status | Observed result / next gate |
| --- | --- | --- |
|035B before-body admission | ACCEPT / integratedd74f83a |180 root tests +113 independent controls; shared30PASS; immutable read-view still required |
|037 scoped preparation composition | ACCEPT / integrated6ec4209 |608 root tests/one SKIP + fresh51 controls; final copied/new-file checks after scope close |
| Combined engineering observation | COMPLETE engineering-only |24030.586ms, six C builds exit0, reaped; prior timeout retained; no helper/native/model/receipt |
|038 selected-input view | Import implementer ACTIVE |Metadata-first fixed selector, private membership/content barriers; review before actual preparation |
|039 next native-admission gap | Independent researcher ACTIVE |Read-only precise assertion/interface audit; no native/auth/CI operation |
| Product sealedG1/G2/G3/G4 | INCOMPLETE |Configured sealed run and real portable machine/agent reuse unestablished |

Alpha.11/pilot unchanged; original Claude scoped prerequisite stays closed. Existing
admin/Copilot capacity facts remain distinct. Day0/calibration unchanged; complete
product-path economics and external usage remain unestablished.

## Historical checkpoint — combined preparation UNKNOWN; source repair active

2026-10-13 15:24UTC, source `825ae91`; exact records and limitations in current
[resume](portable-evidence-resume.md). Same existing director; no owner relay.

| Task | Status | Observed result / next gate |
| --- | --- | --- |
|032 combined provisioning | REVIEWED/integrated8d60a7a, actualUNKNOWN | Root382PASS/two SKIP; one30s attempt timed out/reaped;38 phase frames, no helper/native/model |
|033 exact native command | REVIEWED/integrated825ae91 |11 literal H leaves; independent99 controls; root107PASS; proposal stays disabled |
|034 selected-view audit | COMPLETE/read-only |473 omitted leaves, not Git-only; prepared-tree obligation requires membership/Git guards |
|035 Git-consumption guard | CHANGES_REQUIRED / repair ACTIVE | fa5d469 pre-journal compiler hash reads synthetic Git file before rejection; withheld, no protected body read |
|036 preparation diagnosis | CLOSED / read-only | Source graph72+48 full checks in copies; scoped design only, no runtime attribution |
|037 preparation composition | Stage-results implementer ACTIVE | Sequential full-entry scopes plus late guards, no implicit joining; fresh review before use |
| Product sealedG1/G2/G3/G4 | INCOMPLETE | No actual sealed execution or portable two-machine/agent reuse |

No unperformed validation assumed unchanged, no private capability recovered from
JSON. Existing GitHub admin/Copilot capacity facts unchanged; successful Claude
prerequisite stays closed. Alpha.11 and pilot untouched. Day0/calibration unchanged.

## Historical checkpoint — reviewed campaign pipeline; native seal still open

2026-10-13 15:09UTC, integration source `3c66c74`; exact scope/evidence in current
[resume](portable-evidence-resume.md). Failures and UNKNOWNs remain preserved.

| Task | Owner/status | Concrete result / next gate |
| --- | --- | --- |
| Herdr director loop | COMPLETE | Existing primary pane/thread, roles explicitly read; no automatic-profile or OS-isolation claim |
| DIR-NEXT-026 | ACCEPT / `17c5f06` | Fixed four-route shared-deadline campaign;272 root controls; no real helper/native execution |
| DIR-NEXT-029 | REVISE then ACCEPT / `fc6892d` | Final copied-file checks after dependencies;76 root tests+fresh counterexamples; engineering only |
| DIR-NEXT-028 | REVISE then ACCEPT / `16fbcad` | Complete @3 directory inventory closing barrier;156 root tests; strict complete leaf coverage |
| DIR-NEXT-031 | ACCEPT / `3c66c74` | Fixed private-derived campaign launcher;371 root tests, independent134 controls; not executed |
| DIR-NEXT-032 | Stage-results implementer ACTIVE | Fresh combined6-build/copies observation,30s total; review before actual selection |
| DIR-NEXT-033 | Readback implementer ACTIVE | New disabled exact native campaign command; no settings/native operation |
| DIR-NEXT-030 | Research COMPLETE | Copilot credential/native enforcement prerequisites distinct from billing fact |
| Shared regressions |28PASS/0FAIL |298134.652ms, not performance/native acceptance |
| Ordinary directory metadata | CAPTURED, not qualified |4576dirs/33818leaves/28.git leaves; no Git-body read/copy workaround |
| Product G1–G4 | INCOMPLETE | Configured sealed run, native protection, recipient interpretation and real machine/agent reuse pending |

No new owner action for routine engineering. Existing GitHub admin/Copilot
included-capacity prerequisites unchanged; original Claude diagnostic CLOSED scoped
PASS. Alpha.11 frozen/unpublished, no trust/permission/signing/publication changes.
Day0/calibration unchanged; field use and complete-path economics unestablished.

## Historical checkpoint — paired build observed; native seal still open

2026-10-13 13:52UTC, source `eb6bc77`. Exact evidence/limits in current
[resume](portable-evidence-resume.md); previous failures remain preserved.

| Task | Owner/status | Evidence and next gate |
| --- | --- | --- |
| Herdr director smoke | COMPLETE | Primary `w1:pD`, useful delegation→source/evidence→fresh review→decision→next task; automatic profile/OS enforcement unverified |
| DIR-NEXT-021 | ACCEPT / integrated `d224676` |458 defaults +496 controls; privately bound paired engineering artifacts; trusted/quiescent scope only |
| DIR-NEXT-024 | ACCEPT / integrated `eb6bc77` | Root326PASS/one SKIP; independent95 +246 controls; actual five-build observation11618.043ms exit0, no helpers/native/models |
| DIR-NEXT-025 | ACCEPT / integrated `d0ed1fe` | Pinned noEmit checking before membership; independent60 +66 controls, root60PASS; no CLI/namespace/seal authority |
| DIR-NEXT-026 | Implementer ACTIVE | Fixed four-route campaign under ONE shared deadline; stage-results `fc06d9d`; review before use, no native/model operation |
| Sealed product G1–G4 | NOT ESTABLISHED | Configured sealed execution, complete namespace/loader/parent boundaries and actual machine/agent reuse still required |

No deadline increase, environment stripping, new signing/trust/publication or
permission operation. Original Claude scopedPASS closed; GitHub-admin/Copilot
included-capacity facts unchanged. Alpha.11 frozen; field/economic gates pending.

## Historical checkpoint — pre-Node source/build accepted; observation pending

2026-10-13 10:02UTC, integration `c4bc6ec`. See current
[resume](portable-evidence-resume.md) for exact reviewed hashes and scope limits.

| Task | Current owner/status | Evidence and next gate |
| --- | --- | --- |
| DIR-NEXT-005 | Implementer / fresh reviewer / root: ACCEPT | Fixed worker `547e600`;16 independent controls; root94 source/protocol PASS82.072ms +132 adjacent PASS/two actual SKIP93.636ms; syntax-only compile0 |
| DIR-NEXT-006 | Fresh independent ACCEPT / root integrated `c4bc6ec` | Worker `e076968`;144 source/mock PASS +16 independent controls; actual ESM import only; exact same source mint/copies/original assets, guarded fixed compiler; no native authority |
| DIR-NEXT-007 | Implementer ACTIVE; root integration owner | Separate opt-in 30s observation wrapper: fresh3 prerequisite builds +new fourth; actual counters/costs, old observation untouched; no real build before fresh review |
| Native seal | NOT ESTABLISHED | Pre-main/native/protected bytes/auth/capacity/handles remain required; six-row helper's missing assertion keeps nominal UNKNOWN |
| Herdr | Live primary frontend verified | Exact owned viewport displays this primary's current tools/commentary, working/interactive-ready; same original goal/thread; no automatic approval/new coordinator |

One useful unblocked source task continues; no model launched on failed preconditions.
GitHub admin denial/Copilot included credits remain per-lane external facts. Existing
Claude hosted diagnostic stays scoped PASS. G0partial/sealedG1/G2/finalG3/prepubG4
incomplete; alpha.11 unchanged/frozen/unpublished; no product acceptance from mocks.

## Historical checkpoint — actual director smoke loop accepted

2026-10-13 09:24UTC, integration `49b1cb3`. See the concise current
[resume](portable-evidence-resume.md) for preserved source observations/blockers.
D13 adds coordination only; existing objective, gates, trust and budget remain.

| Task | Owner/status | Concrete evidence |
| --- | --- | --- |
| DIR-SMOKE-001 | Root director / native implementer / fresh reviewers: ACCEPT | `3eba47e` CHANGES_REQUIRED (four deadline countercases); `93f4bc1` final ACCEPT; root94PASS/1realSKIP79.232ms; reviewer26additional controls; integrated `f0b60f0`/`49b1cb3` |
| Role discovery | Native researcher: complete | Explicit files read; installed0.162.1 supports profiles for spawning; live automatic profile selection unverified, no OS read-only claim |
| DIR-NEXT-002 | Native implementer: REFUSED before launch | Unchanged environment violates existing key guards; zero compiler/native/model/receipt operations; private bounded-readback refusal record retained |
| DIR-NEXT-003 | Fresh reviewer: ACCEPT | Exact manifest/installed hashes; no scope/permission/objective override; installation is not enforcement |
| DIR-NEXT-004 | Native researcher: complete | Identified after-Node preload gap and unchanged missing-row protocol; source-only, no credentials/native actions |
| DIR-NEXT-005 | Native implementer: active | Disabled fixed pre-Node launcher/bindings; one worker writer; fresh independent review required before use |
| Herdr attach | OWNER_REQUIRED saved folder trust | Owned existing pane, same primary-thread resume, native UI blocked before inference; no input/trust applied; no second coordinator |

Runtime: Herdr client/server0.9.1; Codex/client and daemon0.162.1; existing
ChatGPT subscription. Native implementer/reviewer/researcher guidance actually read;
automatic TOML role selection unverified. Actual inherited permissions unrestricted,
approvalnever; task no-write constraints observed rather than asserted OS isolation.
No model/provider/global policy override, pane-worker duplicate, new orchestrator,
publication, signing/trust expansion, or server restart. Owner pause and detach/
sleep/reboot unexercised. Startup zsh updater side effects UNKNOWN and preserved.

Product gates are not smoke-loop gates: no sealed authority or real portable
cross-agent acceptance follows from94 mocks. G0partial/G1sealed/G2/G3/prepubG4
incomplete; alpha.11 frozen/unpublished. Existing resource blockers stay per lane.

## Historical checkpoint — fixed native collector components; execution remains gated

At 2026-10-13 06:02 UTC, integration `9d23db6` includes the independently reviewed
private A/B/H build-currentness verifier, strict six-row result parser, bounded
child collector, exact disabled native command and fixed four-source collector
renderer. Five integrated source/mock suites passed67/67 in67.136ms. Root's
independent review of A's corrected renderer passed four additional controls;
A independently reviewed Root's collector command. C's completed reviews remain
valid for their exact bytes; its later provider-capacity failure is recorded, not
retried through another model/billing route. Root and A completed the remaining
non-author reviews sequentially.

Preserved pre-use NO-GOs found late-validation ordering, fake reap after failed
spawn, unhandled stream errors, incomplete clock guards and deferred stdout errors.
All were repaired with bounded countercases before use. Earlier failed/UNKNOWN
observations remain. The first independent-renderer command referenced its script
relative to the wrong worktree: only author controls ran; the corrected absolute
path then produced the actual four-control result. No native/model launch followed.

The collector inherits the real native-filtered child environment. Its exact
four source files and Node/helper paths are H-only; the disabled proposed policy
adds only five code/runtime read leaves, retains root/credential/network/socket
restrictions, denies writes to H, and admits one literal proposed command. No
settings were applied. Flags/environment guards inside the entry run AFTER Node
startup; preventative parent rejection, actual protected copies, pinned native
and startup source validation, in-place auth/capacity, native tool/result matching,
and fresh same-process supervision remain required. A copied file/manifest or
serialized private capability cannot unlock execution. No recipe is sealed.

Last actual observation remains the three-build `de6e9f9` record: all three clang
processes exited0, test1473.771ms/complete1521.064ms, BUILT_NOT_EXECUTED. Retained
TAPSHA `9920e89cb82f8f559d1903beaeaaad6049a50bf0fd1800ffe28b58a6525fc766`,
owner recordSHA `b1da6a33199e411f0b25299405af0b8357d7021c9295a8e092ddba2203a21894`.
The current C protocol has five implemented rows plus an explicit missing row;
nominal output remains global UNKNOWN. No native seal, origin or reuse follows.

Hosted Claude's completed six-check prerequisite remains CLOSED scoped PASS.
GitHub branch pushes and run-list reads work; the one storage-free inventory
normal dispatch was denied HTTP403 and the subsequent read returned no runs.
The existing concrete owner UI dispatch request remains pending without retry.
Protected-environment nonsecret fact/secret-metadata reads returned unavailable;
this does not establish missing provisioning or authentication failure. Local
native/config/approved namespace metadata exists, without symlinks; no Keychain
or credential body was read, copied or tested. Copilot included Actions4 credits
remain a separate pending fact; its native authority/credential/source gaps also
remain open, so billing confirmation alone cannot start its model lane.

G0 partial; current sealed G1, actual cross-agent/two-machine G2, finalG3 and
prepublicationG4 incomplete. Day0 October10 21:24UTC and calibration October13
21:24UTC unchanged, without invented blocked hours or forecasts. Alpha.11 stays
frozen/unpublished (SHA `f6e368bd8171412b301f3f5dee3ceebea14da3b3418968504a7a49428e5876a0`);
no live registry recheck, trust/signing/publication, configuration/receipt change
or external usage. Next: prepare guarded H-only source copies and native parent
preflight/structured tool adapter, with non-author review before any dispatch.
Root integration/supervisor; A source leaves/review; C and B capacity unavailable.
This is useful unblocked implementation, not completed product acceptance.

## Historical checkpoint — fresh pair build observed; native sealing still pending

At 2026-10-13 05:08 UTC, integration `48d08bc` retains the independently reviewed
same-process synthetic A/B pair, separate host H, fixed source renderer, restricted
disabled policy, and three-build observation. The one new actual build at
`de6e9f9` completed three attempted/returned/observed clang processes, all exit 0,
without helper execution. Test 1473.771 ms / complete 1521.064 ms; outcome
BUILT_NOT_EXECUTED. Private TAP SHA
`9920e89cb82f8f559d1903beaeaaad6049a50bf0fd1800ffe28b58a6525fc766`;
owner record SHA
`b1da6a33199e411f0b25299405af0b8357d7021c9295a8e092ddba2203a21894`.
Independent review `14c7f8a` verified those exact retained observations. The
expired private preparation/build brands cannot be adopted from these records.

Earlier engineering exchange remains distinct: four implemented assertions PASS,
whole-base NOT_IMPLEMENTED, helper UNKNOWN, exit 74. None of these observations
establish native Claude enforcement, a sealed compiler input tree, a portable
origin or agent reuse. Historical UNKNOWN/NO-GO results remain below. The final
third-file late-change/count correction has independent six-control review;
source/currentness evidence is never a verification receipt.

Next bounded work: a fresh same-process native whole-base canary supervisor using
the existing supported Claude programmatic route. Root owns integration/policy;
A owns the fixed result parser and private build currency verifier; C independently
reviews the native/auth/effective-boundary prerequisites. The current C emitter
has six rows, five implemented plus one explicitly NOT_IMPLEMENTED; nominal
observations must remain overall UNKNOWN, not a fabricated complete PASS.
No native dispatch occurs before the actual prerequisites pass.

Hosted Claude's original six-check prerequisite stays CLOSED scoped PASS.
The separate public-tool inventory dispatch was denied once by GitHub HTTP403
("Must have admin rights to Repository"); zero jobs ran. The concrete normal UI
owner-dispatch request remains pending, without retry or alternate transport.
Copilot included four-credit Actions billing remains pending. Independent source
review additionally identifies mutable-config/state authority, staged-tree write
scope, and all-channel credential filtering gaps in its disabled proposal; billing
confirmation alone cannot launch it. No repeated account request is made.

G0 remains partial; current sealed G1, actual cross-agent/two-machine G2, final
G3 and prepublication G4 remain incomplete. Day 0 is October 10 21:24 UTC;
calibration October 13 21:24 UTC, without invented blocked hours or date reset.
Alpha.11 is frozen/unpublished, SHA
`f6e368bd8171412b301f3f5dee3ceebea14da3b3418968504a7a49428e5876a0`.
The last registry read failed curl35; live tags were not rechecked and no auth/DNS
cause is claimed. No producer trust, signing, publication, real configuration,
pilot receipts, model or native enforcement changed. External field usage
NOT STARTED; complete sealed-path economics and final candidate acceptance pending.

## Historical checkpoint — engineering entry/build observations; sealed authority pending

At 2026-10-13 03:43 UTC, integration `c6810f6` includes reviewed fixed source
composition, engineering Node startup, helper build, and strict failure-preserving
exchange collection. One engineering Node `--version` request passed (test
478.835 ms; complete 538.155 ms); two fixed C builds passed (test 1091.728 ms;
complete 1141.863 ms). These are not native Claude, compiler execution, sealing,
portable origin, or agent reuse evidence. The build outputs have not executed.

Exact private records and review limitations are listed in the
[sealed-input acceptance record](../acceptance/portable-sealed-typescript.md).
The source classifier's 88,592-byte profile exceeded the unchanged 65,536-byte
bound; that failure and earlier UNKNOWN results remain. A fresh short owned
engineering fixture subsequently passed its distinct startup gate. No bound was
increased. No old serialized fixture is adopted as execution authority.

Independent review accepted the extracted live-fixture build and corrected its
partial-failure record. It refused the exchange proposal for duplicate JSON,
contradictory rows, hidden FAILs, and incomplete identity checks. `c6810f6` repairs
those issues; four pure controls passed, independent review completed before the distinct
engineering observation below. No runtime, installed settings, receipt, trust or signing
change accompanies this engineering harness.

Hosted Claude's completed six-check prerequisite remains CLOSED scoped PASS.
G1/current sealed interpretation, G2/final G3 and prepublication G4 remain
incomplete. Full compiler input/metadata closure, actual native canaries, and
stable origin enforcement are outstanding. Copilot included Actions billing
remains pending; no repeated request. Alpha.11 remains frozen/unpublished, SHA
`f6e368bd8171412b301f3f5dee3ceebea14da3b3418968504a7a49428e5876a0`.
Last registry read failed curl 35 (socket connectivity); no authentication or DNS
cause inferred. GitHub fetch works; main is unchanged `da6b87f`. Root integrates,
A owns compiler/source leaves, C independently reviews critical boundaries;
B capacity unavailable. Day 0 and 72-hour checkpoint remain October 10/13
21:24 UTC. External field usage NOT STARTED. Next: independently review the new synthetic-only whole-base pair; inventory
approved hosted public build tools without inference/storage; then provision the
actual native canary boundary before unchanged full compiler execution.

One reviewed engineering exchange observation (`c6810f6`) now completed:
four implemented rows PASS, whole-base NOT_IMPLEMENTED, helper UNKNOWN (exit74,
reaped, stderr empty). Test2832.336ms / complete2879.571ms. Private TAP SHA
`7ed19b816959ce369d5d03b1c4ce61ec88c73819cabea2604bc05534102be596`;
private owner JSON SHA
`84e2a2a8bf85abf9197f4270fb782b831618622d2df64daa98b95e5dc414f7ba`.
Independent review verified the retained bytes/rows and non-authoritative scope.
Post-control fixture verification UNKNOWN is retained; the old preparation mint
is never revived. The positive observation does not establish Claude/Bun,
whole-base/case/symlink/mapping protection or portable origin applicability.

Source review of the selected unchanged debugger confirms noEmit still invokes
semantic diagnostics through emit handling. Its source-file graph is incomplete
for that obligation; the earlier generic NodeNext diagnostic example also does
not apply to this project's bundler mode. No old graph is promoted to a receipt.
The whole-base proposal must exclude all authentication/state/unrelated files;
a fresh separate privately minted pair is being implemented, not an old subset
fixture being declared complete. No real prepared stage is moved. The hosted
public-tool inventory proposal has one corrected path-classifier control; its
initial regex assertion failure is retained (before any public-tool execution),
then43.818ms PASS. It remains unrun pending independent review. No credentials,
model, compiler execution, signing or artifact upload is in that inventory job.

### Historical blocked lane and continuing work

The independently reviewed storage-free hosted inventory branch
`dev/portable-sealed-host-preflight` is pushed at `75613f9` with source pin
`c96f350` and workflow SHA
`7e45d857f0302401f6c7417dca8647bf0b74c7dad530e21949ef45d3cbe4b9b3`.
One normal dispatch was rejected by GitHub HTTP403: “Must have admin rights to
Repository.” No run exists, no model/storage/signing occurred, no alternate
endpoint or repeated dispatch was attempted. Branch writes work. The owner has
one concrete normal-UI dispatch request; no account-permission cause beyond the
observed operation is inferred. This blocks hosted public-tool facts only.

Local work continues: `ac7c9e4` adds an independently reviewed private fresh pair
with exact synthetic-only A and empty B inventories. Unknown/auth/state/public
build additions invalidate it; serialized records cannot revive private proof.
Its separate whole-base C template remains unrendered/unbuilt/unexecuted. Native
host resources and public code belong in a separate namespace H. Root's split
policy proposal is disabled, keeps credential denial, narrows writes/reads/sockets,
permits no command, and has no native-enforcement claim. Its two pure/mock controls
passed with the pair/source controls (25PASS56.456ms); independent review is
pending. A owns the private data-only C renderer, C its independent critical review.
No imported origin, accepted producer, permissions, auth, receipt or alpha.11 bytes
changed. The next useful work is this native boundary, not a second API graph or
another compiler/status benchmark.

## Historical checkpoint — source profile-size failure established

At2026-10-13 02:28UTC, integration9fcaaae includes the independently reviewed
finite classifier (20f18a0; testSHAfd9e05c4e6ca685e46b523eb368c8ef71652018063c87e9b470e71d2842e6516).
Its one changed actual source-evaluation observed STRING88592bytes, exceeding
unchanged65536bound; root-literal and fixed public-read predicates were true,
network wildcard false. Actual child74/test132.086ms/complete177.625ms. Only this
attempt's cause is established; earlier missing-phase and CLASSIFY UNKNOWN
records remain unchanged. Private record:
`.local/portable-evidence/claude187-source-composition-predicates-20f18a0.tap`,
SHAab2558415878b05aa396076283d6c9de36b07f7a2803b56fa23fdf682d32e871.
No sandbox/Claude/Bun/compiler/model/CI process followed that failed gate.

Independent source review supports relocating the generator's empty engineering
fixture to fresh owned canonical short/private/tmp placement matching the hosted
layout. Exact code/options/64KiB/VM1s/parent5s4KiB acceptance stay unchanged;
A owns the repair, C must review exact bytes before a changed attempt. No permission
or real execution environment is rewritten to obtain a result. Root's fixed
engineering Node--version startup driver78337d6 remains unrun pending independent
source/mock review. Its predecessor NO-GOs and finite repairs (bounded reads,
setid refusal, redacted failures, raw process-domain checks and currentness/reap
cleanup guards) are retained. Source/mock success cannot certify a native seal.
A also owns a data-only fixed existing C/Node-render/build proposal; no C build
has run. The earlier108 synthetic controls remain mechanics-only. Native
read/alias/mapping/atomic enforcement and compiler namespace completeness remain
outstanding; the partial914-file API graph is not promoted to completeness.

Hosted Claude six-check prerequisite remains CLOSED scopedPASS. Copilot included
Actions capacity remains pending without another account request. G1/current
sealed interpretation,G2/finalG3 and prepublicationG4 remain incomplete. Frozen
alpha.11 rehash stillf6e368bd8171412b301f3f5dee3ceebea14da3b3418968504a7a49428e5876a0;
no rebuild, publication, trust, signing, config/state or receipt change. Last
registry read failedcurl35 “Recv failure: Socket is not connected”; live tags
and publication were not rechecked, and no auth/DNS/occupied-port cause is inferred.
Day0/72h remain2026-10-10 21:24UTC /2026-10-13 21:24UTC. Full sealed-path economics
and cross-agent/two-machine reuse remain unestablished. Root owns integration,
A exact fixture/code leaves, C independent critical review; B capacity unavailable.
Next commands: reviewed changed source-classifier test, then independently
reviewed fixed engineering startup only after its in-process gate passes.

## Historical checkpoint — read-boundary and native canary implementation

At2026-10-13 01:35UTC, integration sourceddbe600 includes independent review of
fresh synthetic preparation, tightened native read-view proposals, and fixed
case/symlink/mapping/atomic diagnostic composition. Actual native enforcement,
sealing and portable origin authority remain NOT established; no settings were
applied, C helper built, native/model run or origin signed at this checkpoint.

The exact repaired atomic sourceSHA507dc2fb45adb9d7df293eccf18874fbfb101d4b25f2ace932899be6f2198d72
and fixtureSHA8e0c5a73a41faa85f1b2fde111252622ce968110c45309f6e49695aca0c6692d
have independent source/finite-control GO. Predecessors772/9bd have preserved
NO-GO reviews: a known directory/descriptor mismatch could be masked by an
unrelated unavailable observation. The repair compares each independently observed
identity and preserves FAIL through later uncertainty. There was no native use of
those predecessors and no claim of a released defect. Case/symlink checks are
implemented source/mock-only; missing aliases remain UNKNOWN. Base exchange and
full native composition remain unobserved. Exchange must precede deliberately
writable Node controls; the full-fingerprint prep mint is not revived after those
changes and is never a post-run seal certificate.108 affected local/source/pure/
mock controls PASS207.009ms, distinct from native/machine acceptance.

Disabled canary read-view@2 has source GO at7c93f33 (SHAd171a31ea942d81f7f93134a26f73bf0b1ccb826edf9bcb878debd82f3397f3d):
root body-read denial; only two fresh synthetic inventory subpaths and exact
Node/Bash/three public-code leaves. No home/base/checkout/OS-directory reallow.
Original credential/env/network/write/strict safeguards retained, commandallows
removed, commands empty. Never use its inventory reallows on the real prepared
stage. Pinned native187 still permits directory metadata/root-inode and built-in
OS services. Proper-parent create/unlink guards already exist; actual alias/
exchange/mapping protection and physical/case/firmlink disjointness are pending.
No nested macOS sandbox is assumed. Exact loader read needs remain unestablished.

Pinned TS5.5.2 source review found conditional diagnostic extension-candidate
queries after getSourceFiles. The914-file graph below cannot be promoted to full
query/CLI completeness. Three synthetic counterfixture attempts are preserved
privately: one test-worker admission refusal before API load and two actual API
late-query assertion failures. They did not establish the expected branch;
mode/query/diagnostic observations were insufficient to assign why. The exploratory
fixture is archived, not a passing regression or claimed debugger counterexample.
No receipt/model/configured verification ran. No further API attempt until a
reviewed diagnostic captures the missing prerequisite. Actual graph remains
partial and diagnostic-only. Root owns interfaces/integration; A owns bounded
canary and exact generator-source proposal; C owns independent critical review.
B capacity remains unavailable, without capacity/model switching.

Selected public nativea59 and29 retained source fragments match exact offsets/
lengths/hashes under independent read-only review. The24-fragment constructor
0a412b9 (shared common prefix once) has independent source/data GO56f5c81, with13
read-only/fault controls. The one reviewed empty/nonsecret Node22.13 source-eval
attempt failed: actual childexit74, test128.001ms/total177.770ms. Retained TAP
lacks phase/reason, so no cause or source-composition success is assigned.
Private record: `.local/portable-evidence/claude187-source-composition-first-0a412b9.tap`.
A owns a changed finite phase/error reporter; C must review it before another
source-eval attempt. No identical retry, sandbox-exec, native/Bun, compiler,
model or CI operation follows. Source composition is not Bun equivalence or
native enforcement. No invented broad OS read allowance/controller/new resource.

Hosted Claude's completed six-check prerequisite stays CLOSED scopedPASS;
Copilot Actions included capacity remains pending. G1/current sealed
interpretation,G2/finalG3 and prepublicationG4 remain incomplete. Origin
containment stays enabled. Frozen alpha.11 rehash still
f6e368bd8171412b301f3f5dee3ceebea14da3b3418968504a7a49428e5876a0,
unchanged/unpublished; no new trust/signing/publication, state or receipt change.
Day0/72h remain2026-10-10 21:24UTC /2026-10-13 21:24UTC, without fabricated blocked
time or forecast revisions. Full sealed setup/portable-workflow economics remain
unmeasured. Next: independently review exact generator construction and capture
narrow startup requirements before actual native boundary/recipient claims.

## Historical checkpoint — ordinary staged graph collected; native seal pending

Integration branch `dev/portable-sealed-typescript`; source69c4757 has independent
critical review. The restricted ordinary debugger API probe collected914 files:
425 project files,59 installed TypeScript default libraries,429 other installed
files and1 other file; one config. Complete12189.041ms, child74/reaped/no signal,
all12 before/after binding checks true, exact record/outerACK verified. No compiler
verification, native agent, model or reusable origin was executed/established.
Private recordSHA95c3be736476d67a66e3d217c07ca6316a54ff5c993d3104359b6add60011289;
outerACKSHA5608b977cf79a71797280cb38326219a41d591bfde42b922c4a69e83f5ec5ac6.

Logging is explicitly partial:39489 calls/14218 retained frames; FRAME_LIMIT,
JOURNAL_LIMIT,UNSUPPORTED_FUNCTION_METADATA andUNSUPPORTED_METHOD. Retained raw
outsideEPERM observations388 remain denials. No all-query, API/CLI equivalence,
namespace completeness or seal claim follows. Three preceding actual engineering
attempts remain UNKNOWN: missing reason, known summary cap, then strict schema
refusal. Reviewed repairs lower retained diagnostic bytes to4MiB within the same
8MiB response and omit unreviewed shapes while still forwarding/counting calls
and latching incompleteness. The finite strict reader still rejects injected
unknown fields/methods. No evidence validation or permissions were weakened.

Source-only native composition and UTF8 mapper repairs are integrated through
76ba343. Runnable commands remain empty: destructive parent operations require a
fresh synthetic-only namespace, never a prepared real stage. Actual native stage,
ancestor/alias/mapping enforcement remains unestablished. A owns bounded canary
preparation/bootstrap leaves; root integrates interfaces; C independently reviews.
B capacity is unavailable, so concurrency stays reduced without a model switch.

Closed hosted Claude six-check prerequisite remains scopedPASS. Copilot Actions
included capacity remains pending. G1/current sealed interpretation,G2/finalG3 and
prepublicationG4 are incomplete; origin containment and frozen alpha.11 bytes
remain unchanged/unpublished. No signing, new trust, package publication, state
or receipt change. Day0/72h calibration remain2026-10-10 21:24UTC /
2026-10-13 21:24UTC. Full portable setup/economics remain unmeasured.

## Historical checkpoint — prepared tree; compiler guard diagnosis

Integration branch `dev/portable-sealed-typescript`, preserved HEAD35408dc.
One real public-project preparation completed:33345 files/340640366bytes,
66570.596ms including9459.249ms manifest work, exit0/reaped. It is
MATERIALIZED_NOT_SEALED. The fsync-only ephemeral-stage correction retains full
readback/membership/physical checks and does not alter receipt durability.

Two fixed compiler fixtures remain UNKNOWN: the live-audit fixture exhausted its
30s budget; the prepared-snapshot fixture finished14.537s with one childexit0 but
bindingsCurrent:false. No failed guard was captured. A subsequent independently
reviewed no-dispatch pair finished10.003s with all nine component equality
booleans true. This is not a cause assignment or continuous-stability proof.
RecordSHA267f2fe0947240e372997020f666b4683e2cbcdf39697a0a3846def466e0c334;
outerACKSHAf166a39b6b9292780c8a266dc1628c7dde3ad85c3c8c9df5c30b69011c323327.

The reviewed fixed instrumented successor c630fe0 completed one changed local
snapshot dispatch in14848.778ms: childexit0/no signal/reaped, no output and all ten
strict binding comparisons true. Narrow result is
PREPARED_SNAPSHOT_ROUTE_EXIT_ZERO_NOT_SEALED. It does not independently acknowledge
compiler execution or prove native-agent protection, namespace completeness or a
seal. Earlier UNKNOWNs remain unchanged; no further score retry is planned.
RecordSHA3e90cfe8e791bb160900eb62726e514e4810045e1e9ef7153a71e77798f92d00;
outerACKSHAf42f8b64aec6ecb86f725e951ddc262d1eb7b9d2aa27d5c8195a9dd968039ee1.
Independent source/mocks review4b70ff6 and actual-pair reviewcca04b2 are integrated.

Next: complete reviewed sealed-only FS observation before first TS load under the
same restricted view. A owns that test-only leaf; root owns shared interfaces;
C independently reviews critical boundaries. The first local mapping fixture remains UNKNOWN: fresh-file preconditionEINVAL,
no mapping assertions. Primary XNU source independently identifies a conflicting
O_NOFOLLOW_ANY|O_NOFOLLOW pair; the reviewed correction retains all-component
O_NOFOLLOW_ANY. It changes no permissions or identity assertions. A changed fixed
kernel-only fixture then observed all seven expected classifications: real RW
MAP_SHARED change/restore in the permitted workspace; staged writable-descriptor
EPERM; readonly-descriptor mprotect/mapEACCES; preserved bytes/identity and closed
handles. Complete442.304ms/exit74/reaped; globalUNKNOWN and all authorityfalse.
RecordSHA2ffd49d880f1c14302739fabe8dbc9613e0f7a5beb6269bd6eba949f8d79d813;
outerACKSHA2dff05c850b1deaf07e04a8d94c67acd04e73fd77b1312ecfe9361c1e4553c4f.
This local kernel mechanism is not the native-agent boundary, a seal or a proof
of no inherited writable handles. Earlier UNKNOWN has no retroactive phase cause.
Actual native stage enforcement, compiler namespace completeness and portable
origin authority remain unestablished.
Closed hosted Claude prerequisite stays scopedPASS; Copilot included Actions
capacity remains pending. G1/G2/G3/prepublicationG4 remain incomplete. Existing
origin containment, alpha.11 frozen bytes/unpublished status, receipts and prior
failed/UNKNOWN attempts remain unchanged. No model, signing, new trust or release.

## Historical checkpoint — instrumented staging deadline; necessary-work review

At 2026-10-12 22:11UTC, one independently reviewed diagnostic at
87d339b7d1a7897529a755262c564d02c28d684a returned UNKNOWN under the unchanged
120s preparation cap. The child was SIGKILLed and reaped; zero compiler/model
executions. Complete128179.497ms includes8070.513ms manifest work. All29 validated
metric frames are retained, along with the incomplete owned stage. The last
sample at116047.127ms records14701 stage fsync calls consuming66515.072ms;
source/boundary lstat calls consume8977.656/10771.335ms. These aggregate recorded filesystem-method
times identify per-file synchronization as the largest measured operation, not
all CPU/serialization cost, atomic phase timings or successful preparation.
Private resultSHA a202900a7d922ea175eb4b45e17e692c96ab3d48a8f29bce523fd60a83f2aa79.

Diagnostic child2bc2b35/driver87d339b have independent reviews c4e7986/a554c1b,
now integrated. No elapsed-budget increase, omitted content/namespace validation,
new origin authority or empirical performance improvement follows. A is reviewing
whether per-file durable synchronization is necessary for this private ephemeral
stage; C must independently review its claim/crash boundary before any correction
or changed actual attempt. Existing durable receipt persistence remains untouched.

C also found a synthetic sentinel outcome-erasure defect: a close failure could
mask a successful prohibited write. A repaired it atbc61c1d; independent review
is completed with disabled-core source GO. Native stage sealing remains UNKNOWN, with writable mappings and
exact actual native bindings still required. Closed hosted Claude six-check
prerequisite is not repeated or promoted to stage enforcement. Copilot included
Actions capacity remains pending. G1/G2/G3/prepublicationG4 stay incomplete;
alpha.11 artifacts unchanged/unpublished and origin containment enabled.

Reviewed leaf6b530a9 is integrated as5c5b6c9. It omits only ephemeral-stage
per-file fsync; readback, fchmod, content, alias, membership and ancestor checks
remain. Independent61 affected +6 adversarial controls passed; integration132
controls passed498ms. One normal fixed preparation then completed in66570.596ms
(including9459.249ms manifest),33345 files/340640366bytes, source alias1group/2entries,
exit0/reaped. It is MATERIALIZED_NOT_SEALED, not CURRENT or native enforcement.
Private recordSHA f6be47bd48571a9cc0a904fe6043466018e15f6590587694c745fe57415c9828.
This single successful sample is not a matched performance distribution or causal
speedup. No durability/recovery claim is added; old stage summaries cannot confer
restart authority. Actual receipt/state durable persistence is unchanged.

The synthetic sentinel successorbc61 has independent disabled-core GO and36
integrated mocks. Its full nominal outcome remains UNKNOWN because mapping and
actual native bindings are incomplete. Root's fixed read-only compiler fixture
proposalff0c49f has5 pure controls and awaits independent review; it executes
nothing on construction and does not establish native-agent enforcement.

Next: finish the fixed compiler/mapping boundary review, verify current staged
membership/namespace, and establish native seal prerequisites before model/origin claims. Day0 and72h checkpoint
remain unchanged; prior failed/UNKNOWN attempts and partial trees are preserved.


At the subsequent checkpoint, the complete data stage exists, but fixed compiler
acceptance remains UNKNOWN. The first30s fixture with live-source audits expired;
its child0 did not establish final currentness. A no-dispatch component sample
measured code72.551/source9857.792/stage6685.825/profile68.730ms, one16.695s sequence,
not a whole-cycle distribution or attributed cause. Independently reviewed D12
snapshot-only scope retained historical source provenance and every stage/runtime/
namespace/physical guard; its one changed dispatch stayedUNKNOWN within14.537s
because bindingsCurrent:false. Which guard differed is not yet captured. Preserve
all three records+exact final ACKs; no third compiler until a no-dispatch guard
diagnostic and independent review establish the failure reason. No native/model/
receipt or portable origin acceptance follows. A is inspecting canonical5.5.2
sys/capture semantics without API execution or shared-interface edits; C reviews.

## Prior checkpoint — reviewed source-alias preparation; actual staging timeout

At 2026-10-12 21:33UTC, the coherent data-only source was9082f65030b1f87dc4c98e48471a50747cd60ba6
on `dev/portable-sealed-typescript`. Leaf31863bf/child7d067af/parent335c14d
have independent review58b0fd9 (integrated9082f65): materialization@2 and
protocol3/summary@2 preserve separate source/materialized digests, complete
source hardlink groups and fresh single-link copies. Current origin containment
still admits no capability; imports remain validated historical outcomes only.

All134 affected controls passed, including four actual restrictive local preparer
fixtures; they are not native-agent sealing, compiler or portable acceptance.
The separately approved hosted fixture mechanics27/27 PASS remain preparer-only.
A broad-glob harness precondition found33790 instead of33345 paths and launched
zero children/stages. Read-only diagnosis and independent700c235 corrected the
harness to real selected check inputs + additive ALL node_modules/**, retaining
33345 declared paths without changing options/dependencies/source or hiding real
installed files. Path count is diagnostic, never authority.

One corrected public-project attempt at9082f65 reached the unchanged120s limit:
UNKNOWN/PREPARATION_DEADLINE, actualSIGKILL/reaped, zero compiler/model launches.
Complete128450.60ms includes8435.04ms manifest work. The retained partial stage
has20618 regular files/2307 directories/0links/237549566bytes. This establishes
unfinished staging, not the responsible per-operation cost or a usable tree.
No partial was removed and no receipt/state was touched. Private resultSHA
4384da57f7a02d3a49a333c72d0029f4d17027d97695a12c9e9e2bc6929eebf3;
partial metadataSHA6bfdfffe84f9717f3e784494786d43efea12c6ca508560b0c83ccb0f321da91e.

Root's test-only fixed diagnostic5dd1316 awaits independent review before use:
static aggregate source/stage/boundary operation counts/times, no paths/bodies/env,
bounded32frames/64KiB and unchanged fixed120s/empty-environment prep scope.
Normal child/protocol unchanged. Do not raise deadlines or omit validation to
fit. A owns a synthetic native stage checker (pure controls only, mapping still
NOT_IMPLEMENTED); C reviews Apple alias/mapping constraints and critical changes.
Root owns shared interfaces and policy. Disabled exact stage-parent policyc359f59
passed independent reviewb5163f4; source-derived ancestor guards do not prove seal
or protect unrelated ancestor resolution candidates.

Next: review/run one bounded diagnostic to locate unfinished copy cost; finish
reviewed synthetic stage/mapping prerequisite and complete actual staged compiler
namespace before any native/model origin claim. Claude's previous hosted six-check
diagnostic stays CLOSED/scopedPASS. Copilot Actions included capacity remains
PENDING. G1/G2/G3/prepublicationG4 are incomplete. Alpha.11 frozen artifacts remain
unchanged/unpublished; alpha.10 pilot untouched. Day0 and72h checkpoint unchanged;
blocked duration/forecast completion are not fabricated. No new trust/signing,
model, main merge, package publication or permission expansion has occurred.

## Prior checkpoint — approved sealed-input implementation; no new authority yet

The owner approved D12's explicit opt-in sealed-input TypeScript direction.
The integration worktree remains `redue-portable-ordinary-boundary`, now on
`dev/portable-sealed-typescript` from preserved containmentb3b4985. Root owns
shared interfaces; A owns the data materializer; C independently reviews critical
boundaries. Reviewffa53f9 is integrated as8713614. Existing portable origins
remain incomplete and accepted imports history-only; no old evidence is relabelled.

A's first leaf037f6da exposed a nonsecret ancestor-swap outside read, path-based
cleanup race and unbounded final enumeration. Repair4869269 retains partial stages,
bounds enumeration and rejects physical case-alias containment. Its32 passing
controls are data mechanics, not sealing. Independent successor review is pending;
the real outside-read limitation remains a required preparer-boundary task.
A copied file manifest does not prove empty-directory, absence or compiler-query
namespace equivalence. The new staged recipe must independently establish them.

Next: review/integrate the repaired leaf; implement a fresh non-authoritative
recipe preview and narrow trusted preparation boundary; test actual restrictive
native stage enforcement only after independent security review/prerequisites.
No model, CI signing, producer-trust expansion, public release or permission
relaxation has occurred. New origin/recipient applicability is NOT established.
Claude's prior diagnostic remains scopedPASS; Copilot Actions included-capacity
fact is pending. G1/G2/G3/prepublicationG4 remain incomplete. Day0 and72h checkpoint
stay unchanged; staging cost and blocked duration are not invented. Alpha.11
frozen artifacts remain unchanged/unpublished.

## Prior checkpoint — portable origin continuity withheld after actual mapped-input FAIL

The reviewed fixed CI-only vnode successor [38295197761](https://github.com/msiric/redue/actions/runs/38295197761),
source3768433fd3942fadc54e104cd639045baf18116c, completed all six cases.
Read-only control stayed quiet; membership/ancestor create-delete, hardlink
change/restore and root rename/restore produced their expected target hints.
A MAP_SHARED mapping was already dirty before registration and remained open:
the owned source bytes were observed as B and then restored to A, but the watched
leaf count stayed1 and serial stayed3 at the final case drain. The leaf also
stayed1 after root rename; only parent/root counts rose. Result FAIL, not UNKNOWN.
Both child processes exited0/no signal/reaped/protocol-clean and owned cleanup
completed; those lifecycle facts do not repair missing interval coverage.
Private result `.local/portable-evidence/vnode-38295197761.json`, SHA256
20b0ce266eb13ead254ff083851c5c945576a89e1358dd188dcf464b5bbefd39.
Actual native17d58b9f/62680B, sourcef9141387; 2034.906ms is not economic timing.
The earlier startup UNKNOWN38294279844 remains intact. No models or compiler
verification ran in either native-guard fixture; native compilation is separate.

Independent actual/source review c2c7b71+a8adfb5 extends the unsupported continuity
concern to unrestricted unreleased @2 origins, including in-root/noLib inputs.
Separate endpoint manifests/probes/history cannot establish every unreported
mapped A→B→A during verification. This is NOT a wrapped false-CURRENT reproduction,
a released-package defect, or a claim that historical signed executions were false.
No further FSEvents/vnode retry or wait-as-authority is justified.

Root now uses this same integration worktree on `fix/portable-origin-interval`,
from preserved ordinary branch4deb137. Focused containment adc9a12+7a51686
introduces an internal interval policy that currently admits no capability.
New portable capture is incomplete with PORTABLE_ORIGIN_INTERVAL_UNSUPPORTED;
accepted imports retain validated PASS/FAIL history but cannot authorize CURRENT.
New/cached clients also withhold older observers' nested green decisions and
recompute summaries. Ordinary configured execution/local contracts remain intact;
other checks without accepted imports are not withdrawn. No schema mutation,
old receipt edit, producer trust expansion, signing, publication or permissions change.
Independent final containment review reports GO at7a51686:46/46 affected tests
pass, including two real configured runs and normal observer restart; seven
independent data/filesystem controls pass. No experimental collector or model
was launched by the reviewer. Its scoped reviewa58acca is integrated;
no main merge or goal readiness is implied.

Actual local controlled runs now record true PASS and FAIL, preserve the first
immutable run and select the later FAIL after restart (10/10 controls,4.31s).
Conditional pure comparison/catalog/budget36/36 and repaired runtime-inspection/
presentation19/19 pass separately. Prior shared run28/29 includes the retired
caller-authority assertion failure; its affected real full/warm/independent/
forged/malformed inspection controls remain positive after correction. Invalid
state basename and overlong socket-path setup failures are retained and launched
zero verification commands. Final receipt/client/ownership/unavailable-run/presentation regressions21/21
pass56.05s, after the cached-field correction.
No claims of portable qualification follow from these containment tests.

Measured runtime comparison remains historical: warm median36.427→21.606s;
cold37.602s still exceeds35s. The new refusal is NOT a faster supported reuse
path or an economic improvement. Ordinary debugger remains unsupported. Fresh
signing/model handoff waits for a sound origin basis; Copilot included Actions
capacity is still a separate pending fact. Hosted Claude prerequisite is closed
PASS within its six synthetic assertions; actual cross-agent reuse remains NOT_RUN.
Alpha.11/frozen artifacts remain unpublished/unchanged. G1 origin completeness/G2/G3/prepublicationG4
are incomplete. Day0=2026-10-10 21:24UTC and72h checkpoint are unchanged;
Day14/28 forecast is conditional on a reviewed sound origin boundary and capacity,
not reset or met by weakening gates. Unmeasured blocked duration is not invented.

## Prior checkpoint — vnode startup UNKNOWN; source correction under review

One fixed CI-only vnode fixture attempt [38294279844](https://github.com/msiric/redue/actions/runs/38294279844)
used sourcee3c8c02fe5a575c5a0f9b8620beffc5029398522. It returned UNKNOWN before
any mutation case: the native child exited74 without an accepted ready response.
The mapper exited0/protocol-clean; both children were actually reaped and owned
files cleaned. Complete1254.088ms is not economic timing. No compiler/model,
signing, uploads, producer-trust or agent-permission changes occurred.
Private scoped result `.local/portable-evidence/vnode-38294279844.json`, SHA256
05c875881aac1d957167cd1486db4203da298c28e2b341330097e4bb26f4a78b.
Actual test-only native binary142b405b/62680B differs from the local build.

The fixed driver had independent30 pure/9 VM controls and108 local shared controls
passing; these are not actual native enforcement or interval acceptance. The
startup reason was discarded by the first driver. Bounded fixed-code reporting
is under review; no protected content is retained. Pinned XNU source review
identified an overly strict EV_RECEIPT flag expectation in the test-only helper:
returned receipt preserves the original request flags and adds EV_ERROR. The
actual first attempt cannot establish this as its cause. Correcting that exact
ABI expectation requires pure controls/independent review before a different run.
FSEvents interval NO-GO remains; no ordinary-engine qualification is enabled.

Hosted Claude diagnostic remains closed PASS in its actual scope. Ordinary
debugger portable qualification still rejects the ancestor interval boundary.
Warm recipient median21.606s/cold37.602s stay distinct;35s model gate remains
unchanged and fail-closed. Copilot included Actions capacity fact is pending.
Alpha.11 stays unpublished, original bytes/receipts/history preserved. Day0 and
72h checkpoint unchanged; G2/G3/prepublicationG4 are incomplete.

## Prior checkpoint — FSEvents interval NO-GO; bounded vnode test-only work

The original CI provider38287392906 FAIL is retained. Fixed ROOT/OWNED delivery
diagnostic38289084959 collected late matching events in both classes; neither
established immediate continuity. Explicit diagnostic serial queue drain in
[38290903554](https://github.com/msiric/redue/actions/runs/38290903554),
source091b56ef35f72da576647f25ea3eaada5d3983a5, also failed to advance immediately
relative to each action baseline; later samples advanced. Drain's first action
baseline was already1 after START0, with an unexplained pre-action occurrence.
Do not attribute all later increments uniquely to a mutation or a deeper kernel/
service/queue phase. Both actual children exited0/no signal/reaped/protocol-clean;
owned cleanup completed. Complete diagnostic11412.776ms is not economic timing.
Zero models, compilers, uploads, signing, new trust or publication.

Private result `.local/portable-evidence/ancestor-queue-38290903554.json`, SHA256
cf0851abafb56329260f4fd6ed22638d2c4529aa99b41ad01448b3ddc4f96231.
Actual CI diagnostic binaries15a4eda7/81528B and4c329089/81784B remain distinct
from local builds. Sourcea7e766b3; production39cc/80984B is byte-identical and
unwired. Independent actual review9666179 retains NO-GO for @3 completeness.
No more FSEvents attempts or wait-based currency. The ordinary debugger still
rejects PORTABLE_EXTERNAL_INPUT; its59 libraries are inside the checkout.

Root's integration worktree/branch is `redue-portable-ordinary-boundary` /
`dev/portable-ordinary-boundary`. A owns only a test-only vnode guard/build/pure
fixture; root owns its fixed CI acceptance; C independently reviews boundaries.
The proposed direct kernel registration is limited to exact existing locally
derived leaves/directories and approved ancestor parents, with O_EVTONLY and no
body reads. No recursive assumption, RLIMIT increase, truncation, imported seed
or scope expansion. Registration/drain/identity failure remains uncertainty.
Pre-existing MAP_SHARED/no-close-before-final-drain, hardlink mutations, restored
parent replacements and FD exhaustion are required counterexamples before any
ordinary-project interval claim. No vnode stream has been started on the owner's
Mac or CI; no qualifying engine integration is enabled.

Completed hosted Claude diagnostic remains PASS only in its original scope.
Measured warm recipient median21.606s remains separate from cold median37.602s
above35s. Copilot included Actions billing fact remains pending; no repeat
account/login question. Alpha.11 remains unpublished; all frozen bytes/receipts
are preserved. G2/G3/finalG4 incomplete; Day0/72h checkpoint unchanged.

## Prior measured checkpoint — warm recipient phase improved; ordinary interval work remains unqualified

Hosted native Claude diagnostic38257021786 remains closed PASS for its six named
synthetic assertions only. No repeated diagnostic, login or model trial. Alpha.11
is unpublished; source08307d4/artifactf6e368bd remain frozen historical exact mechanics.

Independent runtime review4367acf GO plus74/74 shared regressions preceded one
fixed installed-candidate [comparison38279556323](https://github.com/msiric/redue/actions/runs/38279556323).
Sourcef4abdd318091ac7c17119d872e189e1cf2f7a8f3, tarball
`redue-cli-0.1.0-alpha.11.tgz`, SHA-256
84edcfebbc980dacc026aac66d9f3094718267521397a15a79f015f6eb2ce871.
This is different unreleased content from f6e368bd, never a substituted identity.
Owner-local bundle `.local/portable-evidence/candidate-alpha11-f4abdd3-38279556323`
verifies all four source/manifest/checksum/tar files; ZIP162355bytes fits300KiB
reservation and confirmed10MiB included storage. Source/runtime tests and six
queries/three observer sessions pass. New Linux/Windows exact bytes are NOT_RUN.

The before/after standard macos-26 jobs both report Darwin25.6.0/ARM64/Node22.13.0;
they are separate VMs, not an identical-load randomized comparison. Before six
queries: mean37,244.049ms/median36,091.025ms/max42,103.605ms. After six:
mean29,485.998ms/median30,080.855ms/max38,233.218ms. Repeated queries(n3):
before median36,427.273ms/max38,573.658ms; after median21,605.619ms/max24,021.205ms.
First-per-observer queries(n3) remain expensive: after median37,601.512ms/max38,233.218ms,
above35s model-preflight budget. No timeout was increased and no cold fix claimed.
Three private daemon cache revalidations take median4.2ms/max6.3ms; eleven full
inspections remain, including both origin boundaries and every independent caller.
Cached OS content never supplies PASS, receipt selection, caller or project facts.
All six responses were agent-independent imported CURRENT/PASS/eligible with the
same origin and zero recipient compiler executions. These are CLI mechanics, not
actual model reuse or complete-workflow savings. Raw GH ZIP logs supplied the
structured result when gh run view omitted its long line; no raw log was retained.
Private result SHA-256221052bdfb6ff06a97f6c5456e7cf6af82b534ff5f9f9e1f2caed2a2722b849f.

Ordinary boundary branch/worktree `dev/portable-ordinary-boundary` / sibling
`redue-portable-ordinary-boundary` integrates reviewed runtime but remains under
construction. Pinned debuggerb1c00772 still rejects portable qualification;
its59 consumed builtin libraries are inside the checkout, while424 ancestor
queries need real interval coverage. Owner approves CI-only filtered observation
(D10), no owner's-Mac broad watches or expanded native-agent permissions.
Independent source review reproduced @parcel2.5.6 EventList cancellation of
create→delete for in-root and ancestor candidates. History-only endpoint/replay
shortcut is NO-GO; no wrapped false-CURRENT or affected-user claim. All locally
derived membership/query paths need raw occurrence coverage for a new interpretation.
The bounded native collector/filter leaf is source-reviewed and built, NEVERstarted.
The protected capability reader's resource race/revocation corrections pass seven
independent static controls; hostile same-UID protection still requires the trusted
CI provisioning and explicit native deny-write boundary. Wrapper/deadline/protocol,
actual CI delivery, origin/recipient integration and new ordinary-project acceptance
are pending. No provisional helper can grant reuse. Prior failed/mock/static attempts
are retained and separate from actual observations.

Copilot's included Actions billing fact remains the pending external capacity fact;
account existence/personal use are settled. Fresh authenticated origin/artifact/trust
bindings and actual cross-agent/two-machine reuse remain incomplete, as do final
V01–V22/candidate economics. No G2/finalG3/G4 pass or owner release readiness.
Day0=2026-10-10 21:24UTC;72h calibration2026-10-13 21:24UTC unchanged.

## Historical checkpoint — recipient cost identified; ordinary boundary under review

The hosted Claude diagnostic38257021786 remains closed PASS only for its six
synthetic native assertions; it is not portable agent reuse and needs no repeat.
Alpha.11 stays unpublished. Frozen source08307d4/artifactf6e368bd retain their
separate identity and successful platform mechanics; runtime WIP is not those bytes.

Fixed no-model hosted sample [38273261352](https://github.com/msiric/redue/actions/runs/38273261352)
used that exact artifact: six unchanged queries/three observer sessions, all eligible,
mean37,244.049ms, median36,091.025ms, maximum42,103.605ms. Correlated phases establish
TWO protected-cache inspections per query, caller plus daemon; each reads/hashes
5,820,973,056bytes/13members. Cache median16,897.55ms (n14 including two origin
boundaries); compiler inspection55.1ms (n111), discovery240.95ms (n14), catch-up97.3ms
(n9), trust/applicability2.4ms (n9). No inferred network cause or timeout change.
Private fixed result/summary: `.local/portable-evidence/recipient-profile-38273261352*.json`;
result SHA-25684acdd9993a81a9c1a72427e0ea0e5e0dfa244441925d891b2d0cd12d9b60aa1.
The same six-query local controlled sample has median5,683.858ms/max5,856.891ms;
this is a different host, not a portable speedup. First-per-session means observer
cold, not OS page-cache cold. A failed initial fixture established zero samples;
its original files/receipt remain separately retained.

Root owns a narrow private daemon runtime certificate WIP; full caller hashing,
compiler/context/loaded-image checks, root/input/history/catalog/receipt guards and
finite fallbacks remain. No persistent/client/imported certificate authority.
Real built-in full/warm/caller/forged-content/malformed-input controls6PASS14.2s;
actual daemon bad-proof/client-poison/restart control1PASS26.0s. Earlier fixture
and mock scheduling failures are retained in private TAP records, not native or
product correctness claims. Independent runtime review4367acf GO and74/74 shared regressions are complete.
A fixed same-label candidate before/after sample is prepared after independent
workflow/helper review; exact after measurements remain pending, no speed claim.

On pinned vscode-js-debugb1c00772, all59 consumed built-in libraries are inside the
checkout. The blocked boundary is424 outside ancestor resolution queries, not
missing default-library files. An owned actual compiler A/B/A control shows ancestor
library replacement can change outcome. It is not a REDUE false-CURRENT reproduction.
Owner now approves narrowly filtered CI-only ancestor observation, including required
parent subscriptions through `/`; no owner's-Mac watcher authority or agent permissions
expand. Agent A owns the exact query-only leaf; C independently reviews it. The leaf
remains explicitly non-authoritative until an adequate interval barrier is implemented.
See [boundary evidence](../acceptance/portable-ancestor-resolution.md).

No model has launched. Actual cross-agent/two-machine acceptance, fresh authenticated
origin/artifact/trust bindings and complete-path final economics remain incomplete.
Copilot's four Actions credits' included-billing fact remains pending; account existence
and personal-use approval are settled. Claude account/secret/setup/native diagnostic are
complete. Failed preconditions still launch zero models. G2/finalG3/G4 are not passed.
Day0 remains2026-10-10 21:24UTC;72h calibration2026-10-13 21:24UTC is unchanged.
No fabricated whole-goal blocked-time total or release readiness is claimed.

## Historical checkpoint — native diagnostic and alpha.11 exact installed mechanics PASS

Actual hosted native Claude2.1.187 diagnostic
[38257021786](https://github.com/msiric/redue/actions/runs/38257021786) passed all
six named synthetic boundary assertions, with matching native tool/result and
independent socket collection, checker/native exit0 and complete persistence.
Independent actual-result review1445b52 and source closure7a3e167 are complete.
This is scoped native diagnostic evidence, not portable applicability or agent reuse.
Previous UNKNOWN attempts and the local manual checker remain historical records.

Controlled Claude guidance now uses a reviewed local memory import, hard-pinned
shared policy, exact config/state command bindings and an explicit read-only generic
preflight. Critical review0527a3c covers the closed import/protection/routing boundary;
57 targeted controls pass with one Windows-only branch skipped locally. The actual
installed no-model preflight uses preserved b812 candidate and isolated
`.local/pe-generic-d626`: managed integration intentionally absent, generic guidance
intact, real observer healthy, selected config/state correct, no receipt and
UNVERIFIED/non-eligible as expected. Independent806d9f0 classifies that mechanical
result; no check or model executed. The owned observer is stopped; state/history
remain. The earlier long-path fixture failed before establishing an observer and
retains its separate record; its precise stderr was not captured.

Prospective unpublished alpha.11 source08307d4 is normally pushed only to
`dev/portable-native-event-capture`; the signing ref remains unchanged atd04b872.
Independent source/version gate review2a29e12 passes14 mocked HEAD controls.
One [exact-package matrix38266596921](https://github.com/msiric/redue/actions/runs/38266596921)
confirmed registry404 before packing once. Actual filename
`redue-cli-0.1.0-alpha.11.tgz`, SHA-256
`f6e368bd8171412b301f3f5dee3ceebea14da3b3418968504a7a49428e5876a0`.
Owner-local four-file manifest/checksum/source bundle:
`.local/portable-evidence/candidate-alpha11-08307d4-38266596921`.
Tarball158970bytes/80files; intended source/docs, Apache-2.0 and executable redue
verified; independent d7795ed/all80 payload-file agreement confirms source and
63 unchanged src/bin leaves. The matrix completed PASS on macOS, Linux and native
Windows. Actual alpha.10→alpha.11 same-prefix upgrades preserve immutable receipts,
config/state and user text; edited managed content refuses update/removal. Setup
legitimately returns STALE on all three platforms rather than promising continuity.
Mac controlled noLib origin and independent same-machine checkout establish
imported CURRENT/PASS/eligible; cached status is UNVERIFIED/non-eligible, unrelated
edit preserves imported CURRENT and relevant edit is STALE/non-eligible. The
recipient executed no compiler. These are scripted mechanical results, not actual
agent decisions or two-machine reuse. Independent terminal-result review
a2ee9ff confirms the actual records and these limits. Per-command timings are
retained, but this run has no matched plain-compiler/transport/model comparison
and establishes no economic benefit. The three recipient synchronized queries
took34,375.326/37,567.483/39,013.187ms (n3, mean36,985.332ms). The current
host-preflight subprocess cap is35,000ms: future in-context gates may timeout
conservatively. The responsible phase was not established. No deadline, runtime,
security rule or eligibility requirement was changed to manufacture a pass.

Private structured results in the same bundle: `acceptance.json`, SHA-256
`f8c3b4ea92137c1b9cf973cff64607519a44b00284fe7513939058c015660418`;
`macos-installed-mechanics.json`, SHA-256
`a36dcede5b2a703856ccc5e4cfacbda484241a87908cf1ea65d9faa738f2c674`.
Raw logs were parsed in memory, not retained; public summaries carry only reviewed
static fields. The actual ZIP160887bytes fits the224KiB reservation and included
10MiB limit; one-day retention. The dispatch ledger is COMPLETED_PASS. No candidate
publication, signing, new trust, account changes or additional model calls.
The older b812 and frozen8695 artifacts retain separate identities.

G1's separate-checkout technical slice and historical authenticated data-only
machine route remain evidenced; final G2/G3/G4 are incomplete. Actual portable
cross-agent/two-machine reuse, final current signed origin/trust/profile, recipient
model boundary and final alpha.11/actual-agent complete-path economics remain
unestablished; the earlier frozen8695 measured sample remains historical cost
evidence, not a saving claim. Copilot Actions'
first4 AI credits still need the actual included-billing fact; account existence and
personal-use approval are settled. Claude setup/login/secret and the completed
native diagnostic need no repetition. The recipient remains disabled and failed
preconditions launch zero models. External field usage NOT_STARTED.

Day0 remains2026-10-10 21:24UTC; calibration2026-10-13 21:24UTC is a checkpoint,
not the final goal or a reason to wait. The captured Claude authentication block
12:26:22→12:38:00UTC is a lane interval, not a fabricated whole-goal blocked total.
Day14/28 forecasts remain conditional on actual model/final-origin gates. No
READY_FOR_OWNER_RELEASE_REVIEW or public-alpha completion is claimed.

## Historical native lane — empty-policy sentinel repair awaiting independent review

Actual hosted [run38252736249](https://github.com/msiric/redue/actions/runs/38252736249)
on source3e5e946/workflow35a5ddf establishes the six named synthetic assertions
PASS, checker/native exit0/no signal, two turns and matching tool/result
`toolu_018MP73qNiKcfBKm69KddWAz`. Independent socket collection matches;
protocol[1,0,0], controls/source/reaping/cleanup/persistence pass. Collection
9,380.947ms, complete job27,397ms. Overall UNKNOWN remains: the final guard
identified ISOLATED_REMOTE_SETTINGS / AFTER_NATIVE. Its bytes were not captured;
never retrospectively describe that historical cache as empty. Private exact
report SHA-256 fbb3deb9d7e4d0aabd6f75b0542abe860a3ef6fea8cab4ee9a409c88253f6903.

Repair49b3f44 (helper SHA-256
93aa3a0ccc8d92161d6c1b7d898216af0c6c7e3423e01d5e3c43ed40d39fb105)
retains fresh startup absence and every other source refusal. Only after the
frozen pinned187 print process exits0/reaps within its bounded lifetime, with
unchanged source and live controls, may the post guard accept the canonical
owned0600/single-link/regular two-byte empty sentinel. Missing, malformed,
nonempty, replaced or unsafe files withhold acceptance. No policy body is parsed
or published. Full lifetime/source closure is required: one successful preAction
fetch, failed retries apply no settings, print excludes login callbacks and
one-hour polling cannot occur within120 seconds. An accepted nonempty policy
cannot be salvaged into that empty serialized sentinel. This is not a generic
remote-policy verifier or protection against arbitrary same-user writers.

22 pure/mock controls PASS99.2ms; they are not native enforcement. Independent
critical review is pending before enabling prepared workflowdc9728a,
SHA-2561171946b2ee119f2c047c7b23422989738a1873dd7994f75dfb1859ba5fac85c.
Only its source pin changes; permissions/settings/argv/runtime/account/capacity,
4turn120s/$0 and no-artifact/signing scope remain fixed. Fresh protected metadata
shows no active diagnostic, secret updated12:38:00Z and unchanged account fact
11:09:43Z. No repeated owner setup is requested. One delegated public-source task
hit model capacity; root proceeded sequentially with the existing independent
reviewer, without capacity bypass. G2/finalG3/G4 remain incomplete; Copilot Actions
included capacity and a fresh exact signed origin remain separate gates. Day0
and calibration checkpoint are unchanged. No publication or main merge.

## Historical native lane — six empirical checks PASS; final startup-source guard UNKNOWN

Actual hosted [run38251411464](https://github.com/msiric/redue/actions/runs/38251411464)
used reviewed source7870dd1/workflowd8cd842 and the replaced owner secret. Native
init validated, eight numeric progress frames were admitted, two assistant
messages/two reported turns included the exact authorized Bash command. Matching
tool IDs toolu_01W5hnaJ1QLzWWPs97kLXDhf and independent socket collection establish
actual checker execution. All six synthetic assertions PASS; supervisor-observed
checker exit0/signalnull, native exit0/signalnull, delta[1,0,0], matchingreports,
sourcecurrency/livecontrols/reaping/listenercleanup/finalpersistence alltrue.
Collection10867.727ms, totaljob28138ms; no raw transcript/token body retained.

Overall collection_status remainsUNKNOWN / DIAGNOSTIC_STARTUP_SOURCE_PRESENT.
The post-native absence guard found a protected startup-source path; which fixed
role was not captured. Don't infer remote policy, credential cache or project
content, and don't waive the guard or label the full native prerequisitePASS.
Six assertion successes establish only their named operations; no real credential
body was opened, no portable applicability or recipient reuse was tested.
Private exact report `.local/portable-evidence/native-diagnostic-38251411464-final.json`.

Metadata-only repair3e5e946 preserves all ten original paths/order/lstat/refusals,
adding only fixed finite role and BEFORE/AFTER_NATIVE phase to the existing error.
No body is read; arbitrary error fields cannot enter the fixed-role projection.
Root19pure/mock controlsPASS (latestTAP retained); independent review pending.
Prepared workflow35a5ddf, SHA5f2c9f936b46d8e7759784b8fd610342333df072cefa08c6e6c4fc3e52f1ab6f,
changes only this source pin. After independent GO/fresh gates, one bounded
role-capture attempt under standing authority can identify the missing fact.
No token replacement, owner hash approval, permission relaxation or new trust is
requested. All earlier failures/unknowns remain immutable. $0/4turn120s, no
uploads/signing/publication. Copilot Actions included capacity remains separate;
G2/finalG3/G4 incomplete. Day0/checkpoint unchanged.

## Historical native lane — secret replaced; pinned thinking-progress repair under review

The owner replaced the protected OAuth secret at2026-10-12T12:38:00Z; only metadata
was read. Fresh environment/ref/source/account/capacity gates passed. The unchanged
reviewed runtime's bounded [run38250370384](https://github.com/msiric/redue/actions/runs/38250370384)
completedUNKNOWN: validated native init, first rejected thinking_tokens AFTER,
no observed assistant/tool/checker result, delta[0,0,0]. Noapi_retry/401 appeared
before the stop; this is not an OAuth validity certificate or retrospective fix.
Nativeexit143/signalnull, source/livecontrols/reap/listenercleanup/persistence true,
collection3444.185ms/job19463ms. Private exact report:
`.local/portable-evidence/native-diagnostic-38250370384-final.json`.
No repeated credential action is requested; don't regenerate tokens for this
parser refusal. The known authentication input block12:26:22→12:38:00 is distinct
from current protocol work; it is not a whole-goal blocked-time total.

Pinned187 public emitters210399315/682 generate thinking_tokens as live numeric
progress, with no permission/policy/hook authority. Small repair7870dd1 admits
only exact six-key bounded progress in the validated native session, before final
and without any prior error; only a count is retained. Missing init, invalid/mixed
session, unexpected fields, nonfinite/out-of-bound numbers and4096-event overflow
stayUNKNOWN. Progress is not assistant/tool/checker evidence or a PASS basis.
Hooks, api_retry and unknown events still stop. Root18mocksPASS89.6ms; independent
critical review pending, as is its source-only workflow pind8cd842/SHAa0c5c5f34022f8011dc68307de214f4b66b597bd0918a501d7819fa19046c0ea.
No runtime/bin, checker assertions, credentials, permissions, cost limits or
producer-trust changes. After independent GO and fresh gates, one bounded native
attempt may proceed under standing authority, with normal required GitHub review.
All earlier attempts remain preserved; no G2/recipient model reuse is established.
Copilot included Actions billing stays separate/pending. No publication.

## Historical native lane — HTTP401 authentication refusal; no further unchanged attempt

The bounded cause-capture [run38248933839](https://github.com/msiric/redue/actions/runs/38248933839)
completedUNKNOWN on source85425a5ca5a1a1df8eb1c7e1f56ca7cd5405a107 / workflow
babf43bd0ed25fb6e9567e14ae5a23178084436f, SHA-256
159acc8c945a329fb2a0785366e8cb377ec79d78bec9553047d0eefc149773a3.
Normal configured GitHub review was approved through the supported API under
owner standing authority; protections were neither changed nor bypassed.
Actual validated init was followed by api_retry AFTER_VALIDATED_INIT with
category authentication_failed, HTTP401, attempt1/max_retries10; delay is
UNAVAILABLE under the bounded numeric projection. The parser stopped as designed.
Zero assistant/tool/checker reports were observed; this is not proof of zero
model requests. Assertions, checker exit/signal and hosted enforcement stayUNKNOWN.
Nativeexit143/signalnull is separate from checker outcomes. Livecontrols/source/
reaping/listenercleanup/finalpersistence allpass, protocol[0,0,0]. Diagnostic
1,131.455ms, totaljob15,843ms. Private exact report:
`.local/portable-evidence/native-diagnostic-38248933839-final.json`.

This establishes a provider authentication refusal for the provisioned native
request; it does not establish expired versus revoked versus malformed token,
account capacity or billing failure, nor a REDUE/sandbox defect. Do not retry
unchanged credentials, switch authentication route or relax native/host policy.
The older attempts remainUNKNOWN with their original limited fields. Current
helper/environment/workflow wiring preserves the nonempty protected OAuth input
into the native parent, without printing or writing it. No API-key override or
credential-store copy was introduced. Static/source checks are not OAuth validity.

The next owner-only action is to generate a fresh subscription token using the
already-reviewed isolated setup-token command and replace only environment secret
CLAUDE_CODE_OAUTH_TOKEN in portable-evidence-claude. No account-existence question,
new secret scope, PAT/API billing, policy change or repeated setup is needed.
Read-only launcher verification freshly confirms binarya59/settings5628 and
existing Keychain metadata; it launches no native process and proves no token
validity/enforcement. The exact owner command is:
`/bin/bash "/Users/mariosiric/Documents/redue/.local/portable-evidence/claude-owner-setup-token-reviewed.sh"`.
Keep token values out of chat/files; provisioning uses the supported private owner
interface. After actual secret metadata changes, fresh gated diagnosis may resume
under standing authority; no fixed result, protocol acceptance or trust is waived.
Original owner account/capacity timestamp remains unchanged and expires normally.

Observation repair85425a5 passed independent17mocks/75differential cases in
f8fe190/rootb374f97. Its source-only workflow pin passed8e034e0/root1456c1a.
Root17mocks pass84.2ms. These are harness/source results, not native enforcement.
One preflight GitHub read returned502 before mutations/ledger/model, followed by
a successful ordinary read; it is distinct from the captured ClaudeHTTP401.
Independent actual-result/wiring review f7a47ca/rootb9e60c8 confirms the HTTP401
classification and unchanged nonempty-token route, without reading credentials.
A fresh metadata read at 2026-10-12T12:33:15.680347+00:00 still finds the OAuth secret updated only
2026-10-12T11:09:43Z, before the refusal. No repaired input is established. The
single owner credential-replacement request is already pending; do not repeat it
or launch a model until the actual prerequisite changes. Known Claude auth block
began at the recorded refusal2026-10-12T12:26:22Z; earlier causes stayuncaptured.
No blocked-hour total is inferred. This resume checkpoint performs only read-only
metadata and review integration, not another diagnostic or preparation milestone.
All three hosted attempts and one-operation ledgers are preserved. No publication,
new signing/origin/trust or recipient model acceptance. Copilot included Actions
billing remains separate/pending. G2/finalG3/G4 incomplete; Day0/checkpoint unchanged.

## Historical native lane — retry event identified; enforcement remains UNKNOWN

The owner authorized continued bounded diagnosis and autonomous routine work.
Normal protected-environment review was completed through GitHub's documented
pending-deployments API as configured reviewer msiric, using that explicit owner
approval. No protection rule was changed or bypassed. The single follow-up
[run38246645326](https://github.com/msiric/redue/actions/runs/38246645326), source
ed4219aa6eef8f3addd97fd8a1510ef51396215d / workflow7deb7d2, completedUNKNOWN.
Actual native initialization was validated. Its first rejected event was
api_retry AFTER_VALIDATED_INIT. No assistant message/tool/checker result was
observed. Nativeexit143/signalnull, livecontrols/source/reaping/cleanup/persistence
true, delta[0,0,0], job15,157ms and collection2,652.174ms. Private actual report:
`.local/portable-evidence/native-diagnostic-38246645326-final.json`.
The earlier38242312293 event subtype remains NOT_CAPTURED; do not relabel it.
Zero assistant messages does not prove zero model requests.

The actual retry event establishes neither an HTTP status nor an account/billing/
connectivity cause: those fields were not retained. After the two different
attempts, independent evidence review precedes further execution. A second small
observation-only repair85425a5 projects only the five pinned187 F7r categories
and bounded numeric protocol fields, never messages/URLs/environment/token values.
It still rejects/stops and cannot produce PASS from the retry event. Root17mock
controls pass; independent review pending. No unchanged diagnostic retry, new
permission/authentication route, raw transcript or publication is authorized by
this observation. Native enforcement and recipient model acceptance stayUNKNOWN.

The original account/capacity timestamp remains unchanged; protected nonsecret
source binding was the only variable change and is separately recorded. $0,
4turns/120s and all prior resource/trust boundaries remain. Copilot capacity is
independent and pending. G2/finalG3/G4 incomplete. Continue only a reviewed,
new-evidence diagnostic refinement under standing authority, never a blind loop.

## Historical native diagnostic — actual hosted result UNKNOWN; classification repair under review

The owner approved the required environment review. The single hosted
[run 38242312293](https://github.com/msiric/redue/actions/runs/38242312293)
completed with workflow failure at 2026-10-12 11:33:11 UTC. Owner prerequisites,
pinned binary preparation and source checks passed. The actual structured report
is UNKNOWN / NATIVE_SYSTEM_CONTEXT_UNKNOWN: native startup was observed, but
zero assistant messages, no tool/result IDs and no checker report were observed.
Checker exit/signal and assertions remain UNKNOWN. Native exit was 143 with
signal null; that value alone does not establish its cause. Both live controls,
source currency, native reaping, listener cleanup and result persistence passed.
These lifecycle facts do not establish enforcement. Protocol delta was [0,0,0].
The total job clock reported 17,894 ms; diagnostic collection took 1,622.962 ms.
No raw transcript or secret value was retained. Exact source is da0b1080f3edcc68f3d4067cb51f961759e68312,
workflow SHA-256 a5f4e589823844144203e98151d315cd785f6d7d09212a720749618789e43e72.

Private actual report: `.local/portable-evidence/native-diagnostic-38242312293-final.json`.
The exclusive dispatch ledger records COMPLETED_UNKNOWN. Do not rerun this run
or dispatch again under the consumed one-job authorization. Actual rejected
subtype and event ordering were not retained; neither source inspection nor
exit143 can reconstruct them. A classification-only helper repair now records
only pinned literal subtype names (others use a fixed unknown code), and whether
the first rejected event preceded validated init. No event is newly admitted;
rejection, termination, checker assertions, permissions, OAuth handling and PASS
criteria are unchanged. Root's sixteen pure/mock controls pass. Independent review bd0d4b8/root14716c8
also passes sixteen controls and92 differential cases with unchanged rejection,
settings and outcome rules. Reviewed helper source ed4219aa6eef8f3addd97fd8a1510ef51396215d,
SHA-256111e54cc2f76c1cb5c540fb266d606c712a521736e3ef0bc4ed75291ef31f683,
is normally pushed on dev/portable-native-event-capture. Prepared workflow
7deb7d26e9a51c05592043a7304ce384760850d8 is normally pushed on
 dev/portable-native-event-workflow, SHA-25608ffcc4030772089175f35167b507602b7399e7368d21f343ea79a92fc934fa0.
Independent preparation review200f926/rootf0cbd27 confirms its sole change is the
source pin; all limits, permissions, token scope and boundaries remain unchanged.
The live dispatch ref and protected owner facts have not changed. No new native
or model operation has occurred. These mock/source checks do not establish native
enforcement. A single additional bounded job requires an owner allowance because
the previous one-job limit was consumed; do not ask for login or repeated setup.
After that allowance, update only the reviewed source binding, preserve account
facts/timestamp, verify the normal protected environment gate, and dispatch once.
If owner facts expire, fail closed rather than fabricating a fresh attestation.

Copilot's included Actions billing fact remains a separate pending prerequisite.
G2/final G3/G4 are incomplete; no recipient model trial or publication is unlocked.
Day 0 and the 72-hour calibration are unchanged. Preserve all earlier results.

## Historical native diagnostic — owner provisioning verified; one run awaiting review

On 2026-10-12, the owner completed the protected Claude setup. Read-only GitHub
metadata confirms the required msiric review, the sole dedicated branch policy,
the two expected nonsecret variables, and OAuth secret presence (value never read).
The exact owner statement passes the reviewed activation validator; its digest is
cc4228e4d5d5c6a57538ff23f034b34d82ee27592157e62c7b2b3c29c45fb7ef.
Registered workflow SHA-256 a5f4e589823844144203e98151d315cd785f6d7d09212a720749618789e43e72
and pinned helper/assets/source da0b1080f3edcc68f3d4067cb51f961759e68312 remain unchanged.

No prior diagnostic existed. The single approved dispatch is
[38242312293](https://github.com/msiric/redue/actions/runs/38242312293), created at
2026-10-12 11:23:15 UTC on da6b87f67ae8e80b6ce92a0636fac8a9c11261b7.
It is waiting for the required portable-evidence-claude environment review;
no model has started. The private exclusive one-operation ledger is
`.local/portable-evidence/native-diagnostic-dispatch.json`. Do not dispatch again.
After owner review, collect this same run's actual structured checker and native
tool/exit/lifecycle evidence. Keep four turns, total 120 seconds, $0 additional
spending, no uploads/signing/trust changes. Metadata validation is not empirical
enforcement; diagnostic PASS would unlock separately gated recipient work, not G2.

The prior three-turn blocked audit below is historical: Claude provisioning now
unblocks this lane. Copilot's Actions included-credit fact remains separate and
pending; no repeated account request is needed. G2/final G3/G4 remain incomplete.
Day 0 and the 72-hour calibration are unchanged. No publication is authorized.

## Historical blocked audit — owner-only acceptance inputs unchanged across three goal turns

The previous two goal turns made real progress (registration/diagnostics, then
completed platform acceptance). In allthree turns the same native policy/quota/
protected OAuth and separate Copilot Actions included-credit prerequisites
remained unavailable. This turn revalidates GitHub environment count0, native
workflow dispatch listempty, and both known CI handles completedSUCCESS. All
subagents are terminal. This is not a live-process wait or a product test failure.
No safe meaningful independent task remains without those inputs; do not create
another implementation/preparation milestone or rerun completed tests.

Completion audit: G1's export/separate-checkout slice and historical authenticated
CLI transfer are evidenced; G2's actual two-agent/two-machine reuse is absent.
FinalG3 needs a fresh reviewed/authenticated model-produced origin and recipient
trust/evaluation; the old artifact expired. G4 still needs actual behavioral
V01–V22 coverage, complete-path economics and final versioned bytes/onboarding
bound to that implementation. Current platform/regression/review results alone
cannot establish those requirements. No public-alpha gate is complete.

The coordinator marks the existing goal BLOCKED after this three-turn audit,
without replacing the objective. Resume on actual owner policy/quota/OAuth
provisioning or Copilot included-capacity evidence through the existing checklist.
No new owner question is sent. The smallest first action remains the reviewed
protected Claude environment and subscription OAuth setup; this unlocks only the
one bounded native diagnostic after its fresh preconditions. Preserve all failed,
unknown and positive records, frozen artifacts, trust and host/budget boundaries.

## Historical CI checkpoint — reviewed code regressions and package pass; model prerequisites pending

Reviewed test-only diagnostic source de37055d6436f870c907e35fbc65be69e9301452 is
normally pushed to dev/portable-ci-preparation; PR13 stays draft. Product38199960090
passes allfour jobs,569tests each: macOS542PASS/27skip, Linux22/24 each530PASS/39skip,
nativeWindows344PASS/225skip, zero failures. Exact-package38199960095 passes allthree
platforms. Independently downloaded merge-source13ba3eb267ddd7000d4adebd376954990fb3b8b7
has tree9a1081a601bf63de05e6f7df8f11d11959448e67 equal to de37055. Actual tarball
SHA-256b8122c3bdcedf42a374ba3a87681ca7654360bc6c10daa64b5ac93a79ca7b190
remains unchanged, distinct from frozen8695b612/publicalpha.10. These are
platform/installed mechanics and regressions, not model or two-agent acceptance.

Earlier38196115475 Windows failures/cancellation and38199273160's one bounded
non-reproduction are preserved. Three capped traces are UNKNOWN. This later full
PASS does not establish the original stall's cause or a runtime fix. No further
unchanged CI/capture is needed. Runtime/bin and accepted signing/trust bindings
remain unchanged. The owner request is already pending; environment read still
finds0environments. No secret, native hosted diagnostic, model or new origin ran.

Remaining task blockers: hosted Claude personal-policy/current included-quota and
protected OAuth provisioning; separate Copilot Actions four-credit billing fact;
a fresh authenticated model-produced origin and concrete producer acceptance
following review, never substitution of the expired old artifact. Preserve the
hosted pair, closed preflights,$0cap,10MiB/one-day storage and Day0/72h calibration.
G2/finalG3/G4 are incomplete; this is not READY_FOR_OWNER_RELEASE_REVIEW. No useful
model operation is authorized by static/source/configuration evidence alone.

Next: accept only actual owner-only facts/provisioning; revalidate exact registered
workflow/hash/source and one-operation ledger, then the bounded native diagnostic.
Its PASS unlocks separately gated recipient evaluation, not G2 completion. Until
then do not repeat the owner request, create another host/controller, broaden scope
or launch missing-precondition models. This documentation checkpoint is committed
locally; defer its docs-only push until the next meaningful reviewed change, avoiding
another full cumulative-PR CI run. Tested code de37055 is already on the remote.

## Historical checkpoint — reviewed manual workflow registration; owner-only inputs isolated

Registration PR14 adds only a manual workflow to currentmainb4f2860. Commit68f1416,
SHA-256a5f4e589823844144203e98151d315cd785f6d7d09212a720749618789e43e72,
pins the reviewed task source da0b1080f3edcc68f3d4067cb51f961759e68312. Independent
review8ebab74/root33c9f0d confirms exact template derivation, 15/15 frozen mocks,
manual-only/ref/actor/attempt1 guards, contents:read and4turns/120s. Registration
cannot launch a model. Allfour PR14 revision checks pass; normal merge completed
asda6b87f67ae8e80b6ce92a0636fac8a9c11261b7 under the standing authority. The dedicated
dispatch branch is normally pushed from that merge and its complete file hash
independently verified. Actions registers workflow381736700 asactive. No dispatch,
secret, environment, signing, trust or model action has occurred.

The current owner checklist now provides the exact reviewed private setup-token
procedure, preserved isolated Keychain namespace and verified workspace/binary/
settings. C required and root applied the explicit isolated cwd. Actual personal
Pro/Max/no applicable policy, current included quota/extra usage disabled and owner
protected-environment OAuth provisioning remain prerequisites. A single consolidated
owner request was sent; Copilot's four-credit Actions billing fact is unchanged
and separate. No new personal console VM, account or terminal controller is needed.

Exact-package38196115474 passes allthree platforms. Independently downloaded bytes
SHA-256b8122c3bdcedf42a374ba3a87681ca7654360bc6c10daa64b5ac93a79ca7b190
remain unchanged; actual merge-source0b6f865 has treefd1ec204 equal to da0b108.
This is preparation acceptance, not publicalpha.10 or frozen8695b612. Product
38196115475 passes macOS535/562 (27skip) and Linux22 523/562 (39skip), Linux24 job
PASS/count not retained. Windows failed the nested5.5.2 all-suite180s bound and
the old-npm case (134144.7ms total, run.status:null; its CLI guard is30s,
actual failed-command duration/error/signal not retained), then cancellation at
25minutes. Raw records are
retained; phase/cause remains unestablished. B a5b3d79/rootf166296 adds opt-in test-only
owned sibling progress/profile diagnostics; root7/7 controlsPASS89.7ms, default
environment/assertions and30/45/180s bounds preserved. C656ae06/root26aabbe
reviews the exact53b6b088 workflow and repairs its reporter to reuse the existing
bounded reader. One fixed storage-free Windows capture38199273160 passes both
predeclared cases once: 5.5.2 suite118225.7ms (nested direct107962.3ms), main old-
receipt29736.0ms. No timeouts reproduced. The reporter retains252 usable phase
rows across9AVAILABLE files and three TRACE_COUNT_UNKNOWN records; those are
incomplete evidence, never silently dropped or called full capture. The standalone
old-receipt trace is capped, so its CLI/probe/checkpoint decomposition is unavailable.
Its retained progress has15completedCLIcommands, allstatus0/no error/signal;
converted-direct run5780.4ms. The other capped fixtures cannot be assigned to exact
nested cases from the suppressed successful child output. Available252rows are
not the missing compiler decomposition or economics. Underlying cause remainsUNRESOLVED;
no runtime fix, blind rerun, weaker assertion or longer production deadline follows.

The corrected installed preparation still passes8commands with no local run/import,
models or native host. Three owned stage prefixes were removed only after absent
observer locks; checkout/state/history and original failed records remain preserved.
Artifact usage46active/4,782,339bytes plus224KiB reserve remains below10MiB.
G2/finalG3/G4 remain incomplete. Day0=2026-10-10 21:24UTC/72h checkpointOct13 21:24UTC
and$0 limits are unchanged. Next: retain the one captured non-reproduction and
its unknown traces; accept owner-only facts and provisioning before the one native
diagnostic. Do not repeat the unchanged owner request or launch a missing-gate model.
Owner-only native-policy/quota/OAuth and Copilot Actions-capacity tasks stay blocked
separately; no other model or new origin/trust/signing action is inferred. The one
Windows capture is complete and is not to be repeated to seek a favorable sample.
The current helper source is reviewed da0b108, workflow merge/refda6b87f; later
root test-diagnostic commits do not silently replace either identity. Task branch
commits remain separately identified from frozen8695b612/publicalpha.10 bytes.

## Historical checkpoint — reviewed conditional hosted diagnostic; installed preparation repaired

Native diagnostic author04ee1ca is independently reviewed by C5d02938/root3f31084.
The proposal stays outside `.github`, with no credentials or hosted inference.
Pinned187's implicit read-only Bash fallback required94 denial-only prefix rules;
independent564 matching and3 compound controls plus15mocks pass. Dangerous preload
assignments do not gain allow normalization. The original six checker assertions
and supervisor bodies are unchanged. Source review is not native enforcement.

The remaining Claude inputs are the authoritative personal Pro/Max/no applicable
managed-policy fact, included quota with extra charges disabled, and owner-provided
OAuth through a protected environment. GitHub read confirms no environment exists
in this repository yet. No safe native pre-hook command certifies remote policy;
do not infer it from fresh files or use a fabricated tier. Copilot's four-credit
included Actions billing fact remains separate and unchanged. The standard hosted
pair remains selected; no console VM, terminal controller or account substitute.

Recipient preparation fixes B4d99cf1/root79e3bf6 and B126e3c3/root2a74328 are reviewed.
Real installed start creates ownership before the shared guidance writer; guidance
still precedes authentication/import/eligible baseline. Strict cleanup requests
`stop --json`, preserving ok:true plus lock-absence checks. Root affected suites:
158tests/157PASS/one platform skip/zero failures. Actual installed b8122c3b procedure
passes8commands with real owner bytes/inode preserved, healthy fresh UNVERIFIED,
no local run/import/model/native invocation and confirmed observer stop. The wrong
private harness import,120s npm timeout and prior human-output cleanup parse failure
are retained. Public registry HEAD curl35/no HTTP is connectivity evidence only,
not publisher-authentication failure; ordinary offline cache installation succeeded.

Runtime/bin and approved signing/trust bytes remain unchanged. G2/finalG3/G4 are
incomplete. Next: sync the coherent reviewed preparation branch normally, pin and
review the bounded workflow registration, then consolidate the owner-only inputs.
No model trial begins until its actual prerequisites pass.

## Historical checkpoint — approved hosted diagnostic implementation

The owner retained the standard GitHub-hosted pair and approved D9/Section6.6:
prefer supported deterministic native preflight; if needed, one programmatic
native-Claude diagnostic job, at most4turns/120s, included subscription/$0 after
non-model binary/effective-policy/credential-protection/resource/startup/auth gates.
This supersedes the proposed personal console VM and manual-only prerequisite.
Local six-assertion187 PASS stays local; actual model/machine acceptance is not
credited. No credentials/secret workflow/model or signing action has run.

Existing goal service now reports active with the same objective; no replacement
goal or forecast reset. D owns the disabled runnable native diagnostic proposal,
harness and mock controls; C independently reviews its security/evidence boundary;
root owns integration, canonical tracker/decisions and fixed-source CI. B's held
recipient phase is reviewed/integrated; imported-data callbacks remain prohibited.
No model trial starts merely from static settings, source review or local PASS.

Task branch6d89bdf is normally pushed to `origin/dev/portable-ci-preparation`;
draftPR13 updated with precise limits. Signer d04b872/main b4f2860 unchanged.
Latest exact-package38189432506 passes all three platforms; product38189432507
passes all four jobs: macOS511PASS/27skip, Linux22/24 each499PASS/39skip,
native Windows322PASS/216skip,538tests per job and zero failures. Root affected123/123 pass;
independent held154/154 and protection7/7 pass. Previous359916f product/all-platform
package passes and failed/UNKNOWN attempts are preserved below. Exact package
identity is independently downloaded and verified: source6cc4cd5 has the same
tree as6d89bdf; tarball SHA-256b8122c3b unchanged. It is never substituted
for frozen8695b612 or public alpha.10. No release/publication/auto-upgrade.

Codex0.162.1/current74c6a6d binary reports ChatGPT login with API/access/WIF key
presence absent. Flat supported no-model route is `codex sandbox -P PROFILE
--include-managed-config -- COMMAND`; no ready portable fixture/profile or trial
cap survives prior teardown. Genuine setup uses default macOS project state;
there is no state-home override. No model/sockets/profile/state creation occurred
in this inventory. Historical debugger state or ENOENT from old help syntax is
not current acceptance or permission denial. Codex acceptance remains separate.

Copilot's first Actions four-credit included billing fact is still pending; no
unchanged broad account request is repeated. Claude secret provisioning waits
for the exact independently reviewed runnable workflow; never copy local login
stores. The old signed origin artifact expired; do not substitute a new origin or
relax trust. Fresh producer/recipient evidence and all V01–V22/G2/finalG3/G4 remain
required. External use NOT_STARTED. Day0=2026-10-10 21:24UTC and72h calibration
2026-10-13 21:24UTC unchanged. New spending=$0, storage10MiB/one-day retention;
last audit45active artifacts4,621,875bytes plus224KiB reserve4,851,251 <10MiB.
Next: implement/review the supported native diagnostic and inspect current CI;
then provide one concrete owner-only auth/capacity checklist for the runnable route.

## Historical checkpoint — native boundary passed; macOS test fixture corrected

The actual owner-operated Claude2.1.187 result passes all six fixed synthetic
assertions with supervised checker exit0/no signal and final persisted PASS.
This closes only the local synthetic boundary prerequisite. Credential bodies,
model-tool behavior, hosted authentication/enforcement and actual portable
cross-agent reuse remain untested; no native retry or owner action is needed for
this completed local checker. Detailed identities and preserved prior failures
are in the immediately following historical checkpoint and independent review.

Preparation8d738c7 was normally pushed to `origin/dev/portable-ci-preparation`;
PR13 remains draft. The signer ref stays d04b872 and origin/main stays b4f2860.
Exact-package CI38185767699 passed macOS/Linux/native Windows. Downloaded
artifact11719795947 independently validates tarball SHA-256
`b8122c3bdcedf42a374ba3a87681ca7654360bc6c10daa64b5ac93a79ca7b190`,
source2cd850d tree equal to8d738c7. This unreleased preparation package remains
separate from frozen d04b872/8695b612 and public alpha.10.

Product CI38185767714 passed Linux22/24 and native Windows, but macOS test45
failed its healthy baseline: UNVERIFIED/PASS, stable:false, end checkpoint
unavailable. Journal shows root-replay history timeout at300ms before any
intentional fault. The worker subphase/cause is UNKNOWN; this is conservative
withholding, not stale green. Mac totals489tests/461PASS/1FAIL/27skip are retained.
The fixture unnecessarily imposed300ms before start/run; its later explicit
`history-fault=fail` throws immediately. The test-only correction uses the
unchanged production5000ms deadline and preserves all original assertions and
faults. A separate hang/stop regression retains its original deadline behavior.

One unmodified local test without profiling passed; it does not erase CI failure.
Enabling opt-in diagnostics exposed a separate pre-ownership fixture failure:
its trace populated unowned state before start. The trace now lives beside state,
inside the disposable test parent; ownership refusal and bounded/redacted reads
are unchanged. Corrected diagnostic-enabled macOS gap/recovery/restart test
passes; four diagnostic controls, three queued-edit/certificate/newer-selection
controls and the separate hung-history/stop control pass. C independently reviews
the exact three-file diff, all76 direct assertions unchanged, four pure controls
PASS. These are test mechanics, not native or model behavior.

Fixture correction93568c4 plus independent review8b892be/root359916f was normally
pushed only to preparation. Product38187537676 all four jobs PASS: macOS
463PASS/27skip, Linux22/24 each451PASS/39skip, native Windows314PASS/176skip,
490tests per job and zero failures. Exact package38187537672 all three jobs PASS,
sourceba482a8 tree equal359916f and independently downloaded tarball SHA-256
b8122c3b unchanged. No old failed attempt is erased and no deeper timeout-cause
claim follows. No runtime/bin, signing, trust, credentials, receipts or stable
installations change. Storage audit44active artifacts uses4,461,410bytes; one
224KiB reservation gives4,690,786bytes <confirmed10MiB, with one-day retention.

The held-stable recipient phase is integrated from B00e1ccb/39b1cdb/57c4a1c
(rootd913d05/b1463e5/6e7310d). It preserves the legacy unrelated/restart/relevant-
edit entrypoint. Preparation finishes before observer/import/baseline; failed
preconditions invoke no supervisor. Raw and physical config/runtime/owner/registry/
CLI bindings are checked before/after queries and before success; detected failures
latch across catch/restore. Final success does not demand CURRENT after deliberate
source edits. Its300s callback budget is cooperative; existing synchronous child
120s limits and cleanup can delay timers. It is not arbitrary-JS preemption or
callback-child reaping. Strict cleanup needs stop ok:true plus lock absence;
unsafe CLI changes/cleanup failure cannot produce closed success. No general
executor, CLI orphan mode, model launch or new trust is introduced.

C independently reviewed154/154 synthetic controls and retained the pre-fix final-
read deadline counterexample. Reviewf6681d5 is integrated as2c4de56. The proposed
native profile now adds only exact public-config/runtime/owner-marker write
protections (D5414fec/root22dcea1; C4d8849d/root04cea8c), with unchanged grants,
activation always refused and explicit native parent-replacement blocker. Author
8controls and reviewer7purecontrols pass. Root's six affected suites pass123/123
on pinnedNode22.13.0, including ordinary CLI preserving declaration bytes and
physical identities without running a configured check. These are fixtures and
CLI compatibility, not native enforcement/authenticated import/model acceptance.

Preparation branch sync/checks follow coherent review; no signer/main merge or
publication. Codex acceptance is independent: D is checking current local binary,
subscription route and reusable owned same-machine fixture/no-model sandbox
preflight under existing development scope. Historical torn-down fixtures or
debugger receipts cannot count. Do not launch a model or grant new access from
inventory, settings existence or old startup success.
The signed data-only origin artifact expired at2026-10-11 23:56:31UTC; retained
prior authentication/machine evidence remains valid historical acceptance, but
an expired artifact must not be substituted or silently re-signed for a new trial.
Copilot Actions four-credit included-capacity fact remains pending; no unchanged
request is repeated. C source review confirms manual native187 `!` shares the
model Bash sandbox executor but bypasses its command-permission dispatch: the
local PASS cannot prove model allowlist enforcement or a different VM boundary.
No reviewed supported noninteractive native no-model route is established, and
the approved hosted workflow offers no console. A single specific owner question
requests an existing console-capable receiver VM, only with the full producer
profile independently matched and $0 added cost; otherwise G2 remains blocked
on that capability. No SSH/tmate/controller, SDK substitute or inference-as-
preflight is introduced. A secret-bearing native hosted route is not enabled;
prepare its exact supported boundary before asking for provisioning. Model gates remain
fail-closed. G2/finalG3/G4 are incomplete, not release-ready; publication pending.
Day0/72h calibration and all scope/security/$0 limits are unchanged.

## Historical checkpoint — local native synthetic boundary passed

The owner-operated pinned Claude2.1.187 run completed allsix unchanged synthetic
assertions: custom environment sentinel absent, protected nonsecret read denied,
outside write denied, exact synthetic socket allowed, other synthetic socket
denied, owned direct loopback denied. The supervised checker exited0/no signal,
actual close-event observation, no timeout. This is actual native execution of
fixed nonsecret controls, distinct from earlier source/mock tests.

Root verified the saved collection SHA-256
`b119f866376a264859b6ab5b6017a40c6c0958e1529a4d6c8851fcad32cffc71`
and the supplied final collection capture SHA-256
`679754cad787c3ab62be73202857f73895b69a2c925912f1eb530ee05f0c2144`.
The saved record intentionally retains collection_status:UNKNOWN with
pre_persistence_context_outcome:PASS and REQUIRES_FINAL_PARENT_COMPLETION;
the actual supplied final JSON confirms collection_status:PASS and
persistence_completed:true. Cleanup219.2ms, final11,047.1ms, protocol[1,0,0],
controls before/after and source currency true; owned process and socket paths
are absent. The CLI native process was reaped with signal9 as cleanup; that is
not the checker's exit status. Outer helper exit status was NOT_SUPPLIED, and is
not inferred from the returned prompt.

C independent review46f97a9 agrees with actual fields and current13source plus
5139helper/a33gate validation. Private final interpretation
`evidence/native-relocated-v2-boundary-acceptance.json` SHA-256
`f4920a033e75aaf80143eb17e5cfa79f9dbc231728fa76b5d37eb5f302dcf1e7`
records this bounded owner-local result. Old UNKNOWN/failed attempts and all
original sources/settings/authentication/state remain intact; no permission
expansion, runtime/package change, model request, public release or trust change.

Scope is only the six local synthetic assertions on this exact source/profile.
Real credential bodies were NOT_TESTED. Expected-disabled model-response policy
was NOT_MEASURED. The result is not model behavior, all-host/global enforcement,
hosted-receiver proof or G2/G4 completion. No further local checker attempt is
needed. Day0 and the72h calibration are unchanged; observed local native blocker
is resolved, while hosted resources/auth/actual effective boundary remain separate.

The next bounded implementation is integrated: disabled receiver invocation
b673e43/a4dda17 (root4e9f01d/98ee6f9) now admits only proposed187/a59 binary
metadata, rejects older versions/wrong digests and labels the binary unverified
until a real host inspects it. Keychain/settings/native-leaf denials are additive;
project/state/socket/network grants are unchanged. Activation always refuses,
including forged local-PASS/capacity claims. C reviewad4e236 independently passed
six regressions plus10counter-controls. Root's affected shared controls report
23tests/22PASS/one native-Windows skip/zero failures on Node22.13.0.
No real VM, native, auth, model or CI execution is inferred from these controls.

The existing hosted startup workflow remains secret-free/data-only; no reviewed
secret-bearing receiver execution route is enabled. Do not request or create a
Claude token until that exact route/security workflow is reviewed. A local
synthetic result cannot stand in for matched-VM native model-tool isolation or
caller-aware expected-evidence preflight. No ready portable Codex fixture survived
prior teardown; historical startup/proxy success is not a fresh execution-boundary
preflight. The preserved ordinary debugger state is not portable acceptance.

A normal meaningful preparation-branch push is approved and audited: origin/main
b4f2860, signer branchd04b872 unchanged; preparation3c87cdc is an ancestor, no
remote divergence. Signer triggers only dev/portable-evidence, never this
preparation branch. Current46active artifacts use4,518,793bytes; reserve224KiB
for one existing exact-package job gives4,748,169bytes <confirmed10MiB. Keep
one-day retention; no extra signing/trust or model job is authorized by the push.
Follow the exact automatic CI handles after pushing; source/bin remain identical
to reviewed d04b872. No merge/publication is part of this checkpoint.

Copilot's four-credit Actions included-capacity fact remains separately pending;
its account and personal-use permission are settled, not repeatedly requested.
Do not relabel historical fixtures as current acceptance or copy stable receipts.

## Historical checkpoint — native access gate accepted; full checker handoff ready

The owner supplied the actual eight-role native read-only diagnostic. Both
relocated entry/checker readonly open, same-inode fstat and close succeeded with
canonical owned600/single-link metadata. Protected nonsecret settings/canary
opens returnedEPERM; original protected code metadata returnedEPERM. Configuration
and credential-namespace directories were metadata-only; credential-body denial
remains NOT_TESTED. This is real owner-supplied native output, not a mock or
coordinator-measured result, and not full native/model acceptance.

Root collected the actual saved lifecycle and owner-supplied final launcher JSON.
Native exit0/no signal, reaping/terminal restoration/source currency true;
saved97,657ms followed by final97,669ms and persistence_completed:true.
The saved record alone was marked REQUIRES_FINAL_PARENT_COMPLETION; the later
supplied final JSON resolves that requirement. Outer shell exit status itself
was NOT_SUPPLIED and is not invented. No model-response observation is inferred
from lifecycle cleanup or expected-disabled policy.

Private captured diagnosticSHA `e578d137d2841ff5283cd2013a70cd80cea9a6d01623b3f8606cce2f0b7a8a8c`,
final lifecycle captureSHA `b7565da2e7e27c537be437fead29ad92ea314b7f0c8ff1e4a82582c8f51a03e2`,
saved lifecycleSHA `dba602d456b95c81c312327898917df0fae4f1637f962935fad58cad7764d14a`.
C independent reviewf1d09a0 checked allactual rows, four evidence identities,
13current source fingerprints plus the5139c305 helper physical identity and
conditional full handoff. The exact candidate was copied O_EXCL/600 to fixed
`evidence/native-relocated-v2-access-gate.json`; selected SHA-256 is
`a33d6b1ae094f58ef5956d90ebff861d347d5c3f703dcd40811b023067ced425`.
Root's actual require_access_gate readback with fresh verification passed.
Acceptance is READABILITY_AND_NONSECRET_DENIAL_ONLY, not producer trust,
credential-body proof, hostile-same-UID authentication or full enforcement.
All old failures and original files remain preserved; no runtime/package change.

Next is one consolidated owner-operated full synthetic checker handoff using the
same reviewed v2helper5139c305, paired fullprofile636bab4d, original immutable
collector29ebbcde/checker579af20e, dedicated relocated CODE, and exact original
synthetic targets/socket/network/credential constraints. Full process/result
records and sockets were absent when checked; no coordinator native/checker or
listener was started. The helper itself rechecks current source/gate/policy and
ownership before listeners/native, never launches when a prerequisite fails.

Outer launch command:

```sh
/usr/bin/python3 '/Users/mariosiric/Library/Application Support/REDUE/portable-evidence/native-claude-2.1.187/owner-sentinel-relocated-v2.py' --owner-run --gate-digest a33d6b1ae094f58ef5956d90ebff861d347d5c3f703dcd40811b023067ced425
```

Inside the fresh native `!` Bash mode submit only:

```sh
/Users/mariosiric/.nvm/versions/node/v22.13.0/bin/node '/Users/mariosiric/Library/Application Support/REDUE-Native-Checks/native187/workspace/redue-native-sentinel-collect.mjs'
```

180s preparation,15s checker window beginning only at collector ACK,5s cleanup.
The parent automatically collects structured six-assertion JSON and observed
checker exit/signal to `evidence/native-relocated-v2-collection-result.json`.
Wait for automatic outer completion; do not submit further prompts/commands or
exit while collection is pending. Preserve only final helper JSON/status; no
checker transcript copying is needed. The saved collection status is deliberately
UNKNOWN/pending until final parent completion; a successful final completion needs
collection_status:PASS and persistence_completed:true plus actual captured
assertions/OS outcome and current context. Missing results/timeout remain UNKNOWN,
failed assertions FAIL; cleanup cannot substitute for checker success. A settings,
permission/auth/trust warning stops the operation; never Continue/Fix with Claude.
Full checker result is NOT_RUN as of this checkpoint, no model acceptance or G2/G4
completion is claimed. Copilot Actions capacity remains a separate unchanged
prerequisite. Day0 and all public release/trust/budget boundaries remain unchanged.

## Historical checkpoint — native permission-rule repair

Owner-reported pinned Claude2.1.187 settings validation skipped the exact inline
Node diagnostic `Bash(...)` permission rule as `Empty parentheses`. Independent
C source inspection confirms that native validation rejects unescaped empty
parentheses anywhere in a rule before parsing its content, including inside the
quoted JavaScript. The earlier fresh checks verified identities and outer
filesystem prerequisites but missed this native rule-grammar precondition.
This is a diagnostic configuration defect, not a passed enforcement test.

Root instructed `Exit and fix manually`, never Continue or Fix with Claude.
Observed saved lifecycle: native exit1/no signal,46,941.5ms, UNKNOWN_OR_REFUSED;
owned process reaped, terminal restored and original files unchanged. Actual
assertion JSON was not supplied, and no access gate exists. The privately
attributed `native-relocated-diagnostic-rule-warning-20261011.json` preserves the
warning classification/settings/input/helper/lifecycle digests without raw
transcripts or protected contents. Old attempt and sources are unchanged.

The repair is staged and independently reviewed (source75c8ae3, attribution
correction73801f5; integrated asaa5882e/49d9287). Root reran the21focused controls
(4pinned Bash-subset parser +12relocation +5helper/gate mocks) and Node syntax.
C independently repeated21controls and added8source/gate controls. These are
parser/harness evidence, not native enforcement. The pinned parser rejects the
old inline rule and accepts the exact fixed Node plus quoted CJS-file rule.
The diagnostic body remains byte-identical (`14f62b23…`); checker/collector,
authentication, state, protected targets, all previous denials, exact socket,
network restrictions and180s preparation/5s cleanup are unchanged. New files
add protection, not broader access. No native, checker or model ran in this repair.

Current verified owner-local helper:
`/Users/mariosiric/Library/Application Support/REDUE/portable-evidence/native-claude-2.1.187/owner-sentinel-relocated-v2.py`
SHA-256 `5139c3056871c2286cee2841842bfc624e9db9b86d766bdcff14b0c9ee89f81c`.
Diagnostic profile `15dbfaf4db84fb014263fbfdeb6baddfff0f39bf9d95050ce02cf0b1a307e9b2`;
paired full profile `636bab4db073b91c8165fae24de26cb537d3bacab6e99e2014a39fb157cab014`.
Fixed diagnostic code is in the approved dedicated relocated workspace:
`/Users/mariosiric/Library/Application Support/REDUE-Native-Checks/native187/workspace/redue-native-entry-diagnostic.cjs`.
Printed input SHA-256 `75fb685a18ec3c926016e59c9cf7c232e499dc3cdce52081c0bc7394fde67750`.
Private final procedure `README-native-relocation-v2.md` SHA-256
`0771540a26acd2df6ef4b6521d2145287d7ec3aa1028e335ea545a94487a5afb`;
staged manifest `evidence/native-relocation-v2-manifest.json` SHA-256
`941bdb1f3e429f348d06c9d1753821bc997c2b066580b712a006e2afbde2c73f`.
Root verified allsix new O_EXCL/600/canonical/single-link files and all original
source/attempt hashes unchanged. Data-only `--verify` and `--diagnostic-input`
passed after staging. The full operation remains refused without the genuine
currentv2 access gate, now also bound to the selected helper hash and physical
identity. No actual gate was manufactured from source checks or mocks.

Next owner action is only the repaired read-only diagnostic, not the full checker.
Launch the verified v2helper with `--owner-diagnostic`; inside fresh native `!`
Bash mode submit exactly:

```sh
/Users/mariosiric/.nvm/versions/node/v22.13.0/bin/node '/Users/mariosiric/Library/Application Support/REDUE-Native-Checks/native187/workspace/redue-native-entry-diagnostic.cjs'
```

Preserve the structured eight-role JSON and displayed command status, then Escape
and `/exit`. A settings/permission/auth/trust warning stops this attempt; never
Continue or Fix with Claude. Diagnostic JSON is owner-supplied, not automatically
collected. The helper saves only the lifecycle under
`evidence/native-relocated-v2-diagnostic-lifecycle.json`. Cleanup/nativeexit0 is
not assertion proof. Both relocated collector/checker safe readonly opens and
nonsecret protected-settings/canary permission denials are required; credential
directories remain metadata-only/credential-body denial NOT_TESTED. Missing
output/timeout remains UNKNOWN. All old records stay intact, all new operation/
gate records were absent when checked. Another helper-hash approval is unnecessary
under the standing authority. Copilot Actions capacity remains separate; no new
billing or general account request. Package artifacts/runtime/CI source and Day0
are unchanged; G2 and prepublication readiness remain incomplete.

## Historical checkpoint — standing autonomy applied; lanes reassessed

The owner’s [standing autonomy amendment](portable-evidence.md#65-owner-autonomy-amendment-standing-authority)
is now the operating instruction for the existing goal. Routine in-scope repairs,
reviewed integrations, task pushes/PRs and permitted evaluations no longer require
per-command/hash/single-attempt consent. Main PR merges require normal checks and
independent critical review; public package/release distribution, trust expansion, account
actions and unconfirmed spending remain owner decisions. The goal objective and
G0–G4 are unchanged. No new goal or planning framework is created.

D revalidated all seven staged native files and diagnostic-input/profile bindings;
no useful remaining fixture repair was found. Native diagnostic/checker is not
prohibited by missing consent. Terminal-app automation is explicitly host-denied;
that alone does not prohibit a separate supported CLI. Independent C review finds
that no supported way to establish a fresh rendered prompt/Bash-mode state
from these stream chunks has been demonstrated; blind input risks inference. No decoder/controller or bypass
is built. The reviewed manual route remains the currently established safe path.
Effective native readability is UNKNOWN and full collection remains gated.
Copilot Actions included capacity is separately unestablished under the $0 cap.
Local Claude onboarding succeeded; neither subscription existence nor settings
presence proves effective sandbox enforcement or hosted receiver provisioning.

Preserved work is now synchronized normally to the existing
`dev/portable-ci-preparation` ref at `3c87cdcca19a46059a44c3d4c6f8d382a508345c`;
no force-push, new signer invocation or producer-trust change. Draft
[PR #13](https://github.com/msiric/redue/pull/13) reviews that preparation against
fixed `dev/portable-evidence`; PR #12 and the signed `d04b872` origin remain intact.
The PR's automatic signing/storage effects were independently reviewed before
push. Keep PR #13 draft; merging into the signer-trigger branch needs its normal
checks/review and explicit verification of those effects, not assumed authority.

Exact-package run [38179134382](https://github.com/msiric/redue/actions/runs/38179134382)
passed on macOS26, Linux and native Windows. Verified four-file archive artifact
`11716818446` is160,465bytes with one-day retention; observed active artifact storage
is5,147,153bytes, below the confirmed10MiB included allowance. The archive ZIP
SHA-256 is `9ce16f51d8974f4c99b2a783289d6520747566df4cbceb6aac1d55f79c6bd9ea`.
Its actual PR-merge source `e2491712a85c1b2610b9bf67238cf52be61f1b95` has tree
`e9e278cd45769bda0acb97000b989c59985bdd3f`, independently confirmed equal to3c87cdc.
Installed `redue-cli-0.1.0-alpha.10.tgz` SHA-256
`b8122c3bdcedf42a374ba3a87681ca7654360bc6c10daa64b5ac93a79ca7b190` matches the
existing documentary candidate; it is neither public alpha.10 nor the frozen,
signed `d04b872` package (`8695b612…`). No bytes are substituted under old identity.
All three jobs include installed recording and owned-policy upgrade/removal;
macOS additionally exercises separate local recipient initialization.
This is installed mechanics, not actual host behavior or new two-machine reuse.

Focused local source controls:61tests,60PASS/one platform skip/zero failures on
Node22.13.0. Product run
[38179134336](https://github.com/msiric/redue/actions/runs/38179134336) has Linux22
and24, native Windows and macOS jobs PASS after connectivity recovered. The487-test
suite reports macOS460PASS/27skip, Linux22 and24 each448PASS/39skip, native
Windows311PASS/176skip; all zero failures/cancellations. Each product job also
passed installed CLI recording, and Windows passed its generated PowerShell shim.
The two22:20UTC HTTP/2/TCP read failures are retained as transient observations,
not account-permission or product-test conclusions; the same original run was
followed to completion, with no replacement CI. Documentation-only follow-up
commits are preserved locally and independently reviewed; no runtime, tests or
packaged file differs from3c87cdc. Keep that distinction explicit rather than
claiming CI ran on the later documentation commit. Do not rerun broad CI solely
for a status update. At the next substantive task push, synchronize these normal
commits with the existing preparation branch; never force-push or trigger a
substitute signed producer. No experiment is currently live. Code/helper/security identity
is unchanged by the standing-authority and independently reviewed checklist edits.

Codex0.162.1 exposes `--approve-for-me`; official documentation keeps Auto-review
inside existing permission boundaries. Current coordinator policy is `never`,
so it has no eligible escalation route; no global settings or reviewer-policy
change is made. Tool-specific Terminal/browser denials remain. The existing goal
service still reports its earlier blocked state; this interface cannot resume or
edit goal operating instructions. This canonical amendment governs the same
unchanged objective; do not create a replacement goal or claim service activation.

Day0 remains2026-10-10 21:24UTC; calibration2026-10-13 21:24UTC. Owner-resumed blocker
audit starts afresh. Gates remain incomplete; the confirmed regression runs and reviewed integration
checkpoint are complete. The two current model/native lane prerequisites remain
outstanding; do not invent new acceptance or repeat denied operations. Next owner inputs are one manual native diagnostic
result and the precise included Copilot Actions capacity/billing fact, bundled in
the current contributor checklist; no general account-existence request.

## Historical checkpoint — autonomous operation authorized; host controls denied (2026-10-11)

The owner authorizes assistant operation of the existing approved work. Consent
is no longer the native lane prerequisite. A supported Computer Use selection of
Terminal returned `Computer Use is not allowed to use the app 'com.apple.Terminal'
for safety reasons.` No app binding, native launch, keyboard input, checker or model
was started. Independent C review confirms that an alternate terminal, AppleScript,
input injector or custom PTY controller must not circumvent this host denial.

Copilot capacity inspection was attempted through two read-only routes. The user AI
credit billing API returned HTTP404 and identified a missing `user` token scope;
no scope refresh or credential change was attempted. Official documentation says
user billing endpoints exclude organization/enterprise-managed license usage,
so this response establishes neither absent entitlement nor included capacity.
The browser route selected existing Chrome, but github.com navigation was rejected
by a saved browser permission. No billing setting or external state was changed.
The earlier unavailable in-app browser was a capability absence, not a policy
failure. No alternate browser or transport will circumvent the saved denial.

The reviewed relocation and all old attempt records remain intact. Native
readability/enforcement is UNKNOWN; the full checker still requires the actual
readability gate. Existing `OWNER_SUPPLIED_NATIVE_OUTPUT` provenance is not
assistant-measured evidence. A supported assistant-operated route would require
truthful actor/provenance bindings and independent review before execution.
No such successor is implemented merely to work around the denied route.

Minimal next capability is host support for the approved Terminal interaction,
or owner performance of the already reviewed manual diagnostic. Copilot separately
needs an observable included-credit/no-additional-charge fact for its Actions
billing route, through permitted billing access or the applicable administrator.
Another broad consent request cannot fix these layers. The $0 limit, exact resource
scope, no automatic retries, and security/trust/publication boundaries remain.
G2/G4 are incomplete, models0; no artifact, receipt, runtime or public state changed.
Day0 and the72h checkpoint are unchanged. The previous blocked audit is historical.
The resumed audit now meets three consecutive turns of the same genuine blocker;
all five current native/gate records remain absent and no live operation handle
exists. Independent C review found no safe unblocked critical task. Request goal
status BLOCKED, not complete. No denied operation was retried. Resume when the
supported host boundary or actual owner diagnostic result is available, and/or
the independent Copilot included-capacity fact is supplied through permitted access.
Another broad authorization alone does not resolve these effective prerequisites.
Current local branch and reviewed preparation are preserved; no public write or
new native/model/signing/upload occurs. The private resumed audit retains exact
classification and observations; this is a capability handoff, not gate acceptance.

## Historical checkpoint — relocation ready for owner diagnostic (2026-10-11)

Owner-approved test-code-only relocation is applied as inactive files at
`/Users/mariosiric/Library/Application Support/REDUE-Native-Checks/native187/workspace`.
Root verified all seven staged file hashes, canonical owned600/single-link leaves,
original sources/settings and failed-attempt records unchanged. The data-only
`--verify` and exact one-line `--diagnostic-input` modes pass; they launch no native
process, checker, model or listener. Credentials/authentication/state, protected
synthetic targets, all old denials and normal settings stay in place. No global
settings or REDUE runtime changes, receipt deletion, artifact repack or new grant.

D owns repair; independent C reviewbcac318 is integrated (source899ab247). All
six checker assertions and180s preparation/15s collection/5s cleanup remain intact.
Only executable code/cwd/path/hash bindings move; dedicated code parents are
write-protected and physically outside expanded/case-aliased denied ancestors.
C's39 source/mock controls plus16 independent gate/refusal controls pass. Root
reran13 Node+12 final relocation Python mocks and three pinned Node syntax checks.
These are harness tests, not native enforcement. The initial74c25e3 diagnostic
proposal could overwrite timeout uncertainty after cleanup; final899ab247 has an
irreversible error latch/static reason, with its timeout regression passing.

Exact owner-local BASE remains
`/Users/mariosiric/Library/Application Support/REDUE/portable-evidence/native-claude-2.1.187`.
Manifest `evidence/native-relocation-manifest.json` SHA-256
`0f61c3972ef7b6caaa3a4e3ecd51dfb1227579f4436a045d3fd2d1f232ba88b1`;
procedure `README-native-relocation.md` SHA-256
`77abb2a02e4f16dab090572ed69b4bf3d913df082c648d097924f53a31fa1c8b`.
Helper `owner-sentinel-relocated.py` SHA-256
`899ab247e47df83b71e076d5c1e4174cccbcc519d9503cb8da14a8475dda72ff`;
diagnostic profile982f4118/full81e874fe, code579af20e/29ebbcde, body14f62b23,
exact one-line input68ce826c; full identities are in the private manifest.

Next is ONLY the approved read-only diagnostic. The supported pinned187 no-model
route needs owner-entered interactive `!` Bash with respondToBashCommands:false;
no reviewed noninteractive substitute exists. The diagnostic launcher uses the
same native boundary with180s preparation/5s cleanup, no terminal controller/input,
listeners/checker or full-gate acceptance. Actual JSON is owner-supplied; lifecycle
cleanup is never access proof. Both relocated scripts must independently open/
fstat/close safely; existing NONSECRET settings/canary readonly opens must return
EACCES/EPERM. All eight rows must be complete. Real credential directories are
metadata-only and credential-body denial is NOT_TESTED; their existing protections
remain exact. No protected contents are read. Missing output/timeout stays UNKNOWN.

One full owner-operated attempt is conditionally approved AFTER this genuine
current gate passes. Full command remains withheld. Root will not construct a gate
from mock output or outer metadata. Gate/profile/body/common-restriction/current
physical bindings must match, with exclusive new records and no old record reuse.
Root confirmed gate/new native records absent at18:27UTC; native/checker/model0.
Owner input now blocks only this native lane. Copilot's four-credit Actions
entitlement remains independently pending. G2/G4 remain incomplete; no signing,
upload, public release, main merge or model trial occurs. Day0 remains unchanged.

Independent permitted check18:17UTC: GitHub artifact11685889769 from approved
run38096670987 is unexpired,34,300bytes, through2026-10-11 23:56:31UTC. No download,
workflow or signing was started; frozen8695b612… package hash is unchanged. Recheck
availability before any authorized recipient use; expiration cannot authorize a
substitute origin or relaxed trust. Historical results remain below.

Blocked audit: the same owner-native-result and Copilot-capacity condition is
revalidated across three consecutive goal turns, including the original repair
turn and two no-progress continuations. All five new native/gate records remain
absent; no confirmed live operation handle is available. No safe unblocked task
was identified after reviewing the current gate/task inventory. Request goal
status BLOCKED; completion is not claimed. Resume with the approved diagnostic's
static JSON and lifecycle JSON, or the separate Copilot included-capacity decision.
Do not launch a native/model trial, repeat preservation/research, or re-create a
gate from mock output. The reviewed owner procedure and exact manifest above are
the handoff; current repair commit806f96a is preserved. No permissions, credentials,
receipts, artifact bytes or public state changed in these continuations.

## Historical entrypoint diagnosis

Current checkpoint (2026-10-11): owner-reported subsequent attempt is
ENTRYPOINT_RESOLUTION_FAILED (Node22.13.0 MODULE_NOT_FOUND/requireStack[]).
Collector/checker assertions did not run per owner; enforcement UNKNOWN. Private
attributed record6b802c61 preserves result82dd2ea0 and process-marker633c5044.
Saved STARTUP_DEADLINE180225.1ms has no ACK/checker result; cleanup/currency/controls
true cannot establish enforcement. Typed argv/generated profile unrecorded;
no newline inference. No new native attempt is approved.

Entry01083350 and inner checkerb3bad6 still exist intact, owned600/single-link
with canonical nonsymlink parents. Static protected-ancestor conflict established
independently: lower-case denied redue is the same directory as uppercase REDUE
containing BOTH code leaves. Pinned187 source expands ~/ into deny file-read*
subpath. Strong denial explanation, not definitive specific-invocation proof.
Outer data-only verification did not establish native readability. Independent
diagnosis27af0b6 integrated3911320. D's fixed two-path Node-inline metadata
diagnostic82a0382d/settings724f1e65 is reviewed by C92655cd/integrated49c9b0e.
Five author/reviewer/root mock tests and8 independent controls PASS; root syntax
PASS. Per-phase filesystem error codes/static booleans only, no contents or target
code/network execution. This is mocked preparation, not native enforcement.
Private proposal4d246473 and relocation blueprint5fe9aabe remain unapplied;
source privacy/phase defects preserved and corrected before operation. No new
launch procedure, apply/workspace/grant/native/checker/model. Next requires one
separately approved finite read-only SAME-boundary operation; no automatic retry.
Preserve credentials and denials in place. Native access to BOTH
files must be validated before another launch command. Copilot capacity remains
separate; gates incomplete.

## Historical collection repair checkpoint

Earlier owner-requested repair was prepared, independently reviewed and mock-tested
only. Old helperdc0, profilecc8, checkerb3, report9f364dc and markerfbce07d unchanged.

Read-only source plus recorded OWNER_WINDOW_ENDED establishes the old outer-window
termination branch: start+15 begins on function entry before checks/native startup,
and the launcher ends the owner window at remaining<=2 before group cleanup.
Absolute phase/submission/checker timestamps were absent. No stdout/result collector
existed. Actual command submission, checker startup/exit and lost output remain
UNKNOWN; signal9/delta0 alone do not establish them. Cleanup is not checker success.

D's inactive repair uses proposed180s startup, one15s checker-collection window,
5s cleanup/200s total. Bounded typed reporting uses only the existing synthetic
allowed socket and a parent-written private result, without native result-path
access. Captured assertions and actual OS exit/signal remain independent of
terminal copying and final lifecycle uncertainty; a retained FAIL is not erased.
No terminal decoder/input automation, REDUE runtime change, new resource grant,
credential copy or global change. Exact checker/per-operation limits unchanged.

C review d77d4c5 integrated00c0af2: GO_FOR_OWNER_APPROVAL only. Author/reviewer/root
8 Node+12 Python+2 connected mock tests PASS;8 independent source/data controls
PASS. Harmless child/socket/persistence/cleanup tests are not native enforcement.
Prepared helperc9f6e1e/wrapper01083350/profiledfc80886 exist in durable owner-local
BASE. Root read-only `--verify` exits0 (native/listeners0), old hashes unchanged.
Private procedure/manifest contain exact identities and proposed settings delta.
Fresh prerequisite checks and separate exact owner approval remain required;
no `--owner-run`, real checker or model was invoked. Same-UID protocol is not
hostile-local-process authentication. Copilot capacity remains independently
pending; G2/finalG3/G4 remain incomplete. Full resume has exact paths/next command.

## Historical owner-confirmed UNKNOWN result

Current checkpoint (2026-10-11): the owner confirms performing the one approved
manual attempt and supplies its structured launcher report. Result remains
**UNKNOWN**, not a native boundary PASS: no checker JSON or checker exit was
supplied. The launcher reports OWNER_WINDOW_ENDED,13,216.9ms, native signal9,
reaping/terminal restoration/live controls/source currency/listener cleanup true,
and actual protocol delta[0,0,0]. Native signal9 is the launcher termination,
not an observed checker outcome. Model response was expected disabled, not measured.
Do not infer command submission, successful denial, absent inference or checker
execution from these facts.

The exact approved profilecc8aaf/helperdc0eb16/checkerb3bad6 identities are retained.
Protected owner-supplied result `native-manual-owner-result-20261011.json`
SHA-2569f364dc3ab867f53808dc2984392e3e3c6cec1c145fde850664f6c5289f2195b
is saved mode600 with source attribution. The manual-process record remains
untouched. The one-attempt authorization is consumed; no repeat, deletion,
controller, permission/settings change or model request is authorized. Root’s
fresh reads followed this owner attempt and are not retrospective pretrial proof.
No coordinator native/checker/model launch occurred. If separate checker output
exists, accept only its static structured results and displayed exit, never raw
terminal/protected contents; absent or ambiguous output remains UNKNOWN.

Copilot included-credit confirmation remains separately pending. G2/finalG3/G4
remain incomplete; original settings/authentication, receipts, frozen artifacts,
Day0 and spending/security boundaries are preserved. No positive enforcement or
agent-reuse claim is made. This lane stops on the actual finite unknown result.

## Historical owner-approval prerequisite check

Current checkpoint (2026-10-11 16:15UTC): the owner approved the exact separate
manual profile and one owner-operated15s attempt after fresh prerequisites. Profile
SHA-256cc8aaf8c396424e37d48d8bfb2bc690461e7b99ef1ff7b3afff986118c45ff1e,
helperdc0eb16 and checkerb3bad6 remain exact. Read-only `--verify` exited0;
metadata confirms OAuth item present, scoped API service absent44 and native
primaryApiKey key absent. No coordinator native/checker/model launch occurred.

The operation gate stopped at an existing owned manual-process record, modified
16:12:41UTC, SHA-256fbce07dacb46bc46d6036c214d4c95e2de2e2d172e9bea0f5390460c4b4a77b1.
Its recorded PID is absent at inspection; the synthetic socket paths are absent.
These facts do not establish checker execution, exit or complete cleanup. Actual
checker outcome remains UNKNOWN pending owner-provided structured checker and
launcher results. Do not clear the record, repeat the attempt, infer unused
approval, or turn missing output into PASS. One concise owner clarification was
requested; no further execution or permission request follows automatically.

Protected nonsecret prerequisite record `native-manual-owner-approval-preflight-20261011.json`
SHA-256bdb7785a3bd697a87e8e6552b80665e480da374f167da4a5a127625551d85cce
preserves identities and observed gates. Original settings, authentication,
receipts, frozen artifacts and security boundaries are unchanged. Copilot included
capacity remains separately pending; G2/finalG3/G4 remain incomplete. No authority
or enforcement is inferred from the file checks. Day0 and spending limits remain.

## Historical owner-operated procedure preparation

Current checkpoint (2026-10-11): automated terminal-controller retries have
stopped at the owner's instruction. Only preparation of a short owner-operated
native checker procedure is authorized now. Independent pinned187 source review
found that manual `!` defaults to a model response; the previous3018 proposal
lacked an explicit off setting. All three actual attempts stopped before command
submission, so no observed model call follows from this proposal defect.

A separate proposed manual profile must bind `respondToBashCommands:false` and
the reviewed Bash route before an operation can meet the no-model requirement.
The existing strict sandbox/resource restrictions and original5628/eebb profile
remain unchanged. Preparing files is not effective enforcement or permission to
run the checker. Final independent review7a117b9 is integrated as dce6c1a;
owner-local helperdc0eb16/settingscc8aaf/checkerb3bad6 exist and the root read-only
`--verify` exited0 (561.6ms), native launches0/listeners0. The exact settings delta
adds automatic-response false and explicit Bash, plus deny protections for the
new settings filename. Original5628/eebb/3018 remain unchanged. Approval for using
that separate profile and one owner-operated15s synthetic attempt is pending;
fresh authority/auth prerequisites must pass immediately before it. No native,
checker or model action ran. Copilot included-credit confirmation remains separate. G2/finalG3/G4 are incomplete. Day0, resource
limits, receipts, frozen artifacts and all historical failed attempts are retained.

## Historical terminal-controller checkpoint

Current checkpoint (2026-10-11): the owner explicitly approved one75082e
synthetic preflight after independent55+11 pure controls and exact-source review.
Fresh metadata/auth/ownership guards passed. It ran once and stopped before shell
or checker input: **NOT_VERIFIED/NATIVE_SCREEN_CONTROL_UNKNOWN**,492.8ms.
Native reaping, fixture cleanup, before/after controls and plaintext-fallback
absence passed; protocol delta[0,0,0]. Protected result3 SHA-256
b4ebbade7123fb6a0ed508f9e7fc20fc7fddc80954b578c67602bf0b4de24941
is preserved; original settings/launcher remain unchanged and owned fixtures are
absent. This is a terminal-controller limit, not a REDUE or sandbox-denial result.
The actual control opcode/parameters were not retained and remain UNKNOWN.

All three synthetic allowances and the startup-only allowance are consumed.
No checker/model trial has run. Native execution and parser expansion have stopped;
Independent actual-result review9773c3d is integrated as58ec2dd. C and D identify
only the existing owner-operated pinned187 nativeTTY/manual-Bash route as a
possible next step. It needs a reviewed exact procedure and specific approval;
no new harness, decoder expansion or resource/permission change is queued.
Copilot included-credit confirmation remains separately pending. G2/finalG3/G4
remain incomplete; data-only machine acceptance is not agent reuse. No runtime,
receipt, artifact, authentication, trust, CI or publication changes occurred.

## Previous successful startup-only diagnostic

Current checkpoint (2026-10-11 15:00UTC): the owner approved one exact
startup-only diagnostic1c6a55. Fresh metadata/auth-source guards passed; native187
reported claude.ai/firstParty/Pro with no API-key source. The diagnostic ran once
and classified **SAVE_CURSOR**,404.7ms, zero keyboard bytes/model requests, native
reaped and original-source/fallback rechecks passed. Private sanitized final
report SHA-2565840f3182ac7495405005cd56562a0b803ac895871d1da1246da1748245e4776
is preserved in the durable native setup's evidence directory. This describes
this startup only; earlier discarded controls remain unknown. No checker ran and
sandbox enforcement/actual portable agent reuse remain unproven.

The one startup-only authorization is consumed. D owns a disabled, narrowly
reviewed ESC7/ESC8 parser repair; C independently reviews actual diagnostic and
proposed semantics. No further native/checker/model operation is authorized by
this preparation. Copilot's included-credit confirmation remains separately
pending. Original settings/auth, runtime, receipts, frozen artifacts and security
boundaries are unchanged; no trust/CI/publication action. Owner resumed this
specific diagnostic lane; G2 and finalG3/G4 remain incomplete.

## Previous blocked checkpoint

Blocked checkpoint (2026-10-11): the same acceptance prerequisites remain
outstanding across the diagnostic-preparation turn and two automatic goal
continuations. Prior continuation was no progress, not a verified process wait.
Final author/reviewer agents are terminal; no live native/model operation is
pending. Revalidation confirms classifier1c6a55 unchanged and its actual result
file absent. Owner approval for that new zero-input operation and Copilot's
promised included-credit confirmation are still pending. Both prior native
allowances are consumed; neither conversation silence nor automatic continuation
supplies approval. No safe independent acceptance task remains now. Goal status
is BLOCKED, not complete; G2 and finalG3/G4 remain incomplete.

Resume only the specifically unblocked lane. For native diagnostic approval,
repeat current metadata/auth guards and exact helper/source checks, execute the
reviewed startup-only operation once, preserve its actual sanitized result, then
review the next boundary before any checker/model action. For Copilot confirmation,
use the existing reviewed entitlement and no-model preflights before requesting/
executing the exact bounded trial. No new account, credential copy, broad CI,
artifact regeneration, trust change, root signing push or publication is implied.
Day0 and spending/security boundaries are unchanged. All prior failures, receipts,
frozen artifacts and independent review remain preserved.

Current diagnostic preparation (2026-10-11): startup-only helper SHA-256
`1c6a55c69cc58a64eab982c9c5ddfadb2eb801191500addb620afca67fc73c9b`
is independently reviewed in e2870f6 (review source4924afe). Root15 pure controls
and reviewer15+7 pure/static controls pass; native launches0. It uses original
all-tools-denied settings, sends zero input, and reports only a fixed control
family within15s. No checker/model or synthetic resource/settings operation is
included. One specific owner approval is pending; prior allowances remain
consumed. A family observation is diagnostic only, not sandbox or reuse proof.
Before an approved launch, repeat current metadata/auth guards and exact hashes.
Copilot included-credit confirmation remains separately pending. No new login,
public CI, trust change, runtime change or publication is requested here.

## Previous two-attempt checkpoint

Current checkpoint (2026-10-11): two separately owner-approved synthetic native
Claude187 attempts returned **NOT_VERIFIED**, both before any shell/checker/model
submission. The second, frozenbeba8c diagnostic revision, stopped at
NATIVE_SCREEN_ESCAPE_UNSUPPORTED after472.2ms. Exact source narrows this to an
unrecognized non-CSI/non-OSC escape; its actual byte/family remains UNKNOWN.
Live controls, fallback absence, fixture cleanup and native reaping all passed
for attempt2; protocol delta[0,0,0]. Neither attempt proves sandbox enforcement.

Independent reviewcfe7f53 confirms the failure layer and retains both results.
The two one-attempt allowances are consumed; no further native operation is
approved. After reviewing both failures, native work is stopped. The minimal
prospective diagnostic is startup-only/zero-input, reporting a fixed escape-family
enum rather than raw terminal content, under the unchanged all-tools-denied profile;
it needs exact review/approval before execution. An owner-operated native route is
an alternative, not an authorized sandbox bypass. Copilot's included-credit
confirmation remains separately pending; no new login/account is requested.

## Previous first-attempt checkpoint

The first owner-approved exact synthetic native
Claude187 attempt executed once and returned **NOT_VERIFIED**. The environment
repair and local subscription login remain valid; another login is not requested.

Frozen harness10904ba stopped at NATIVE_SCREEN_CONTROL_LIMIT after1,384.8ms,
before establishing native Bash mode or submitting any shell/checker command.
The decoder retained an unmatched escape suffix beyond4096characters; the actual
control family was discarded and remains UNKNOWN. This is a harness/terminal
compatibility limitation, not a failed REDUE check or evidence of permission
enforcement. No model trial ran. Live synthetic controls passed before/after;
protocol delta[0,0,0], fallback absent and owned-fixture cleanup true. Native
reaping was UNKNOWN in the original report; a later exact dedicated-native
process metadata check found none remaining, a separate observation rather than
retrospective reaping proof. Normal5628de settings/eebb1e launcher are preserved.

Independent review398801a/77606c8 is integrated; actual protected report remains
under the durable native setup's evidence directory. Original109 source and all
failures are retained. A separate fail-closed parser proposal classifies complete
unsupported controls without accepting new terminal semantics. It is not a fix
claim for the unretained actual escape and has not run natively. The one-attempt
authorization is consumed; no automatic retry, permission widening or model
launch follows. Copilot's four-included-credit/no-extra-charge confirmation is
still pending. G2 and finalG3/G4 are incomplete; data-only VM applicability is
not agent reuse. Frozen8695/b812 artifacts still match their original checksums.
Day0/forecast targets/spending boundaries are unchanged; external usage NOT STARTED.

## Historical blocked checkpoint

Previous checkpoint (2026-10-11): execution blocked at owner approval/capacity
gates; branch `dev/portable-evidence`. The full goal remains incomplete.
The durable disabled checker rebind and independent review are integrated as
f5f8ea6/f3d2af1; six deterministic controls pass (root53.639ms). Spaces are
quoted and the synthetic Unix socket paths fit macOS. Working native187,
all-tools-denied settings5628de and launchereebb1e remain unchanged. No fixtures,
listeners, checker, settings application, model, trust or publication action ran.

One independently reviewed bounded read-only auth-source diagnostic exited0:
loggedIn/claude.ai/firstParty/pro with apiKeySource absent. Scoped API-service
metadata, fixed descriptor file, native-config primaryApiKey key and selected
local/project settings were absent; no credential values were requested or
printed. Pinned187 source review resolves the concrete OAuth-plus-API fallback
counterexample for this observed context; it is not a global/future policy claim.

The one reviewed native `/status` attempt started187 and submitted only the
built-in command. It did not capture a complete source field within30s and is
STATUS_NOT_CAPTURED/UNKNOWN, not enforcement proof. Parent terminal exit0 is
cleanup/diagnostic completion only, never a passed prerequisite. Owned process
cleanup completed; no raw terminal output was retained. Private mode600 records
live under the verified durable setup's `evidence` directory. Independent review51611b2 confirms `/status` is not a mandatory plan gate;
the actual account/source/metadata findings permit requesting the exact bounded
synthetic test, not executing it or asserting enforcement. Its failed-denial
counterexamples are limited to fixed owned synthetic resources. No blind retry
or model launch follows. Copilot's first bounded Actions trial still
needs the owner's promised four-included-credit/no-additional-charge confirmation.
G2/finalG3/G4 remain incomplete; data-only VM acceptance is not model reuse.

Blocked audit: the same acceptance prerequisites remain outstanding across three
consecutive goal turns. The latest continuation produced no new acceptance;
reviewers are terminal, the diagnostic process is terminal, and no approved
independent task can advance the remaining gates now. This is not a live-process
wait or a failing product test. No checker/model/trust/public action is inferred
from automatic goal continuation. Day0 is unchanged; lane blocked time remains
separate from completed implementation/review.

Resume on the specific synthetic-test approval or Copilot included-capacity
confirmation. For the approved lane, revalidate the exact current source/context,
file hashes and owner resources before the already reviewed operation. Do not
repeat login, native `/status`, broad CI or implementation research. The exact
synthetic request is mapc321bb/settings3018fc/checkerb3bad6, one no-model attempt;
normal5628de/eebb1e remain preserved. A positive synthetic result still does not
establish actual agent reuse, CI-secret isolation or all release requirements.

Environment repair checkpoint (2026-10-11 13:38UTC): goal paused; owner-authorized
repair only. Old temporary base is absent. Durable owner-local verified workspace,
config, exactnative187 and all-tools-denied settings rebuilt; scoped Keychain
login preserved in place with the pinned native namespace setting. Native auth
status exit0 reports claude.ai/firstParty/pro, not validity/capacity. Native config
metadata/backups initialized; no credentials copied or raw status exported.
Independent repair source/data GO, not sandbox enforcement. Protected repair
record and current verified command are linked from the resume record. No checker,
model, CI/trust/public action. Prior progress and all remaining gates stay intact.

Previous conclusion (2026-10-11 09:51UTC): the exact owner-approved data-only
recipient38123365552 passed and remains distinct from actual agent reuse.
Owner-reported isolated Claude187 subscription login reached the normal prompt,
without a model or shell request. The exact disabled synthetic boundary proposal
is integrated throughb90e92c after independentf36527a source/data review; root
5/5 pure controlsPASS53.972ms. No live/native/model/settings action occurred.
Effective authenticated managed-hook/excluded-command/strict-policy authority
remains UNKNOWN; no supported bounded inspection route is established. Exact
synthetic-operation approval follows that prerequisite. Copilot Actions included
credits remain owner-confirmation pending. G2/finalG3/G4 remain incomplete;
publication and external natural usage remain pending/not started.

Agreed Day 0: 2026-10-10 21:24 UTC (owner confirmed). First substantive review: 2026-10-13 21:24 UTC. Daily concise progress summaries. Additional metered spending is $0/day and $0 total for the first 72 hours; only established subscription-included capacity is allowed. Standard public GitHub-hosted validation VMs are now approved: two independent macos-26 ARM64 profile jobs first. Owner confirmed 10 MiB included artifact storage, one-day retention and no paid usage; exact signing enablement is approved, and exact data-only producer trust/provisioning are approved in D5; actual authenticated data-only recipient applicability passed38123365552. Owner approved existing Claude subscription and Copilot personal-use entitlement. Isolated local Claude subscription onboarding succeeded; local synthetic native security passed; hosted OAuth/enforcement and Copilot seat/policy/billing checks remain prerequisites. Explicit demonstration-pair amendment D4: Copilot CLI producer VM A → native Claude Code receiver VM B on independently matched approved macOS runners; Codex acceptance stays separate. Provisioning and blocked time count from kickoff; dates will not be reset. Initial targets remain Day 14 demonstration / Day 28 prepublication readiness, uncalibrated until the real G1 slice.

| Gate | Current status | Evidence / outstanding prerequisite |
| --- | --- | --- |
| G0 | Resource facts still partial | Day 0/caps/cadence and standard public runners approved; source/native preflight reviewed. Two independent macos-26 inventory jobs passed; 10 MiB included storage confirmed. Signer workflow enablement approved; exact data-only producer policy/provisioning approved in D5; local native subscription onboarding succeeded; local and hosted named synthetic native security gates passed with independent review; recipient-specific boundary and Copilot Actions included-billing prerequisite remain unresolved. |
| G1 | Incomplete: current origin authority withheld | Historical08307d4/f6e368bd controlled relocation positives remain evidence, but mapped-input counterexample withdraws unrestricted origin completeness. Containment preserves history only. New explicit sealed recipe preparation is implemented/reviewed; actual selected-project ephemeral preparation completed (66,570.596ms), but that tree remains MATERIALIZED_NOT_SEALED; native sealing/full CLI namespace pending. |
| G2 | Actual recipient/model reuse not run | Both hosted complete runtime prototypes supported; independent21-record comparison passes. Approved amended pair has hosted synthetic native diagnostic PASS; real recipient/project boundary, current origin/trust/profile and Copilot included-billing fact remain pending. No failed prerequisite launches models. |
| G3 | Incomplete: historical authenticated data route demonstrated | Owner-approved exact corrected workflow run38123365552 accepts the signed38096670987 origin and independently establishes importedCURRENT/PASS/eligible, with no equivalent receiver execution. Unrelated/restart preservation and relevantSTALE pass. That historical origin interpretation now cannot authorize reuse. Fresh sound origin, scope/policy bindings and final candidate acceptance remain required; no model claim. |
| G4 prepublication | Not ready | Reviewed implementation/helper subsets and historical alpha.11 exact three-platform acceptance are preserved; current sealed runtime and native boundary still require final independent review and exact combined acceptance. Actual final-bound G1–G3/behavioral V01–V22 and complete-path economics remain outstanding; no publication. |
| Publication / postpublication | Pending owner approval | No main merge, release tag or npm operation in this milestone. |
| External usage | Not started | Owner-approved willing participants separate from technical gates. |

Integration owner: root (Lane A). One writer per shared interface: root owns CLI/daemon/origin capture and facts schema; B owns envelope/parser/trust module; C independently reviews critical boundaries and owns adversarial tests; D owns onboarding and host preflight. All lanes use isolated branches/worktrees. No existing pilot installation or receipt is modified.

| Task | Owner / independent reviewer | Branch and owned interface | Current evidence / next action |
| --- | --- | --- | --- |
| PE-01 resources/profile | Owner + C / integration | Local G0 record + storage-free workflow | Standard macos-26/storage/signing enablement approved. Both full prototypes supported; independent21-record comparison passes; D5 exact data-only trust approved and live recipient passes; local Claude subscription onboarding succeeded, local synthetic native gate passed; matched hosted provisioning/enforcement and Copilot capacity pending. |
| PE-02 minimum decisions | Root / C | `portable-evidence-decisions.md` | D12 explicit stable-tree recipe approved; mapped-input origin completeness finding contained. Fresh interpretation needs actual enforcement/namespace proof, not observer replays. |
| PE-03 fresh origin + export | Root + A / C | Core/CLI and isolated materializer | New portable origins withheld. Reviewed data materialization/protocol@2 does not grant authority; actual staging timeout preserved; fixed diagnostics under review. Old origins cannot be repaired. |
| PE-04 safe envelope/inspect/import | B / C | Envelope/store/pure decision | Strict bounded parsing, explicit exact-digest acceptance, durable separate import selection, lost-selector FAIL replay controls pass. |
| PE-05 relocation slice | Root / C | Recipient/catalog/cached | Historical separate-checkout positives and negatives retained; current contained imported records cannot authorize CURRENT. Sound sealed origin and recipient reevaluation remain pending. |
| PE-06 host handoff | D / C | Policy/JSON/preflight | Installed/imported reporting guide; no-model gate and safe instruction updates pass. Actual portable model behavior NOT RUN. |
| PE-07 machine profile | A / C | Runtime + preflight | Both d04b872 full runtime prototypes supported after finite budgets retaining all-member validation. Independent21-record comparison passes; authenticated data-only recipient eligibility passed38123365552; actual agent reuse pending, old10s failures preserved. |
| PE-08 producer trust | B / C | CI authentication preparation | Exact policy/tool/artifact authentication hardening under review; no automatic acceptance. |
| PE-09 CI route | B+A / C+owner | Exact enabled workflows | Producer/signing38096670987 and one approved corrected recipient38123365552 PASS. That historical approved policy accepted imported eligible evidence independently; models0, no copied observer state. The origin artifact expired; final current origin/policy/candidate binding remains distinct. |
| PE-10 installed handoff | D / C | Installed smoke | Exact alpha.11 artifactf6e368bd… passes installed controlled relocation and both-host policy ownership; publishedalpha.10→candidate same-prefix receipt/config/state preservation on all3OS. Prior @1→@2 upgrade/FAIL replay evidence retained; actual host behavior remains separately gated. |
| PE-11 integrated review | C / integration | Adversarial matrix | Independent same-host origin/publication tests pass; complete V01–V22 and G2/G3 pending. |
| PE-12 release preparation | Integration + C / owner | Reviewed task branch only | Unpublished alpha.11 source08307d4 and exact artifactf6e368bd…; one exact matrix38266596921 PASS on all3OS. Final behavioral/origin/economics gates remain. No main/public actions. |

Local Lane D host proposals bafb2ec/fc408f6/a0d2012: disabled Claude invocation
and both-host controlled generic guidance writer, 12/12 author controls PASS166.5ms,
independently12/12PASS142.38ms. Platform-delta9653b26 author12PASS/1WindowsbranchSKIP154.6ms,
independent source-only review GO5ea02af, no native Windows result. Native Claude2.1.146
lacks the proposed credential-deny feature; official source first adds it in2.1.187.
Isolated verified187 help/version passed. Fresh owned no-auth map/settings were independently
reviewed, selected20 auth/provider/secure-storage keys absent. Actual managed sources
were absent; supported process-only updater guard independently reviewed. One bounded
map-v2 native UI startup reached INITIAL_THEME_ONBOARDING_GATE, zero input/tools/models,
5,155.2ms including owned process SIGKILL/reap after SIGTERM2s. Original report and
independent clarification retained; no retry/bypass. Owner-observed isolated subscription onboarding now succeeds; actual sentinel
sandbox tests remain pending effective authenticated policy proof and exact approval.
Preview/apply fixture files are separate from native
REDUE setup/doctor support, import acceptance and model behavior. No active workflow,
credential or permission is provisioned by these helpers; d04 candidate bytes remain unchanged.

Baseline inspected: `main` and `origin/main` at `b4f286034f43021a74f1babf2c1d0fee5df2a9e5`; package `@redue/cli@0.1.0-alpha.10`. No pre-existing portable implementation or open PR. Owner plan was the only untracked content and is preserved verbatim. Existing worktrees and historical artifacts remain intact.

Current critical boundaries: caller/origin/publication and current-policy controls have independent review. Root at reviewed diagnostic checkpoint (`57cfca3`) is clean when checked; remote remains `d04b872ee0e848e300c0cc9738ad761e48146acc`. Later local onboarding/auth proposals do not replace that exact candidate identity. Reviewed finite budgets and final expiry controls are committed in the tested candidate. Full compiler discovery retains external absent candidates; ordinary default-library lookup remains unsupported. Hosted origin/profile success is not recipient or model acceptance.

Current exact local artifact: source d04b872,80files/158,105 archive bytes, SHA-256 `8695b612a5c33dae945b2bc8df57cd68ca3eefb401aa0ef9ca2850d212979ea2`, manifest/checksum `.local/portable-evidence/candidates/d04b872`. Actual installed origin `473be4ea-cab4-49cd-9405-433af9d8576b`, imported digest `1745893830e1da353ebd9bcb5fb92fe2c0e7c374ef86eddd4d8952887c13e30b`. Recipient/unrelatedCURRENT, relevantSTALE, zero recipient compiler executions; both-host policy ownership passes. Raw local `.local/portable-evidence/installed-d04b872.log`; models NOT RUN. Not public alpha.10 bytes.

Hosted producer/signing38096670987 SUCCESS: origin `02f44ac7-e6fc-4d5e-9757-28357654fef1`, canonical evidence digest `5d16fbf6b101f88843f41a8c61d3c351e5f9e600306dc4936eaaec8d6ea40d57`; artifactID11685889769, ZIP SHA `d5469b8c9f49aa7bca1c7ecadf2a220de21437aa019bdb2722cb87c0cd6b6a29`, retained `.local/portable-evidence/signed-38096670987`. Both profile38096673747 complete prototypes SUPPORTED, independent21-record comparison matches both VMs/signed facts. Required-refresh nativegh2.79 verification PASS as proposal only: producerverifiedtrue/acceptedfalse/localpolicycurrentfalse/reusefalse. Signing/authentication inspection does not accept producer trust or establish recipient CURRENT. Wrapped30,604ms/localstatus634ms are instrumented individual controls, not net-benefit evidence. Root combined focused44/44PASS6.833s; actual integrated boundary1/1PASS25,580.8ms retained.

Final exact-package38096673730 allthree platforms PASS including macOS installed portability. Downloaded CI tarball SHA8695b612… matches local exact bytes. Actual CI PR-merge source `08c7a101e133ff64e2f8a7be2d167edde0421ebb` has tree `889d4404cf7572b2b016b03ad11ca3be199be022`, verified by GitHub API equal to d04b872. Product38096673735 allfour jobs PASS: macOS336PASS26skip, nativeWindows256PASS106skip, Linux22 324PASS38skip; Linux24 jobPASS, count not retained. No new signing/producer attempt was needed.

Earlier installed exact bytes: `.local/portable-evidence/candidates/2bc636a/redue-cli-0.1.0-alpha.10.tgz`, SHA-256 `10ab71da58cd805010900a610b2ce0cb50adee375d697e898d90b8e049c0d71b`. Local and CI downloaded bytes match; CI actual PR-merge source `8d1f5d14dad3891f80f315178cc93c58e2c10e18` shares tree `529d706f3eafa4bfcb970c11aeacef46dfc317db` with 2bc636a. Not public alpha.10 bytes. Actual installed origin `9d6870ed-0bf3-4acd-9248-fcbb96c50fc5`, digest `83560d36ec9783697e61ee8a2b513304bae7d77f9d3c5b2e258f334838ce6c66`; recipient no local invocation/run. Policy updates/idempotence/edited refusals/removal pass for both hosts, not their model behavior. Local retained output: `.local/portable-evidence/installed-2bc636a.log`.

Full coherent archive `59009f8e6ab66c70162871ab10a40da8cfb58ea9` finished 314 tests: 297 PASS, one FAIL, 16 platform skips. The failed test asserted structured refusal through the human `reason` field; the reviewed correction uses `reason_code`. Keep the original failure; C independently reran the corrected copied-Node test on frozen `2beab5e8a4df80cd351402c27a915c7750d6841d`: 1/1 PASS in 43,121.49ms, not a full rerun/PASS claim. The bounded native profiling test passed 1/1 in 8.095s; C independently reviewed the bounded diagnostic route GO, without hosted phase attribution. That local duration is not the hosted timeout's established internal cause.

Latest retained exact CI bytes: `.local/portable-evidence/ci-38095797625/redue-cli-0.1.0-alpha.10.tgz`, verified SHA-256 `7e635a96da36418a364bea454a6170ac793430e3310f936c1f09726c40e9f110`. Actual PR-merge source `eb11c59d78170d922ec16a49534ffe6687da9518` shares tree `5c0bf3dce2843173bf9849051eb012601d0834cf` with3f8117c. Its macOS portable completeness failure remains failed; newer budgets need new validated bytes, not a substituted identity.

Finite-budget controls: root31/31 PASS6.511s; C independently reviewed final post-hash expiration and actual cancellation/end-edit-restore control1/1 PASS27,960.72ms. Root final integrated actual control1/1 PASS25,580.8ms: newest unstable PASS `c8da580b-f085-41d4-a3ff-a9e8c171cb58` stayed non-reusable and historical `72ee6f12-7e93-442b-b507-64b05d8ebd04` survived. These are deterministic/owned real execution controls, not model/machine acceptance. Ordinary deadlines/command/permissions/selection remain unchanged. Synchronous validation can defer cancellation delivery; no immediate-cancellation claim.

Final source3f product CI38095797641: macOS322PASS/25skip, Linux22 310PASS/37skip, nativeWindows242PASS/105skip; Linux24 jobPASS, count not retained. No failures. Profile inventory38095797631 still reports unsupported runtime prototypes on both VMs; do not equate job success to portable eligibility or transfer the signed VM's cause to package/profile failures.

Pre-attempt artifact allowance snapshot: 4,608,374 active bytes +5MiB signing reservation +224KiB package archive reservation =10,080,630 bytes <10MiB. Root cap is192KiB package payload/224KiB archive. Serialize/check actual usage before the single accounted attempt; no extra unreserved upload authority.

Current active artifacts are4,826,222bytes at the verified checkpoint; recheck before any later upload. Next: review disabled host proposals and exact current-policy proposal before recipient acceptance; no new producer/signing push. Actual recipient authority still requires current owner policy and effective receiving-host controls. Preserve prior failures and concrete deadline values. Account-existence question is answered: current resource condition is PENDING_OWNER_AUTH_WORKFLOW/CAPACITY_PROOF, not PENDING_OWNER_ACCOUNT. Amended pair still needs reviewed native OAuth workflow/owner secret, Copilot entitlement/policy/billing and exact producer-policy approval. No main/model/trust/public action is inferred.

## Daily progress — 2026-10-12 UTC (historical)

Hosted Claude's six-check prerequisite is CLOSED/scopedPASS. Recipient runtime
profiling separated full cache-content passes from compiler/catch-up/trust; warm
prototype median36.427→21.606s, cold37.602s remains over35s and is not a model
PASS. Ordinary project still cannot qualify after the actual mapped-change
counterexample; unrestricted origin authority is contained, not declared faster.
D12 stable-tree direction is approved. Materialization@2/protocol3 and restricted
fixtures pass independent review; the first corrected real stage timed out120s
and retained incomplete data with zero compiler/models. Reviewed aggregate
diagnostics located66515ms in14701 per-file fsync calls at116047ms. Removing
only ephemeral stage durability work after independent review enabled one
complete66571ms preparation; all content/namespace/identity guards remain.
Actual compiler/native seal/model acceptance is still pending. No failed gate
launched a model, no frozen alpha.11 bytes or pilot receipts changed. G1–G4 remain
incomplete; Copilot included Actions charging fact is pending. Additional spending
remains$0 and no dates are reset. Next depends on a sound enforced stable tree,
complete local queries and fresh reviewed origin/trust bindings.

## Daily progress — 2026-10-11 UTC (historical)

22:22UTC completion update: connectivity recovered; original product38179134336
ALLfourPASS with zero failures/cancellations (macOS460PASS/27skip,
Linux22/24 each448PASS/39skip, nativeWindows311PASS/176skip). Earlier transient
read failures remain below. No substitute run or signing. Exact installed matrix
already allthreePASS. The follow-up changes only plan/tracker/resume/checklist,
excluded from packaged files; CI source3c87cdc remains explicitly distinguished
from locally preserved documentary follow-up. All new implementation is remote
in PR13; no native/model trial or observer process is running.

22:20UTC standing-authority checkpoint: amendment3c87cdc is normally pushed to the
existing preparation branch and reviewable in draft PR13; no signer/trust change.
Independently reviewed checklist commitsfe891cc/81ac6b0/4da5337 remove obsolete
routine-consent gates and preserve prior failure records. Exact package38179134382
passes allthree platforms; b8122c3b… candidate bytes and e249171… merge tree verified.
Product38179134336 Linux22/Linux24/WindowsPASS, macOSlive when last observed;
subsequent connection failures prevent a newer conclusion. Focused source controls
60PASS/one skip. Native/model0; actual diagnostic and Copilot included-credit fact
remain the two bundled owner prerequisites. Gate status and Day0 are unchanged.

18:47UTC capability update: owner delegates operation; supported Terminal control
and github.com browser navigation are explicitly denied by host/saved policy.
Read-only personal AI-credit API returns404/missing user scope and cannot prove
company-seat included quota. Independent review finds no new unblocked critical
gate. No native/model/CI action or bypass; prior relocation/results preserved.

16:47UTC update: bounded owner-procedure repair completed as inactive preparation.
Independent review and22 mocks pass; root read-only verification passes. Prior
UNKNOWN remains immutable. Native attempt requires new exact approval. No runtime,
model, signing/upload, trust, main merge, publication or resource change occurred.
Preparation failures retained: test-only NameError/module-invocation errors and a
root expected-hash transcription error corrected against the original64-character
hex digest; no actual old-record change. Owner-local procedure has separate
startup/collection/cleanup bounds and durable static checker/OS status capture.

08:06UTC update: corrected data-only lane was newly unblocked by the owner's exact
a6006888 approval. Root verified complete workflow hash at892f603, unexpired exact
artifact11685889769, all retained bindings and clean dedicated branch before one
normal push6b901d0. Recipient38123365552 PASS; imported healthyCURRENT/PASS/eligible
on independent matched VM, origin retained with no equivalent execution. Unrelated
edit/restart pass; relevant editSTALE. Required-refresh producer authentication and
acceptance are actual, not inferred from signing or job success. Models0; no upload,
new signing/trust relationship, permission change, main merge or publication.

Single recipient command samples: preflight1217.684ms, preview190.715ms, authenticated
import5040.374ms, applicability42274.658ms. Four recipient commands48,723.431ms;
14 setup/control/owned-stop commands139,906.693ms are separate. These are commands
from one controlled data-only run, not a benchmark distribution or avoided agent
obligation. The previous completed same-machine sample showed no net saving; it is
not superseded by a cheap-path claim. Broad CI and model comparisons were not rerun.

Copilot Actions entitlement/four included credits remains owner-confirmation
pending. At the09:28UTC checkpoint the owner reports isolated nativeClaude187
subscription login succeeded and the normal prompt appeared, with no model/shell
input and exit. This is owner-observed onboarding success, not an agent-run auth
inspection, effective credential/sandbox proof or model capacity. No secret is
requested. D now owns the smallest proposed no-model checker/settings delta; C
independently reviews it before any application or native tool action.
Actual native no-model boundary and final in-context evidence gates still precede
all model calls. The exact data-only approval no longer blocks this lane. G2 and
final G3/G4 acceptance remain incomplete; external usage NOT STARTED.

Earlier checkpoint at01:19UTC,3h55m since agreedDay0: frozen d04 origin/signing/profile and installed
relocation evidence remains valid; no actual model handoff or live accepted recipient
is established. D5 exact original data-only approval is recorded; revised two-pin
proposal awaits its separately requested approval, not a repeat trust decision.
New productCI892f603 allfour jobsPASS, with independently repacked Windows bytes
explicitly distinguished from prior exact-frozen-byte acceptance. Two complete-path
attempts failed on reviewed harness expectations; neither establishes complete
costs or net benefit. Frozen-module review confirms ordinary post-import PASS may
remain UNVERIFIED until an explicitly selected complete portable local baseline
resolves the catalog. Diagnostic fix is independently reviewed, no engine semantics
changed. One same-obligation completion sample requires final independent review;
failed receipts will be retained rather than erased by disposable teardown.

Historical owner/resource ledger before this attempt: original recipient approval no longer
blocked D5 trust; changed-pin approval then blocked corrected live data acceptance.
Copilot seat/policy/included quota and effective native credential boundary remain
prerequisites; Claude native onboarding/authentication and actual sandbox/credential
proof are unrun. Account existence is answered. No paid usage, model trial, broad
permission change, main merge or publication. Exact approval times before this
checkpoint were not retained; no historic blocked-hour total is invented. Concurrent
implementation/review proceeds while those lanes are blocked. Day14/28 forecast
remains conditional, with formal calibration atOct13 21:24UTC; no date reset.

## Daily progress — 2026-10-10 UTC

Real fresh origin/export/import/independent-checkout applicability is implemented. Independent review addressed parser integer ambiguity, pending/lost-selector FAIL replay, expected owner and export races, origin interval completeness, recipe/consumed-file binding, and final receipt/catalog/input publication races. No remaining known critical defect in the exact same-host/boot prototype. Node22.13.0/DarwinARM64/release25.6.0 and controlled noLib TypeScript5.6.3 are the initial mechanism profile; useful debugger/default-library and cross-machine acceptance are still open.

Evidence: independent portable suite87/87, all four extended publication variants separately passed; root focused78/78 and store/relocation18/18. Full local regressions226tests:211pass,15platformskips,0fail (~564s), source began7b13080 with later leaf/review changes, so not a frozen final-source certificate. Output/policy/preflight22/22; published alpha.10 policy ownership upgrade4/4; preliminary installed exact source1beaaea mechanics pass. Its artifactSHA a8aea832d71d498ed3bde5ee0faffc0da536a08a5ffd04dafd688e2d199e5936 is preserved but superseded.

Failures retained: initial native no_uuid helper could not load; corrected flags independently rebuilt identical reviewed bytes. Fixture prerequisites (Git root, socket path, actual npm dependencies, observed noLib declarations, state outside checkout) were repaired without weakening checks. New policy exposed piped JSON truncation at8192bytes; queued-output completion fixes it and an independent >64KiB check passed. No model trial, signing, account/trust change, publication, new spending or external usage.

Resources: owner now approves two independent standard public macos-26 jobs. Official GitHub docs confirm standard public runner minutes are free; no uploads/cache in the preflight. Existing repository active artifacts total3,980,014bytes, but account-wide allowance is unknown. Billing reads return404 with missing user-scope explanation; no auth scope change. Specific10MiB/one-day included allowance question pending. Claude PENDING_OWNER_ACCOUNT. Prepare exact signing permissions/policy for later review, never auto-trust GitHub delivery.

Blocked ledger: G2 Claude account sinceDay0; G2 profile projection pending actual runner profiles; G3 storage and signer approval pending. Implementation/review proceeds concurrently, so these are lane-blocked intervals. Day14/28 forecast remains conditional on those prerequisites; first substantive calibration at2026-10-13 21:24UTC, not an instruction to wait. No unconditional completion date is justified from one prototype.

Next: commit reviewed preflight/current records, fetch/compare/push task branch, prepare draft PR, run two storage-free profile jobs and standard shared regressions. Pack new exact source/checksum for installed acceptance after coherent review. Resume record gives owners, commits, artifact identities and remaining gates.

## Historical checkpoint — 2026-10-10 UTC, storage and versioned profile

Owner confirmed 10 MiB of included storage with one-day retention. Exact-package run38091702983 passed macOS26/Linux/nativeWindows install/recording/policy-upgrade/removal. Actual checked-out source was GitHub PR merge1eb27106beff80303e5e8434e894c6e2adee7bfd; tree31ab2ee2374c22d096c6a0d99bd1246f0189cfc5 equals branch006b8170ddf754da77d1a01ccab43656e6129dfe. Artifact SHAab07ae0300c9b779b564d23e2eb81b9a4aa718f0de3254ccd899a54cd25ed0ff. This precedes @2 and is not final profile acceptance. Its same-job relocation remains same-machine acceptance. Product run38091703030: Linux22/24 passed; macOS/Windows pending at this checkpoint.

Older b0 product run38090579390 retained a Windows fault-fixture failure: rename of an open file did not reach the successful-replacement assertion. Correctionb2860c9 captures actual error and permits only WindowsEPERM/EACCES to require unavailable/no returned bytes; successful replacement still must be detected. Real in-place mutation remains a separate expected changed-input control. Do not relabel the historical failure as PASS.

Versioned runtime/content profile1d3c0df binds official Node22.13.0, reviewed default OpenSSL configuration, complete native-bound cache content and loaded-image bytes. All OPENSSL_ overrides remain unsupported. Exact root-owned fixed OS child SF_NOUNLINK/native device+inode guard covers the one writable Cryptexes ancestor; other writable ancestors are refused. Independent native rebuild matches SHAd16b6f14ed089c795bf763743a0212b9f4ee4dc2310c39a3231e038dc137dff3. Old @1 imports cannot gain @2 reuse. Original raw local context and immutable origin facts remain unchanged. This trusted-OS profile does not protect against a compromised privileged OS.

Actual @2 local relocation passes; copied Node installation handoff3/3 passes with different physical caller hashes, same retained origin ID and no recipient execution. These are one-machine CLI controls, not model/two-machine acceptance. Independent source review then found the caller-proof/context ordering issue above;81f0877 and both-phase owned-file countertests must be reviewed before machine or model eligibility trials.

Author @2 pure64/64, runtime16/16, policy32pass/1primitive skip and real relocation1/1 (~38s) passed. Earlier malformed/obsolete fixture and strict writable-parent refusals are retained below/local logs; fixes preserve unsupported-version and unsafe-parent rejection. NativeWindows/Linux CLI installation does not imply portable runtime eligibility on those platforms.

Current producer-policy registry has private minted snapshots and selected-authority-path binding. Removed/narrowed/unreadable policies withdraw acceptance. CI token/store integration is under implementation; no live signature, accepted producer policy or authenticated imported CURRENT exists. Signing design is review material only, not enabled workflow authority. Draft PR12 remote006b817; inspect actual local HEAD before resume.

Blocked ledger: Claude account since Day0; signing/producer policy awaits exact owner review. Storage block ended on owner confirmation; implementations continue. No model trial, signing, trust change, new spending, publication or external usage. G0 partial; G1 technical slice; G2/G3 incomplete; G4 not ready. Day14/28 forecast remains conditional, with first substantive calibration2026-10-13 21:24UTC. Next: independently close caller guard, execute the approved two-VM evidence-only transfer, prepare exact signing workflow for owner review, then eligible actual-host trials when their specific prerequisites hold.

## Historical checkpoint — 2026-10-10 UTC, independently controlled authority boundaries

Source7f32838 includes raw caller interval guards, late origin context guard, minted explicit CI import authorization and persisted CI policy coupling. Independent actual copied-Node mutation tests pass: both caller publication phases withdraw reuse; a late origin change preserves the actual PASS but makes the newest origin incomplete/non-reusable. Current policy coupling tests16/16 pass after exact outer/inner subject and refresh-mode drift counterexamples. Removing trust cannot reveal older passing evidence. No live signer, changed producer policy, model execution, publication or main merge.

Installed producer used exact b4c33b193740d6997daa650eecd5f665d58a3b97 artifactSHAec4b7cabdc0ad8d41850b947881730dbd2367c00d91a1935fd07c04624767f48. Actual portable origin7a9a699d-9c7b-4f92-aa05-41e69c447c14, digest996b50d8a2e6c5411bdb37b390403b8793dc02cb1891fb4ea766d292d27b3324; real wrapped execution11,290.2ms and synchronized query587.7ms are individual controls, not economics distributions. Transfer23,246bytes; same-boot receiver refused before installation. Prior invalid-state-prefix fixture failure remains retained. State naming/exact artifact extraction and explicit unsupported-profile/independence reason codes are corrected without product changes.

Earlier exact-package source006b817 run38091702983 passed allthreeOS, but precedes current@2. Product38091703030 Linux22/24 and nativeWindows22 passed; macOS failed one nested test group timeout. Actual Node22.13 countercontrol demonstrates the negative test-name filter unintentionally selects wrapped cases too. Test-only42884a4 partitions exactly11 into8 discovery+3 recording under unchanged180s limits. Recording3/3 passed; discovery7/8 passed, with a distinct conservative initial end-checkpoint-unavailable failure. That failure is retained and under bounded phase diagnosis, not relabeled PASS or attributed to an unproven platform cause.

Owner confirmed10MiB included artifact allowance. Latest repo-active usage4,132,113bytes; the unsigned two-VM controlled transfer reserves2MiB and the existing exact-package job reserves1MiB. Keep one-day retention and verify usage before further uploads; no unrelated artifact deletion. Disabled signing proposal7f32838 uses separate fixed-data signer, bounded parser/read controls and only signer-job contents:read/id-token:write/attestations:write. Its validator/machine tests17/17 pass after retaining and correcting one frozen-test-fixture mutation error. Actual action/dist review and explicit owner enablement remain pending.

G0partial; G1 technical mechanisms pass with final acceptance pending; G2 actual two-machine/agents pending; G3 live authenticated route pending; G4 not ready. Claude blocked sinceDay0 and signing approval are separate lane blockers. Storage block ended on owner confirmation. No forecast reset, no universal portability/economics or external adoption claim.

## Historical checkpoint — 2026-10-10 UTC, actual runner failures and signing approval

Remote source88e8828620c454d69ada41d4593d6105dc2b7d21; local source8397e87 plus reviewed signing enablement pending commit. Frozen local full suite59009f8 is running separately: its result is not yet PASS. No model trial launched.

First two-VM run38093305258: producer wrapped execution22,612.8ms, local healthy CURRENT/PASS/reuse eligible, origin8ffdf893-8403-4e04-8a00-8768ad1f8678, but export preview complete=false. No artifact uploaded; receiver SKIPPED. Cause not established from duration. Static origin/actual-job diagnostics now identify only reviewed reason codes; ee02b47 distinguishes an actual ETIMEDOUT from other probe failures without changing the10s probe bound or eligibility. One next diagnostic attempt is justified; review its evidence before further retry.

Exact-package38093307269: Linux/Windows PASS, macOS portable origin completeness FAIL. Preserved actual PR merge02a3d21a8a401023678447e25c486c004e332039, identical treea89c8e0f1a4fa934509bfbcc1f39f5a7f0f4c2e8 to88e branch; local artifactci-38093307269 SHAe10912264aa1a42c29cbdbc2b06fdcb2dd9617226fb23b970fc843e7b1108492 verified against retained checksums. This is failed current acceptance, not a final artifact.

Product38093307241: Linux22/24 PASS; nativeWindows230PASS/1FAIL/76SKIP. The fixed Ubuntu/POSIX signer validator test did not complete its interpreter (null status); no exact startup cause was captured. bc92774/e4a41ac require completed no-error/no-signal integer process exits before rejection counts, and skip only POSIX signer execution on Windows. Static permissions checks and nativeWindows CLI/package tests remain enabled. Independent review8397e87:9/9 author POSIX tests plus6 independent malformed controls PASS. macOS282PASS/1FAIL/24SKIP: initial CURRENT assertion received UNVERIFIED at macos-direct-probe.test.mjs:160; cause unresolved, no unsafe green. B owns bounded diagnostic test changes, not a relaxed assertion or deadline.

Owner approved signing proposal SHA5770b7f0ac9133fbf0190cf0e238ac800263b632d7f4741f3fddb04882591924 unchanged as.github/workflows/portable-evidence.yml. Only fixed taskbranch producer contents:read and isolated signer contents:read/id-token:write/attestations:write. Exact producer acceptance policy remains unapproved. Unsigned duplicate route becomes explicitly dispatched so storage operations serialize. Active repository artifacts4,290,318bytes plus signing5MiB and package512KiB reservation total10,057,486bytes < approved10MiB; package payload bounded480KiB. Recheck actual usage before each later upload. No unrelated artifact deletion or billing change.

G2 needs an actual receiving-agent host in the independently matched profile; standard CI VMs have no approved model credentials and devMac has different reviewed OS/runtime library content. One consolidated exact-resource question is pending, together with Claude's existing-account approval. No credential copy or permission expansion proposed. Day0 and72h checkpoint unchanged; source/review continues while those lanes are blocked.

## Regression evidence correction — current source2beab5e

Frozen local source59009f8 full suite:314tests,297PASS/1FAIL/16SKIP,643974ms. Supplemental pre-correction signer/boundary suite:44tests,43PASS/1FAIL,128902ms. Both failures hit a test assertion matching PORTABLE_CALLER_CONTEXT_CHANGED against human reason prose; the response actually withheld reuse and exposed that exact structured reason_code. Independent correction2beab5e asserts that field while preserving exit2, nonCURRENT/nonreuse and all four barrier cases. Pure diagnostic/signer13/13PASS; the corrected real frozen-source copied-Node control remains in progress, not assumedpassed.

The previously reported45.51s caller-mutation PASS cannot be reconciled with retained committed38abb5f test versusd453e9a runtime humanmessage. No retained raw run log establishes its precise transient source ordering. Preserve this claimed historical result and receipt history but **exclude it from final acceptance**. A fresh coherent corrected-source control will establish current evidence. This is test-evidence provenance correction, not proof of a released falseCURRENT or an exploit.

Test-only checkpoint diagnostics now use bounded256KiB regular no-follow/nonblocking reads. Independent ownedFIFO control retained the new diagnostic helper's pre-fix1.5s stall; corrected4650c2c returns null/non-green promptly. It never supplies engine authority, recovery or a relaxed assertion. Remote initialUNVERIFIED cause stays UNRESOLVED.

Corrected coherent-source caller control:2beab5e8a4df80cd351402c27a915c7750d6841d actual1/1PASS43.121s. Origin4406bef3-dad6-4448-942b-e9b12aaff614/envelope digestd4d912e62f94ab86987654fe796033791eee5d9b1834f9ff82a1d9c2eb2ae789; recipientzero compiler runs. Stable positive, both raw-metadata mutation phases structuredreason_code/exit2/nonreuse,5s barrierexpiry and laterrecovery allasserted. Log/source record ownedreviewlocal/copied-node-corrected-2beab5e; only parsed in-memory responses, no raw transcript uploaded. This replaces the unreconciled historical claim for current acceptance, not the failedfull-suite result itself.

## Historical native-lane checkpoint — 2026-10-11 09:51UTC

Root preserved owner-completed onboarding and integrated author9aa6262/92b1cc1/
3ba1304/c674b2d plus independentf36527a review throughb90e92c. Public source is
a disabled template; protected owner-local rendered mapSHA d55150b3… binds
checker7d97369c…/settingsb63c0e1e…; original785be all-tools-denied settings unchanged.
Independent5/5PASS53.199ms; root integrated5/5PASS53.972ms. Absolute1s connection
deadline,15s parent cap, bounded replies and runtime-preload presence refusal
were reviewed; pure adapters are not live sandbox proof. No src/bin change, pack,
CI, signing, trust, upload, fixture, credential-file read or native/model launch.

Affected lane is blocked on the supported owner/admin policy conclusion for
applicable authenticated managed local/remote hooks and effective exclusions/strict
controls, then exact synthetic-operation approval. Personal-account status or
pre-login local absence cannot supply that proof. No additional source investigation
is queued after independent review. Copilot's remaining action is its already
requested four-credit Actions included-capacity confirmation. Day0 and deadlines
are unchanged; actual agent/two-machine acceptance and final readiness are unproven.
