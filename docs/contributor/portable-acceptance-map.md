# Portable-evidence acceptance pointers

Current conclusion, 2026-10-12: technical controls and one-machine installed
relocation/upgrade and one live authenticated matched-machine CLI recipient are
evidenced. Actual portable cross-agent/receiving-agent reuse is not established. This map identifies controls and missing proof; it does not
promote test-source presence to a gate PASS. The integration tracker owns current
run/commit results and the independent review record.

Latest reviewed preparation de37055 product38199960090 passes569tests per job:
macOS542PASS27skip, Windows344PASS225skip, Linux22/24 each530PASS39skip,
zero failures. Exact package38199960095 passes macOS/Linux/nativeWindows;
downloaded merge-source13ba3eb has the same tree as de37055 and SHA-256b8122c3b… .
These bytes
remain separate from frozen d04b872/8695b612… and public alpha.10. The new
coherently hashed incomplete-origin signer control independently exercises V13/
V22 completeness;12/12 validator controls pass. Actual model handoff, final
release identity and complete economics remain distinct gates. The old signed
origin artifact is expired; retained results do not authorize its substitution.

Historical exact candidate validation: package matrix38101767565 at source
05c1d869d40903c4663710e1967901e18ca8fc0b passes pack/macOS/Linux/nativeWindows.
Downloaded four-file artifact verifies80files/158,546bytes and SHA-256
b8122c3bdcedf42a374ba3a87681ca7654360bc6c10daa64b5ac93a79ca7b190,
byte-identical to the223f231 local package. Source/bin trees are identical.
MacOS includes real installed portable origin/separate recipient mechanics;
platform-specific installed-policy controls report macOS8PASS, Windows/Linux
1PASS7skip. No installed-script label establishes actual model behavior.

Historical product38101769601 at the same source has481tests/job:macOS454PASS27skip,
Windows305PASS176skip, Linux22/24 both442PASS39skip; zero failure/cancellation.
Its Windows independent repackSHAdae6d9…/159,489bytes is separate from the exact
b812 package matrix. Candidatealpha10 metadata is not publicalpha10 identity.
Final release version/bytes and remaining agent/machine/trust gates stay pending.
These are source/package results, not new model or accepted-producer evidence.

Historical package/source records remain preserved: frozen d04b872 product
38096673735 (362tests/job) and exact package38096673730 verified8695…/158,105bytes;
later892f603 sourceCI38099703953 (472tests/job) passed with distinct Windows
independent repack5e3a…/159,042bytes. None is relabeled as the new exact candidate.

One owner-approved data-only recipient38123365552 at6b901d08708678bc51b8f9f1349555ecc1f5c198
passes the exact a6006888… route on frozen d04/8695. Required-refresh native
verification and policy revision1 accept origin02f44ac7…/digest5d16…; recipient
independently returns healthy CURRENT/PASS/imported/reuse_eligible=true with null
local invocation. Boot and raw Node identity differ from the producer while the
reviewed profile matches. Unrelated edits and restart preserve the same imported
origin; relevant source edits are STALE; no equivalent receiver execution/local
run exists under the reviewed helper checks. Models0. The original failed
recipient38098482463 remains history. This establishes the G3 positive CLI route,
not actual agent reuse, all negative/final-release binding or the complete goal.

One declared owner-local installed completion sample at harness223f231 with frozen
8695 bytes passes. It records16 workflow commands/39,890.201ms and directly
measured39,893.226ms wall time, versus two exact plain obligations/212.743ms.
Setup10,670.230ms, controls258.356ms and cleanup450.977ms are separately retained.
Imported baseline/unrelated responses share origin daa040d3… and digestff8e449…;
relevant edit is STALE. New ordinary local PASS1b36a1d5… remains UNVERIFIED/nonreuse
with PORTABLE_LOCAL_SELECTION_BARS_FALLBACK through restart. The two earlier
failed preparations remain historical; the3a response reason was not captured.
This is one controlled same-host noLib sequence, not model adoption, two-machine
acceptance or evidence of avoided obligations/net savings. Signing/retrieval/
authentication, agent transport and whole-task benefit are not measured here.

