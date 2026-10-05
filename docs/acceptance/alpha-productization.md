# Alpha productization acceptance — 2026-10-05

Starting point: clean private `main` at `ef1f89c`. Platform semantics and the
accepted Windows performance limitation were inherited, not reopened.

## Friction found and corrected

- Missing config produced an ENOENT rather than telling the user to initialize.
- `explain CHECK` was unavailable; detail always listed every check.
- Ordinary human status omitted CURRENT rows and exposed implementation reasons.
- Start/stop/run emitted internal JSON by default instead of useful human output.
- Initialization did not clearly separate candidate qualification from evidence.
- The npm tarball included tests, CI files, and historical engineering reports.
- README still described a private macOS/Linux research install and omitted the
  accepted Windows support and economic limitation.
- A user-selected runtime directory could fail with an internal naming error.
  REDUE-prefixed owned directories now work; ownership and external-root checks remain.

Human output now labels historical failures distinctly, explains stale inputs,
shows recording-only coverage, and points to the appropriate next command. JSON
keeps independent outcome/applicability/reuse fields, with additive changed_inputs.
The installed command preserves check stdin/stdout/stderr; run --json is therefore
not a JSON-only stdout stream. Read commands provide the integration interface.

## Package and onboarding

Standard npm pack/install/uninstall, with no custom installer or global setting
edits. Tests install into an isolated prefix, invoke the generated executable/shim,
exercise the real TypeScript golden workflow, record incomplete evidence, restart,
and remove only owned state/install resources. Test dependencies are copied into
the disposable fixture; this is explicitly not a real-repository demand experiment.

The npm tarball has an explicit runtime/user-documentation allowlist. Derived
state, .local configuration, dependencies, tests, CI, and historical evidence do
not ship. Package remains private:true pending explicit publication approval.
User, contributor, and historical acceptance docs are separated; no useful
platform evidence was deleted. Legacy runtime/schema naming is preserved.

The canonical agent policy starts with cached status, reuses qualified CURRENT/PASS,
reruns STALE when needed, reports historical failures, and chooses sync versus rerun
for UNVERIFIED. No automatic cost prediction or package-manager-specific thresholds.
Cached --short uses the same expiry/liveness safeguards and never synchronizes.

## Concrete blockers uncovered by acceptance

A hosted macOS regression found that, after history was disabled and recovery
completed, a subsequent immediate sync could see old installed bytes before live
events arrived. The new deterministic test drops delivery after recovery: it fails
on `2dec108` (CURRENT instead of STALE) and passes after `7d88ca4`. Decisions now use
existing deterministic reconciliation whenever the history barrier is unavailable.
No new index, scheduler, receipt, or applicability semantics were introduced.

The runtime audit found YAML stack exhaustion and the unpatched braces recursion
advisory (reported twice through braces/micromatch). YAML is patched to 2.8.3.
The two micromatch APIs in use are exact delegates to picomatch 2.3.2. The final
candidate depends directly on that same matcher, removing the unused vulnerable
brace parser. No glob syntax/input coverage is reduced. Disposition is in SECURITY.

Public registry read on 2026-10-04 returned HTTP 404 for exact redue. This establishes
no currently published package, not reservation or ownership. Source/history scans
found no secrets or private repository content. A broad path scan matched synthetic
Windows `c:/users/a name/...` fixture strings, not actual user paths. Dependency
lockfile public-mirror URLs were normalized to registry.npmjs.org; no global npm
configuration changed and no sensitive history required rewriting.

## Evidence

