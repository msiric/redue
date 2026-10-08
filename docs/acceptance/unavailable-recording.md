# Unavailable-start recording

Current conclusion: ready for review in PR #10; not merged or published. On the
unchanged fixed A–H workload, all three new candidate cycles were cheaper than
their corresponding ordinary compiler totals (0.74–1.53 seconds saved). All three
contemporaneous PR #9 cycles remained slower. This narrow improvement comes from
omitting qualification work on the already non-reusable H path, not a new healthy
path optimization. Four independent Codex trials showed one eligible reuse, two
recorded executions, and honest recovered-observer inspection; zero observed
unsafe reuse. This finite sample is not a typical-workload or whole-agent claim.
The prior complete negative [A–H result](wrapped-run.md) remains historical evidence.

Candidate packed source: `78ab0535f541d99ce6ed1cd2a5062447f6f6fd68`.
Filename: `redue-cli-0.1.0-alpha.9.tgz`.
SHA-256: `4b9c21cae902e6d4aa9ef6181d996d8ba9d130dc97516352150e4178f5afa0c9`.
This is an **unpublished evaluation artifact with inherited alpha.9 metadata**,
not the PR #9 publication artifact (`d971aef5…07f`). Later main-merge/documentation
commits do not change any packaged file. Publication needs separate approval,
an unused version, and final versioned-artifact acceptance.

## Boundary

Only the guarded macOS direct-TypeScript recipe with its one built-in probe can
omit qualification work. The necessary starting snapshot has already failed or
reports unhealthy observation. That fact makes this invocation permanently
non-reusable under the existing receipt rules. Missing discovery metadata with a
healthy snapshot still takes the full caller-probe fallback.

Command/config/plan resolution, read-only state ownership, actual caller-context
capture, run ownership, exact configured child execution, cancellation, true
exit/signal, durable immutable outcome selection and reload remain. No environment,
compiler argv, permission, interpretation, observer authority or supported provider
changes. Both caller qualification probes and the ending snapshot are omitted only
after the missing-start decision. Missing values stay null, and the receipt retains
specific start failure and skipped-validation reasons with stable=false. Contract
coverage remains separate from that invocation's inadequate observation.

Recovery before launch, during compilation or after exit cannot repair the start.
A later fully observed execution is required. New non-reusable outcomes displace
old passing selections even if reload fails; incomplete persistence remains closed.

A boundary test additionally found that run did not validate the ownership marker
used by lifecycle commands. A separate commit adds read-only refusal for missing,
malformed or mismatched markers before lock acquisition/execution. It neither
initializes nor repairs ownership. This is not a demonstrated exploit or claim
about affected users.

## Validation and predeclared sample

- `test/unavailable-direct-run.test.mjs`: real compiler PASS/FAIL; healthy certificate
  and full fallback; malformed/unhealthy start responses; recovery at each boundary;
  relevant edits; start failure/cancellation; incomplete persistence and selection;
  recovery via new execution; custom probes excluded. Process/probe marks establish
  omitted work. Controlled response and SIGSTOP race fixtures are explicitly
  synthetic, not model or timing evidence.
- `test/run-ownership.test.mjs`: no execution/receipt mutation on invalid ownership.
- `test/acceptance/unavailable-package-smoke.mjs`: same tests through the installed
  artifact; macOS shortcut, Linux/Windows unchanged paths and ownership refusal.
- Preserve the released PR #9 artifact and new candidate as distinct exact bytes.
- Predeclare three paired A–H cycles, alternating B/C/C/B/B/C, eight corresponding
  ordinary compiler runs each. Same fixed four reuses/four required executions;
  no model adoption claim from replay. Setup and restart stay separate.
- Four independent Codex trials after in-context gates: eligible reuse, explicit
  fresh execution, unavailable PASS, recovered-observer inspection. No score retries.

## Historical diagnostic slices

PR #9's three prior cycles cost 18,205.4 / 20,669.0 / 21,068.3 ms versus matched
ordinary totals 17,442.6 / 18,631.0 / 20,206.3 ms. All full cycles were slower.
A–G alone cost 14,012.8 / 15,938.8 / 16,451.4 versus 15,129.3 / 16,032.6 /
17,802.0 ms. H cost 4,192.5 / 4,730.2 / 4,617.0 versus 2,313.3 / 2,598.4 /
2,404.3 ms. These matched slices diagnose overhead; they do not replace the full
negative workload. Four reuse queries cost 2,254.2 / 1,972.4 / 1,944.8 ms;
four wrappers added 5,895.3 / 6,780.5 / 6,500.4 ms above their actual children.

## Final acceptance

