# Portable evidence resume

Read canonical [REDUE-PE-001](portable-evidence.md), [tracker](portable-evidence-tracker.md), [decisions](portable-evidence-decisions.md) and [independent review](../acceptance/portable-boundary-review.md). Resume `/Users/mariosiric/Documents/redue`, branch `dev/portable-evidence`; verify HEAD/status. Planning baseline is history, never a rollback target.

Day0 **2026-10-10 21:24 UTC**; first substantive review2026-10-13 21:24UTC. $0 additional daily/total spending first72h, existing included capacity only, four approved lanes. Standard public macos-26 VMs approved; owner confirmed **10 MiB included artifact storage, one-day retention**. No larger runners, model credentials in CI, paid provisioning, main merges or publication. Exact signing workflow permissions and producer trust require owner review before enablement. Claude **PENDING_OWNER_ACCOUNT**. External pilot NOT STARTED.

## Current source and owners

Root owns shared CLI/daemon/facts/runtime/catalog; B owns envelope/store/CI authentication+authorization; C independently owns adversarial review/tests; D owns policy/onboarding and proposed machine harness. Isolated worktrees `../redue-portable-import`, `../redue-portable-review`, `../redue-portable-onboarding`. One writer per interface. Draft PR12 https://github.com/msiric/redue/pull/12; tracker issue11. Remote branch006b817; root last checkpoint81f0877, ahead normally. No force push or main change.

Current @2 runtime profile1d3c0df: official Node22.13.0 content, DarwinARM64/release25.6.0, exact reviewed OpenSSL startup, complete native-bound dyld cache/loaded images. Native helperSHAd16b6f14ed089c795bf763743a0212b9f4ee4dc2310c39a3231e038dc137dff3. Fixed root-owned OS child SF_NOUNLINK/dev+ino guard protects the exceptional writable Cryptexes ancestor. Unknown startup overrides/compiler/external input boundaries remain unsupported. Raw origin caller metadata is not rewritten. Old@1 portability cannot become@2 automatically.

**Critical open acceptance:** C found caller proof/context ordering race after projection. Root81f0877 captures raw context before proof, compares before request and again after response. Any change yields PORTABLE_CALLER_CONTEXT_CHANGED/no reuse. Gated owned test barriers after-proof/before-publication expire after5sec, no green. C is adding actual copied-Node mutation controls; do not run model or machine eligibility until reviewed. This is an unreleased source finding, not a demonstrated released-product defect.

Actual @2 same-machine relocation and copied Node handoff3/3 pass; recipient retains imported origin and creates no runs-v1. Different physical Node identity is projected only within the reviewed contract. No two-machine/model acceptance yet. Default-library ancestor queries outside observed root remain unsupported: do not change the debugger project to fit.

B is integrating minted CI authorization with current authoritative `state/portable-producers-v1.json`. Rootcb7a62e path binding, Dtests628a55e integrated7ad41d2. Cprofile/copyNode reviewad5cc37 integrated1e77243. Current policy cannot be supplied by imported evidence; authentication alone grants no trust. CI acceptance must revalidate policy through persistence and response; removed trust cannot reveal older PASS. No live signing or CI-trust acceptance yet.

## Artifacts and platform evidence

Preserve b0cdd5e077b04915482b43c3af126515fa352761 installed prototype `.local/portable-evidence/candidates/b0cdd5e/redue-cli-0.1.0-alpha.10.tgz`, SHA1ff1bbdb73bc672bb6ff6b253f91d951d405f6591eb0c3d50d7a5b7fd6c20692; preliminary1beaaea SHAa8aea832d71d498ed3bde5ee0faffc0da536a08a5ffd04dafd688e2d199e5936. Neither is current@2 nor publishedalpha10.

Exact-package run38091702983 PASS allthreeOS. Artifact `.local/portable-evidence/ci-38091702983/redue-cli-0.1.0-alpha.10.tgz`, SHAab07ae0300c9b779b564d23e2eb81b9a4aa718f0de3254ccd899a54cd25ed0ff; adjacent manifest/SHA256SUMS/source. Actual PR merge source1eb27106beff80303e5e8434e894c6e2adee7bfd has identical tree31ab2ee2374c22d096c6a0d99bd1246f0189cfc5 to branch006b817. This precedes@2. Product run38091703030 Linux22/24passed, macOS/Windowspending. Older b0Windows fault fixture failure retained; b2860c9 distinguishes actual failed rename from successful replacement and retains in-place changed-input control.