- `b4f689b`: onboarding, cached reader extraction, human presentation and JSON additions.
- `2dec108`: packaging/docs/CI preparation. First packed public matrix: all three passed
  ([run 37237574367](https://github.com/msiric/redue/actions/runs/37237574367)).
- Initial product CI found the macOS defect; the superseded Windows job was cancelled
  when the corrected revision was pushed. That run is not counted as a complete pass.
- `7d88ca4`: bounded post-history reconciliation correction.
- `96356ef`: parser guard/YAML patch/public registry lockfile URLs.
- Local macOS corrected suite: 57 passed, 16 platform skips, zero failures (73 total).
- Local installed-package demo: CURRENT/PASS → unrelated CURRENT → relevant STALE/PASS
  → rerun CURRENT/PASS → stop UNVERIFIED → restart CURRENT with the same receipt.
  A fresh CLI process inherited it; no new agent-behavior or saved-work claim is made.

## Final candidate validation

Final runtime revision: `918154c` (later documentation-only commits do not change
that implementation). `09f49dd` removed the unnecessary wrapper/parser dependency;
`918154c` corrected its direct pin to the original lockfile's nested picomatch 2.3.2.
The intermediate 2.3.1 artifact was not published and is superseded. The final
runtime audit reports zero known advisories. No advisory waiver is needed.

[Product/package matrix](https://github.com/msiric/redue/actions/runs/37238822164):

| Environment | Regression result | Actual tarball installation |
| --- | --- | --- |
| Local macOS, Node 22.13.0 | 57 pass, 16 platform skips, 0 fail | Passed, owned prefix removed |
| Hosted macOS, Node 22.23.2 | 57 pass, 16 platform skips, 0 fail | Passed |
| Hosted Linux, Node 22 | 61 pass, 12 platform skips, 0 fail | Passed |
| Hosted Linux, Node 24.21.0 | 61 pass, 12 platform skips, 0 fail | Passed |
| Hosted Windows Server 2025, Node 22 | Final result not retrieved | Final result not retrieved |

The final Windows job is `111543228646` in the product/package matrix above. It
was still running at the last successful API read. On continuation, CLI access to
GitHub failed, the connector could not access this private repository, and browser
access was denied. Its conclusion is unknown, not a pass or a demonstrated product
failure. Retrieve that existing job before declaring this candidate fully validated;
do not rerun the entire matrix merely to replace missing access to its result.

The Windows-only prefix fixture initially inherited npm test's lifecycle options
and correctly got UNVERIFIED. Its test environment now matches its declared direct
shell scenario, as the other fixtures already did. No product environment check was
relaxed. Superseded CI jobs cancelled on later pushes are not counted as passes.

[Final public-repository matrix](https://github.com/msiric/redue/actions/runs/37238849767),
using installed tarballs and the same pinned genuine repositories as platform acceptance:

| Repository | Initialization / selected contract | Result |
| --- | --- | --- |
| renzojohnson/google-workspace-mcp | Root npm typecheck ready; test/build recording-only | Full golden workflow passed; inherited receipt `5171bcec-845f-4a10-aded-0251fab740f1` |
| streamich/memfs | Yarn 4 node-modules selected fs-node-utils workspace typecheck | Full golden workflow passed; inherited receipt `0cfaf7ff-321f-429d-a312-a2d3ec4d2391` |
| BerriAI/litellm-bench | pnpm 12 isolated selected result-store workspace typecheck; direct compiler invocation printed | Full golden workflow passed; inherited receipt `8a7e83e5-eee0-4564-82bb-890bd7f1974c` |

Each performed init, wrapped PASS/CURRENT, unrelated preservation, relevant STALE,
rerun CURRENT, restart/reconciliation, fresh-process inheritance, and scoped removal.
Workspace selection uses CLI flags rather than a hand-authored input plan. Existing
workspace declaration-build prerequisites are part of disposable project setup;
application scripts and package-manager modes are not changed to force qualification.
This is engineering acceptance, not new evidence of customer demand or time saved.

[Release preparation](https://github.com/msiric/redue/actions/runs/37238848058)
passed on Linux, including exact public registry lookup, runtime audit, and packaged
CLI install/workflow/uninstall. The runtime candidate tarball was 79,870 bytes with
51 files (278,870 unpacked bytes); SHA-256:
`93381895dd21a13d4e03ca7d5d9d1e26568dd6462e3d9a5d4a5ce03458e9bd20`.
Documentation-only updates can change subsequent package bytes; repack and inspect
the final release artifact after license/publication metadata is finalized.

## Release disposition

Technical acceptance is separate from permission to publish. The repository is
still private, package private:true, license UNLICENSED pending an owner decision,
and there has been no npm publication, public GitHub release, or visibility change.
The personal npm publisher account/2FA/name ownership is not established merely
by the registry 404. GitHub private vulnerability reporting must be enabled when
the repository is made public, before package publication; its API is currently
unavailable for this private repository.

Do not publish until the final Windows product/package result is retrieved, the
license/copyright decision and explicit publication approval are complete, npm
ownership is confirmed, and the reviewed release metadata is finalized. No additional
platform or feature milestone is required unless that existing result exposes a defect.

Known alpha limitations remain prominent: bounded evidence rather than correctness
proof; uncaptured direct commands; recording-only tests/lints/builds; expensive sync
versus cheap reruns; conservative unsupported layouts/filesystems; evolving alpha
config/API; no cloud/team sync, IDE extension, or background execution.

The completed acceptance session recorded removal of its local disposable observers
and isolated installs. Temporary downloaded artifacts were not present when work
resumed; the private Actions run is the source for the candidate artifact, subject to
its retention period. The resumed environment denied process inventory, so no new
claim about currently running processes is made. No observer was started on continuation.
Corporate repositories, the pending corporate command, and stable/research project
installations were not used or modified. No system/package-manager globals changed.

Continuation hygiene: a full-history Gitleaks scan covered 73 commits and found no
leaks. Final report edits are documentation-only and do not change runtime `918154c`.
The final local help/version and 22-document relative-link checks passed. Package
dry-run after the documentation corrections contains 51 files, 79,916 compressed
bytes and 278,991 unpacked bytes, with no test, CI, local-state or acceptance-report
paths. These dry-run sizes do not replace the checksum of the earlier CI artifact.
Final documentation is committed locally; pushing it remains pending GitHub access.