Canonical requirements: [REDUE-PE-001](../plan/portable-evidence.md#71-minimum-matrix).
Current exact installed scope and artifact identities:
[host preflight](portable-host-preflight.md). Pure fixtures and fault injections
are separate from real wrapped compiler execution and actual agent trials.

| Requirement | Existing concrete control / evidence pointer | Remaining proof |
| --- | --- | --- |
| V01 independent session | [relocation](../../test/portable-relocation.test.mjs), installed same-state stop/start upgrade | Actual portable model fresh session |
| V02 cross-agent | [policy upgrade](../../test/acceptance/portable-policy-upgrade.mjs) and both-host installed update/removal | D4 amended Copilot/native-Claude actual handoff; Codex separate. Existing accounts approved; native auth/workflow/capacity proof pending |
| V03 separate checkout | [installed smoke](../../test/acceptance/portable-installed-smoke.mjs), [copied-Node boundary controls](../../test/portable-boundaries.test.mjs) | Final release-ready bytes after applicable changes; the frozen real separate-checkout slice is evidenced |
| V04 independent machine | [machine helper](../../test/acceptance/portable-machine.mjs) rejects same boot; signed hosted origin38096670987 now complete, earlier producer failures retained | Actual receiving-agent handoff remains pending; authenticated matched recipient CLI applicability38123365552 is evidenced, separate from model behavior |
| V05 relevant content | [relocation](../../test/portable-relocation.test.mjs) and installed source edit STALE | Future release-ready exact artifact result; frozen installed source-edit rejection remains evidenced |
| V06 membership/absence | [boundaries](../../test/portable-boundaries.test.mjs): newly resolvable candidate, removal/rename, post-exit membership | Retain final combined test evidence |
| V07 compiler/runtime/input | [facts](../../test/portable-facts.test.mjs), [applicability](../../test/portable-applicability.test.mjs), [runtime cache](../../test/portable-runtime-cache.test.mjs); full supported profile38096673747 all21 records independently match both VMs and signed origin | Actual recipient applicability/reuse remains separate from matched inventory |
| V08 topology/case/external root | [facts](../../test/portable-facts.test.mjs) and [boundaries](../../test/portable-boundaries.test.mjs): distinct topology/Unicode/case, external query refusal | Ordinary default-library outside-root gap remains unsupported |
| V09 payload/digest/schema | [envelope](../../test/portable-envelope.test.mjs), [store](../../test/portable-store.test.mjs), exact artifact gates | Final combined regression result |
| V10 producer/trust revocation | [CI trust](../../test/portable-ci-trust.test.mjs), [authorization](../../test/portable-ci-authorization.test.mjs), [current registry](../../test/portable-producer-policy.test.mjs); signed subject strictly authenticated as inspection only | D5 exact producer-policy and corrected route approval are recorded; live required-refresh accepted recipient38123365552 passes. Revocation/negative controls remain distinct and require final implementation binding |
| V11 untrusted executable data | [envelope](../../test/portable-envelope.test.mjs), [boundaries](../../test/portable-boundaries.test.mjs): unknown instructions/path traversal refused | Final installed import negative controls |
| V12 bounded parser/read | [envelope](../../test/portable-envelope.test.mjs), [command](../../test/portable-command.test.mjs), actual FIFO refusal in independent boundaries | Final combined platform result |
| V13 incomplete origin | [boundaries](../../test/portable-boundaries.test.mjs): restored edits, lost end observation, origin context mutation; earlier hosted failures stopped upload, current complete origin succeeded | Retain failed origins and conservative deadline controls; never repair incomplete origin from later CURRENT |
| V14 recipient interval | [boundaries](../../test/portable-boundaries.test.mjs): delayed publication selection/catalog/input mutation and copied-Node caller mutation | Final candidate result; unavailable actual host negative |
| V15 old PASS/new FAIL | [store](../../test/portable-store.test.mjs), [applicability](../../test/portable-applicability.test.mjs), actual installed newer FAIL replay in [upgrade](../../test/acceptance/portable-upgrade-smoke.mjs) | Final combined regression result |
| V16 unordered conflicts | [applicability](../../test/portable-applicability.test.mjs), [CI catalog](../../test/portable-ci-catalog.test.mjs) | Bind controlled conflict results to the final implementation; live authenticated recipient positive now passes; negative controls remain distinct |
| V17 untrusted conflict | [store](../../test/portable-store.test.mjs), [CI catalog](../../test/portable-ci-catalog.test.mjs) preserve local history | Final combined regression result |
| V18 old interpretation | [upgrade](../../test/acceptance/portable-upgrade-smoke.mjs): actual @1 bytes, same-state history preserved, obsolete import refused, newer FAIL not overwritten | Future packaged upgrade instructions checked against final bytes |
| V19 interrupted persistence | [store](../../test/portable-store.test.mjs) exact pending recovery, lost-selector refusal; [CI authorization](../../test/portable-ci-authorization.test.mjs) post-write revocation | Final combined platform/receipt regressions |
| V20 explicit fresh/npm | [shared policy](../../src/agent-policy.md) preserves obligation; prior activation behavior is historical | New portable actual model fresh/npm cases, not counted from policy text |
| V21 unavailable/offline trust | [CI trust](../../test/portable-ci-trust.test.mjs) controlled refresh failure and explicit bounded offline bundle | Required-refresh live positive38123365552 passes; controlled unavailable/offline negatives remain distinct and bound to final source |
| V22 producer executed check | [signing design controls](../../test/portable-ci-signing-design.test.mjs), [machine](../../test/portable-machine.test.mjs): complete origin required despite local CURRENT; run38096670987 real wrapped compiler origin02f44ac7… and exact signed subject independently verified | Complete-origin CI control established, not Copilot model execution. Retain retry/cache/filter negatives and separate recipient trust/applicability |

All host prerequisites use the existing [fail-closed preflight](portable-host-preflight.md).
Missing expected conditions launch zero models. Machine transfers carry only the
bounded evidence file and identity manifest, never observer state or a precomputed
CURRENT answer. No external natural-use evaluation has started in this lane.

Gate requirements remain distinct from these controls. G1's real frozen origin,
separate-checkout import/positive recipient applicability and relevant rejection
are evidenced; the calibration forecast is a separate checkpoint. G2 still needs
actual amended Copilot/native-Claude receiving-agent handoff on two independently
matched machines, with eligible evidence actually visible and no equivalent
execution, plus required negative/fresh obligations. Supported native credential,
managed-policy, entitlement/capacity and exact host provisioning remain prerequisites;
a static proposal or theme-onboarding UI supplies none of those proofs.

G3 positive current owner-policy authenticated recipient import and independent
CLI applicability are now demonstrated through38123365552. This is actual
acceptance, beyond the earlier read-only signature inspection. Existing negative
trust/conflict/refresh controls and final release-source binding remain separate;
no whole-gate completion is self-certified here. D5 trust and exact corrected
source-pin approvals are recorded; native agent provisioning remains separate. G4 prepublication still needs final exact candidate,
affected platform/regression and installed upgrade/onboarding evidence, independent
boundary review, and honest complete-path economics. Same-host scripted economics
alone cannot cover signing/retrieval/authentication, a fresh second machine, or
agent-tool cost. External participation remains separate and NOT STARTED.

The declared installed completion sample is now reconciled without a benefit
claim. Highest-value deterministic work is to retain its failed preparations,
ship the selected-check ordinary-PASS/nonreuse explanation in final bytes, and
bind existing controls to the final candidate. No broad suite, new model trial, provider expansion or native
startup is authorized by this map. Publication/postpublication remain owner gates.