[Full CI](https://github.com/msiric/redue/actions/runs/37857254172) passed on
macOS Node 22, Linux Node 22/24 and native Windows Node 22. Node 22 totals were
123 pass/16 conditional skips on macOS, 112/27 on Linux and 111/28 on Windows,
zero failures. The separate local macOS run was 123 pass/15 skips; the subsequently
added independent ownership test passed too.

[Exact package matrix](https://github.com/msiric/redue/actions/runs/37857252733)
passed on all three OSes with SHA `4b9c21ca…a0c9`. The installed boundary suite was
8/8 on macOS; Linux/Windows each passed ownership refusal and skipped the seven
macOS-only optimization tests. Existing public CLI/shim, both compiler versions,
proxy negative control, historical receipt/containment upgrade, explicit recipe
selection and policy update/removal remained green. Linux/Windows are regression
coverage, not a claim that the shortcut is enabled there.

Initial focused testing retained four failures: two controlled-server EOF fixture
errors, a recovery race not actually placed inside the child interval, and the
real pre-existing ownership-refusal gap. Corrected fixture boundaries plus the
isolated ownership guard passed all seven tests. The standalone ownership fixture
also initially omitted required project metadata; adding its ordinary package
metadata made it valid. No model was launched for these fixture failures. No
assertion, product timeout, interpretation or security control was relaxed.

## Fixed workflow economics

Same pinned `microsoft/vscode-js-debug@b1c00772e46d4ed6e73442944fb5f66b533431d2`,
TypeScript 5.5.2, Node 22.13.0, npm 10.9.2, macOS 26.7.1, normal caches and the
approved Codex proxy/socket context. Three pairs, order B/C/C/B/B/C, each with a
new observer session, four potential reuses and four required executions. Eight
ordinary compiler runs alternated with the eight decisions in every session.
No competing local test suite; no excluded failures or slow samples (none failed).
Each measured sequence was timed directly, not constructed by adding medians.

| Session / variant | Complete A–H ms | Matched ordinary ms | Ordinary minus REDUE ms | A–G REDUE / ordinary ms | H REDUE / ordinary ms |
|---|---:|---:|---:|---:|---:|
| 0 / baseline | 17294.9 | 16318.9 | -976.0 | 13472.2 / 14290.0 | 3822.7 / 2028.9 |
| 1 / candidate | 15161.3 | 16686.7 | 1525.4 | 12841.3 / 14652.5 | 2320.1 / 2034.2 |
| 2 / candidate | 15353.2 | 16656.8 | 1303.6 | 13000.5 / 14614.2 | 2352.7 / 2042.6 |
| 3 / baseline | 17039.4 | 16410.2 | -629.2 | 13271.9 / 14393.2 | 3767.5 / 2017.0 |
| 4 / baseline | 16934.8 | 16717.5 | -217.3 | 13151.1 / 14610.8 | 3783.7 / 2106.7 |
| 5 / candidate | 15818.0 | 16556.5 | 738.5 | 13372.6 / 14446.0 | 2445.5 / 2110.4 |

All full-cycle distributions have n=3: baseline mean/median/max 17,089.7 /
17,039.4 / 17,294.9 ms, total 51,269.1 ms; candidate 15,444.2 / 15,353.2 /
15,818.0 ms, total 46,332.5 ms. Corresponding ordinary totals were 49,446.6 and
49,900.0 ms. Candidate saved 3,567.5 ms across its three cycles (7.1% of its matched
ordinary total). With n=3, nearest-rank p90 equals maximum; this is not tail reliability.

Per-path distributions below show mean / median / max, n=3 each, in milliseconds.

| Complete measured path | PR #9 | Candidate |
|---|---:|---:|
| A initial decision + record | 3874.8 / 3965.5 / 3989.9 | 3792.9 / 3796.1 / 3828.5 |
| B unchanged reuse | 571.6 / 571.0 / 575.9 | 521.4 / 569.7 / 577.8 |
| C unrelated-edit reuse | 481.0 / 453.3 / 557.8 | 526.0 / 570.7 / 585.7 |
| D stale decision + record | 4013.1 / 4025.2 / 4029.9 | 3916.5 / 3940.7 / 4048.4 |
| E inherited reuse | 542.4 / 594.2 / 604.0 | 434.5 / 427.7 / 463.0 |
| F explicit fresh | 3399.2 / 3427.7 / 3518.9 | 3450.9 / 3483.4 / 3638.6 |
| G independent reuse | 416.3 / 417.3 / 424.6 | 429.3 / 422.7 / 447.2 |
| H unavailable + record | 3791.3 / 3783.7 / 3822.7 | 2372.7 / 2352.7 / 2445.5 |
| startup first query | 929.7 / 1165.7 / 1169.3 | 1132.6 / 1133.9 / 1157.9 |
| restart fresh baseline | 3312.6 / 3343.9 / 3374.5 | 3476.3 / 3497.5 / 3628.6 |
| restart start + first inherited query | 1975.2 / 1988.5 / 2065.9 | 1928.6 / 1865.5 / 2068.8 |

A/D include the required decision then wrapped execution; F deliberately has no
reuse query; H includes its unavailable query then execution. B/C/E/G provide the
four subsequent synchronized decisions, including visibility of each new recorded
baseline. Setup/install/start are outside A–H and retained separately. Observer
start n=9 per variant: baseline mean/median/max 1,837.6 / 1,428.8 / 5,165.8 ms;
candidate 1,431.8 / 1,337.0 / 1,675.5 ms. No startup improvement is attributed to the
shortcut. Restart baseline execution and start-plus-first-query costs are above.

Healthy initial wrapped command means were 3,325.0 → 3,316.1 ms; overhead above
that command's actual compiler child 1,245.7 → 1,248.1 ms. For D, wrapper overhead
1,366.8 → 1,269.7 ms; F 1,311.9 → 1,384.8 ms. Those mixed healthy differences are
not a claimed optimization. H's actual wrapped command mean fell 3,665.4 →
2,249.3 ms; its child measured 2,036.3 → 2,113.0 ms, so wrapper overhead fell
1,629.0 → 136.3 ms (medians 1,617.0 → 127.0; maxima 1,665.5 → 157.6).

Counts establish the mechanism: each variant retained 18 healthy caller
certificate validations. Baseline had six full caller probes from three H runs;
candidate had three irreversible skip marks and **zero** full caller probes.
No healthy certificate fallback occurred in these timing samples. Daemon
certificate probe counts overlapping decisions were 38 and 40; no eliminated
background work is claimed. Start checkpoint in H still took about 1.9 ms and
durable persistence about 12 ms. No CPU/RSS measurements were made.

A–G/H slices diagnose costs, not substitute a more favorable workload. Recording
still costs roughly 1.25–1.38 seconds beyond compilation when healthy, plus any
necessary preceding decision. A reuse query costs roughly 0.42–0.58 seconds versus
about 2.06 seconds for ordinary compilation here. Sufficient later reuse can repay
recording; repeated edits/fresh execution without reuse add cost. H now adds little
but creates no reusable asset. These are workload conditions, not a claim about
real-world reuse frequency or a new cost scheduler.

## Four actual Codex sessions

Codex 0.162.0, independent ephemeral sessions, same approved workspace-write,
managed proxy and exact state/socket allowance. No permission/environment changes.
[JSON execution traces](https://learn.chatgpt.com/docs/non-interactive-mode) and
immutable receipt transitions were retained owner-locally, not published raw.
All four expected in-context preconditions passed; no retries or extra model calls.
Setup/instructions preceded the fresh in-context baseline run. Public source only.

| Trial | Agent-visible evidence and action | Receipt | Verification tool interval / whole task ms |
|---|---|---|---:|
| B eligible | Healthy schema 1 CURRENT/PASS/eligible; one sync; no compiler/npm execution; accurately reported reuse | retained `9269d306-0e66-4c34-8817-2c3dda8eb996` | 401.5 / 16,302.0 |
| F explicit fresh | No reuse query; actual configured wrapped compiler PASS; accurately reported fresh execution | new `a930f9fc-557f-456e-a4b6-c22b1de3617e` | 3,311.4 / 29,297.5 |
| H unavailable | Failed sync with unhealthy UNVERIFIED/PASS/not eligible; actual wrapped compiler PASS; explicitly reported non-reusable result | new `4d9b7b3b-1d71-4c26-bc0a-e7a6eb7c6b93` | 2,288.3 / 20,136.9 |
| R recovered | Healthy schema 1 UNVERIFIED/PASS/not eligible for H's same receipt; no fresh execution; accurately reported historical PASS insufficient for current verification | retained H receipt | 382.1 / 33,325.5 |

One actual eligible reuse, two compiler executions, three sync queries (one failed),
zero unsafe reuse, zero uncaptured equivalent executions. R was an inspection task,
**not** another avoided required verification. F retained both caller validations;
H emitted one shortcut mark and zero caller probes, and remained non-reusable on
recovery. Actual compiler durations F/H: 2,090 / 2,050 ms. Tool-event intervals can
include transport; they are separate from the CLI replay and whole-task times.
No causal whole-agent speedup is established. Claude and cross-host behavior NOT RUN.

Cleanup stopped the owned observer, uninstalled only the disposable candidate,
confirmed no model edits, and retained all 93 immutable runs (including all 60
pre-existing records and all 90 records present before model setup). Normal
installations, selected project config/instructions, receipts and prior handoffs
were not deleted or changed.

## Decision

Review this focused change for a future release; no automatic merge/publication.
Stop this optimization here. The next product priority is a limited opt-in
real-development evaluation of **reuse frequency** on already supported projects:
this fixed sequence establishes mechanism and modest CLI savings, not how often
real users reach enough later eligible decisions to repay recording overhead.
