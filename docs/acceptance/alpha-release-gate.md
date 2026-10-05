# Alpha release gate — 2026-10-05

Decision: **DO NOT SHIP**. Required remote evidence and publication ownership could
not be verified. This is an evidence/access block, not a newly demonstrated product
defect. No feature or platform work was begun.

## Verified local baseline

- Clean `main` began at `18e95c2b7bf714c67c8cae75c7c3f0cd088fc84a`.
- Last fetched `origin/main`: `918154cc782c6c6786cc9e0543aa7efcc49da5a9`.
- Local main was one commit ahead of that cached reference. Actual remote HEAD
  could not be read; the cached reference is not fresh remote evidence.
- Package: `redue@0.1.0-alpha.0`, `private: true`, originally `UNLICENSED`.
- CLI: `redue` → `bin/redue.mjs`; Node engine `>=22`.
- Repository: personal `msiric/redue`, last verified PRIVATE. No visibility change
  was made; current remote visibility could not be independently re-read.

## Existing Windows result

[Run 37238822164](https://github.com/msiric/redue/actions/runs/37238822164),
Windows job `111543228646`, remains **UNKNOWN**.

The intended runtime was `918154c`, Windows Server 2025 / Node 22. Its final tested
SHA, conclusion, test counts, skips/warnings and installed-package smoke result
must be retrieved from that existing run. Earlier macOS/Linux and public-project
passes remain historical evidence in [productization](alpha-productization.md);
they do not establish this final Windows job's result.

The shell could not resolve GitHub; the GitHub connector returned 404 for both
the private repository and job. That response does not establish repository
deletion or job failure. No replacement job was dispatched and nothing was pushed.

## License completed

The owner selected Apache-2.0. LICENSE contains the standard text from the
[Apache Software Foundation](https://www.apache.org/licenses/LICENSE-2.0.txt),
including its unchanged application appendix. Package and lockfile root metadata
now use `Apache-2.0`; README links to the license. No custom restrictions were added.

The tracked source/fixture inventory contains project implementation and generated
test fixtures, plus scripts referencing public repositories rather than vendored
copies. No copied third-party implementation requiring a new NOTICE was identified.
Runtime dependencies remain separately installed with their own licenses/notices;
they are not bundled into this tarball or relicensed by this change.

## npm gate remains blocked

A direct request to `https://registry.npmjs.org/redue` failed DNS resolution;
HTTP 000 is not a registry 404. A separate public web fetch could not retrieve it.
The previous day's registry 404 is not a present availability/ownership guarantee.

`npm whoami --registry=https://registry.npmjs.org` also failed DNS resolution.
Authenticated username, 2FA status, exact package owner and publishing rights are
therefore **UNKNOWN**. No npm organization was selected or created. Prefer the
verified personal publisher account when available; do not infer it from the
GitHub username or switch to another package name.

`private: true` remains. The recommended first public version is `0.1.0-alpha.1`;
version mutation and final release packaging wait for the namespace/ownership gate.

## Local artifact inspection

The licensed private alpha.0 package was packed and its archive actually inspected:

- 52 files, 83,610 compressed bytes.
- LICENSE bytes match the local standard license exactly.
- No Git data, local state, receipts, cache, node_modules, tests, CI or acceptance
  reports included; no matched personal absolute paths, corporate identifiers or
  credential patterns.
- Largest file: `src/daemon.mjs`, 56,182 bytes.
- SHA-256: `3e46053587a09828ad0ae5e275d09652a1c9fd213d688ac26b62b868e2766879`.

This is an inspectable private artifact, **not** the final alpha.1 release artifact.
The current binary reports alpha.0. No runtime behavior changed. `git diff --check`
passes. Exact-candidate installation on macOS/Linux/Windows was not rerun while
network/CI access and the preceding release gates were blocked. The old candidate's
smokes are not relabeled as validation of a future licensed alpha.1 artifact.

## Resume only the blocked release checks

Use an environment with permitted GitHub/public-registry network access and
authorization for this private repository. Retrieve the existing run, then push
local commits normally. Confirm the npm publisher, 2FA and exact namespace.
After those pass, set alpha.1 release metadata, inspect the exact tarball, and run
only the lean macOS/Linux/Windows package validation. Reassess the release gate.

Repository visibility and npm publication still require the final human checkpoint.
No public repository, npm publication, GitHub tag or release was created. No global
settings, credentials, corporate repositories or stable installations were changed.