Public pilotalpha10 separate source2e939ca SHA30adbf2e…; frozenalpha9/handoffs/pilotreceipts untouched. No final@2 exact artifact yet. Repack only after coherent source/review; identify by commit+checksum, never metadata alone.

Two independent runner inventory profiles match: image20260907.0351.1, macOS26.6.2/build25G83, ARM64/APFS, NodeSHA5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc, TS5.6.3e674b5dc4dac50f6e91be30094aeea983a1f340231717e62b0b6199ae3049eb2, cacheUUIDf2e86c536052388bba715a0c9b569413. Inventory is not portable acceptance. DevelopmentMacbuild25G241 has different cache/library bytes; strict local-to-runner incompatibility remains expected.

## Next commands / gates

1. Independently test81f0877 actual caller mutation and stable controls; integrate Ctestcommit, run affected relocation/regressions.
2. Integrate Bminted authorization only after review; root supplies CLI/catalog/response authority, not a second verifier.
3. Review Dproposed two-VM workflow before active push; transfer only intended envelope/minimalmanifest, no observer state or precomputed CURRENT. Controlled explicit digest test is not automatic producer trust.
4. Prepare concrete signing workflow/validator and exact permissions for owner review; do not enable OIDC/signing or alter accepted-producer policy before approval.
5. Collect current remoteCI and push reviewed task commits normally; retain all failures. Record actual PR merge source/tree, artifact checksum.
6. Actual Codex/Claude trials require approved specific host resources, usable account and fail-closed in-context preflight. No failed prerequisite launches a model. Claude pending cannot be substituted.

G0partial, G1technicalslice, G2/G3incomplete, G4notready. Complete economics, V01–V22, actualcrossagent/twomachine and finalbytes remain. Continue safe independent work; do not wait for72h or routine acknowledgment. No public gate completion/publication without owner approval.

## Latest resume override — source7f32838

Root integrates Btest-group42884a4 and Dmachine-precondition99f0933; no main/publication. Current independent caller/origin mutation controls and CI policy coupling are reviewed and passing. Source and actual evidence above supersede earlier pending labels, while historical failures remain.

Next: finish C disabled signer/action review; enable only independently reviewed unsigned two-VM workflow under approved storage budget, normal-push preserved branch (origin006b817, no divergence). Collect actual VM results. B diagnoses distinct initial end checkpoint unavailable; D maps V01–V22 and installed controls. Signing remains disabled outside.github until owner approval; Claude PENDING_OWNER_ACCOUNT.

Preserved new installed artifact `.local/portable-evidence/candidates/b4c33b1/redue-cli-0.1.0-alpha.10.tgz`, SHAec4b7cabdc0ad8d41850b947881730dbd2367c00d91a1935fd07c04624767f48; not final/source7f or publishedalpha10. Actual producer data retained separately, no state transfer; fixture controls did not launch models. Repo current artifact usage4,132,113bytes plus2MiB controlled transfer+1MiB package reservation fits confirmed10MiB; check again before uploading.

## Current resume override — signing approval and actual runner evidence

Read tracker current conclusion/checkpoint first. Root8397e87; origin88e8828,17commits ahead before workflow enablement commit. Exact reviewed signing proposal5770b7f... now owner-approved; copy remains byte-identical, no acceptance policy approved. Serialize unsigned workflow_dispatch versus signing push and reserve package512KiB to keep active4290318+5.5MiB=10057486 <10MiB. Do not launch another unreserved artifact job.

Machine38093305258 failed complete-origin gate (localCURRENT/PASS); no transfer/receiver/models. Package38093307269 macportableFAIL,Linux/WindowsPASS; savedci-38093307269 SHAe1091226..., PRmerge02a3d21/tree matches88e. Product38093307241 Linux22/24PASS, WindowsPOSIXinterpretercontrolFAIL(corrected/reviewedbc92774+e4a41ac), macinitialUNVERIFIED assertionFAIL (bounded diagnostic ownerB). Root local frozenfull59009f8 archive64830 stillrunning; preserve logs and no PASS claim untilcomplete.

Next: independentlyreview enabledworkflow exactbytes/storage changes, coherent commit and normal push once; collect ONEfixeddiagnostic producer's actual reason before further changes. Signing succeeds only if producercomplete; no timeoutincrease/guard relaxation. C owns adversarial reviews. B owns test checkpoint diagnostics. D owns installed/onboarding reason documentation. G2receivingagentmachine and Claude account questionpending; no model launch until actualprecondition. Exact current producer policy needs a separate owner approval after signed subject identities exist. Keep PR12draft; no main/npm/tags.
