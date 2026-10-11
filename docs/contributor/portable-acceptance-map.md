# Portable-evidence acceptance pointers

Current conclusion, 2026-10-11: technical controls and one-machine installed
relocation/upgrade are evidenced. Actual portable cross-agent reuse, independent
matched-machine receiver reuse and a live accepted authenticated CI producer are
not established. This map identifies controls and missing proof; it does not
promote test-source presence to a gate PASS. The integration tracker owns current
run/commit results and the independent review record.

Final combined product run38096673735 passes all applicable d04b872 runtime
controls: 362 tests per recorded job, macOS336PASS26skip, Windows256PASS106skip,
Linux22 324PASS38skip; Linux24 jobPASS/count not retained. Exact package38096673730
passes macOS/Linux/nativeWindows with verified CI/local SHA8695b612… and equal
source tree. These are regression/platform results, not model or accepted-producer
gates; later disabled host proposals have separate leaf controls.

Canonical requirements: [REDUE-PE-001](../plan/portable-evidence.md#71-minimum-matrix).
Current exact installed scope and artifact identities:
[host preflight](portable-host-preflight.md). Pure fixtures and fault injections
are separate from real wrapped compiler execution and actual agent trials.

| Requirement | Existing concrete control / evidence pointer | Remaining proof |
| --- | --- | --- |
| V01 independent session | [relocation](../../test/portable-relocation.test.mjs), installed same-state stop/start upgrade | Actual portable model fresh session |
| V02 cross-agent | [policy upgrade](../../test/acceptance/portable-policy-upgrade.mjs) and both-host installed update/removal | D4 amended Copilot/native-Claude actual handoff; Codex separate. Existing accounts approved; native auth/workflow/capacity proof pending |
| V03 separate checkout | [installed smoke](../../test/acceptance/portable-installed-smoke.mjs), [copied-Node boundary controls](../../test/portable-boundaries.test.mjs) | Final candidate rerun after runtime changes |
| V04 independent machine | [machine helper](../../test/acceptance/portable-machine.mjs) rejects same boot; signed hosted origin38096670987 now complete, earlier producer failures retained | Successful matched recipient applicability and actual model handoff, not implied by origin/inventory |
| V05 relevant content | [relocation](../../test/portable-relocation.test.mjs) and installed source edit STALE | Final combined artifact result |
| V06 membership/absence | [boundaries](../../test/portable-boundaries.test.mjs): newly resolvable candidate, removal/rename, post-exit membership | Retain final combined test evidence |
| V07 compiler/runtime/input | [facts](../../test/portable-facts.test.mjs), [applicability](../../test/portable-applicability.test.mjs), [runtime cache](../../test/portable-runtime-cache.test.mjs); full supported profile38096673747 all21 records independently match both VMs and signed origin | Actual recipient applicability/reuse remains separate from matched inventory |
| V08 topology/case/external root | [facts](../../test/portable-facts.test.mjs) and [boundaries](../../test/portable-boundaries.test.mjs): distinct topology/Unicode/case, external query refusal | Ordinary default-library outside-root gap remains unsupported |
| V09 payload/digest/schema | [envelope](../../test/portable-envelope.test.mjs), [store](../../test/portable-store.test.mjs), exact artifact gates | Final combined regression result |
| V10 producer/trust revocation | [CI trust](../../test/portable-ci-trust.test.mjs), [authorization](../../test/portable-ci-authorization.test.mjs), [current registry](../../test/portable-producer-policy.test.mjs); signed subject strictly authenticated as inspection only | Current exact owner-policy approval and live accepted import/revocation controls |
| V11 untrusted executable data | [envelope](../../test/portable-envelope.test.mjs), [boundaries](../../test/portable-boundaries.test.mjs): unknown instructions/path traversal refused | Final installed import negative controls |
| V12 bounded parser/read | [envelope](../../test/portable-envelope.test.mjs), [command](../../test/portable-command.test.mjs), actual FIFO refusal in independent boundaries | Final combined platform result |
| V13 incomplete origin | [boundaries](../../test/portable-boundaries.test.mjs): restored edits, lost end observation, origin context mutation; earlier hosted failures stopped upload, current complete origin succeeded | Retain failed origins and conservative deadline controls; never repair incomplete origin from later CURRENT |
| V14 recipient interval | [boundaries](../../test/portable-boundaries.test.mjs): delayed publication selection/catalog/input mutation and copied-Node caller mutation | Final candidate result; unavailable actual host negative |
| V15 old PASS/new FAIL | [store](../../test/portable-store.test.mjs), [applicability](../../test/portable-applicability.test.mjs), actual installed newer FAIL replay in [upgrade](../../test/acceptance/portable-upgrade-smoke.mjs) | Final combined regression result |
| V16 unordered conflicts | [applicability](../../test/portable-applicability.test.mjs), [CI catalog](../../test/portable-ci-catalog.test.mjs) | Live authenticated conflict control after signer approval |
| V17 untrusted conflict | [store](../../test/portable-store.test.mjs), [CI catalog](../../test/portable-ci-catalog.test.mjs) preserve local history | Final combined regression result |
| V18 old interpretation | [upgrade](../../test/acceptance/portable-upgrade-smoke.mjs): actual @1 bytes, same-state history preserved, obsolete import refused, newer FAIL not overwritten | Future packaged upgrade instructions checked against final bytes |
| V19 interrupted persistence | [store](../../test/portable-store.test.mjs) exact pending recovery, lost-selector refusal; [CI authorization](../../test/portable-ci-authorization.test.mjs) post-write revocation | Final combined platform/receipt regressions |
| V20 explicit fresh/npm | [shared policy](../../src/agent-policy.md) preserves obligation; prior activation behavior is historical | New portable actual model fresh/npm cases, not counted from policy text |
| V21 unavailable/offline trust | [CI trust](../../test/portable-ci-trust.test.mjs) controlled refresh failure and explicit bounded offline bundle | Live authenticated route declared mode result |
| V22 producer executed check | [signing design controls](../../test/portable-ci-signing-design.test.mjs), [machine](../../test/portable-machine.test.mjs): complete origin required despite local CURRENT; run38096670987 real wrapped compiler origin02f44ac7… and exact signed subject independently verified | Complete-origin CI control established, not Copilot model execution. Retain retry/cache/filter negatives and separate recipient trust/applicability |

All host prerequisites use the existing [fail-closed preflight](portable-host-preflight.md).
Missing expected conditions launch zero models. Machine transfers carry only the
bounded evidence file and identity manifest, never observer state or a precomputed
CURRENT answer. No external natural-use evaluation has started in this lane.
