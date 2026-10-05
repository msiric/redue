# Alpha release gate — 2026-10-05

Decision: **DO NOT SHIP** while the intended publisher lacks a verified publishing
authentication path. The technical package gate now passes on all three platforms.
No public visibility change, package publication, tag or release was performed.

## Ground truth and license

The continuation began clean at `451206a`, two commits ahead of the actual remote
`918154c`. GitHub access was restored; both pending commits were pushed normally.
The personal `msiric/redue` repository was freshly verified PRIVATE.

The owner-selected standard Apache-2.0 license is installed, including the unchanged
application appendix from the [Apache Software Foundation](https://www.apache.org/licenses/LICENSE-2.0.txt).
Package and lockfile metadata agree; README links to LICENSE. No custom restrictions
were added. The tracked source/fixture review found no vendored third-party code
requiring a new NOTICE. Runtime dependencies remain separately installed with their
own licenses/notices, rather than bundled or relicensed.

The candidate is now `redue@0.1.0-alpha.1`; binary `redue` points to `bin/redue.mjs`,
Node engine remains `>=22`, and `private: true` remains until the final publishing
gates clear. `src/` and `bin/` have no differences from tested runtime `918154c`.

## Existing Windows evidence retrieved and classified

[Original run 37238822164](https://github.com/msiric/redue/actions/runs/37238822164)
concluded FAILURE at runtime `918154cc782c6c6786cc9e0543aa7efcc49da5a9`.
Windows job `111543228646` ran Server 2025 build 10.0.26100, image
`windows-2025-vs2026` / `20260925.250.1`, Node 22.23.3, npm 10.9.9.

- Native regression suite: **61 passed, 12 platform-specific skips, zero failures**
  (73 tests). The applicable Windows cases were not skipped.
- Installed-package smoke: failed before the verification workflow because init
  classified the fixture typecheck as recording-only instead of ready.
- The later PowerShell-shim step was skipped after that failure.
- Logs also include Git line-ending and Actions Node-runtime deprecation warnings;
  neither caused the failure. They do not invalidate the passing regressions.

A diagnostic run at `55c3acb` established that the disposable fixture lacked
`node_modules/typescript/package.json` at both short and canonical Windows paths
(ENOENT). Both the installed shim and direct Node invocation conservatively refused
qualification. This was incomplete **test-fixture installation**, not evidence of a
false CURRENT or a missing product file. The diagnostics do not establish a more
specific low-level reason for the manual copy's missing manifest.

`9f1e998` replaces manually copied compiler/shim files and the stub lockfile with
normal npm installation of pinned TypeScript 5.6.3 inside the owned fixture. It
asserts the actual installed compiler version before init. No qualification,
observation or evidence rule changed. Failure-only prerequisite diagnostics remain.
This is a corrected setup followed by validation, not blind retries until green.

## Exact-artifact cross-platform validation

[Run 37283086590](https://github.com/msiric/redue/actions/runs/37283086590),
at `9f1e99820d5f2eef657d27e58a4b6dfe0ca0dfe1`, passed all jobs. The lean manual
workflow packs once, downloads the same artifact on each OS, then invokes the
actual npm-installed binary/shim. It does not publish. Historical full regression
suites were not needlessly repeated.

| Environment | Node | Exact package workflow | Initial / restored receipt |
| --- | --- | --- | --- |
| macOS hosted | 22.23.2 | PASS | `65fbd454-246b-4ee3-8b1e-8ad92d5cdfb1` / `3b809f1b-cb84-4752-8e2c-c1cc2188af80` |
| Linux hosted | 22.23.3 | PASS | `3e31f842-c212-4673-bd30-990225e0b1b9` / `782509ae-efa4-4fcc-82ea-6e31af1e0bc4` |
| Windows Server 2025 | 22.23.3 | PASS | `441ad2cd-5287-435d-9bcb-7ca4c4eae421` / `b9e1e2c3-438b-4995-8de7-1b3b5d1a5a20` |

Each exercised help/version, init preview and write, start, wrapped typecheck,
cached and synchronized status, explain/JSON, unrelated CURRENT, relevant
STALE/PASS with changed path, rerun CURRENT, stop UNVERIFIED, restart with preserved
receipt, fresh-process inheritance, recording-only PASS, remove-state and uninstall.
Cleanup asserted the project and installed compiler survived state removal before
the entire owned disposable fixture was removed. No real user project was used.

Windows timestamps: initial CURRENT at 08:22:33Z, inherited CURRENT at 08:22:36Z,
unrelated CURRENT at 08:22:39Z, relevant STALE at 08:22:42Z, restored CURRENT at
08:22:55Z, restart/inherited receipt at 08:23:09Z. These are workflow observations,
not a new latency benchmark or evidence of customer demand/saved work.

All three report identical tarball SHA-256:
`30310c40b970b56e35ff95ae429973e849bc132d194ead951da7cfc303e43406`.
The inspected `redue-0.1.0-alpha.1.tgz` has 52 files and 83,610 compressed bytes.
It includes the standard LICENSE. No Git metadata, local state/receipts, caches,
node_modules, test/CI content, acceptance reports, matched credentials, personal
absolute paths or corporate identifiers were included. The largest file is the
56,182-byte daemon module. Runtime npm audit reports zero known advisories.

The package still carries the intentional private publication guard. Once the
authentication gate clears, removing that guard changes artifact bytes: repack and
run the same lean exact-tarball workflow before the final public-release checkpoint.
This is release metadata validation, not another engineering milestone.

## npm and final publication boundary

The actual public `https://registry.npmjs.org/redue` endpoint returned HTTP 404 on
2026-10-05, including the final check. No unrelated exact package was found. This
is availability evidence, not a reservation or a server guarantee of first-publish
acceptance. Do not stage a placeholder or change the name to claim ownership early.

Authenticated `npm whoami` and filtered profile data identify personal account
**msiric**, the intended initial unscoped package owner. No npm organization is
involved. The latest profile reports **tfa: false**. The owner was informed of
[npm's publishing authentication requirements](https://docs.npmjs.com/requiring-2fa-for-package-publishing-and-settings-modification/):
normal interactive publishing requires 2FA; special bypass tokens are a different
explicit authentication path, not assumed authorization to create/store credentials.
No token was created or copied by this work. No authentication policy was changed.

The remaining blocker is a verified publisher authentication path. After it clears,
finalize the private guard and validate those exact package bytes. Then return for
the deliberate human approval before repository visibility or npm publication.
Enable GitHub private vulnerability reporting when the repository is public, before
publishing. Neither technical validation nor an npm login authorizes public release.
