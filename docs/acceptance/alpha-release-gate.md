# Alpha release gate — 2026-10-05

Recommendation: **SHIP**. All technical, licensing, namespace and publisher checks
passed for the candidate below. This recommendation is not publication approval.
The repository is still PRIVATE; npm publication, tag and GitHub release have not
been performed. Stop for the owner's deliberate public-release checkpoint.

## Final gate

| Gate | Result |
| --- | --- |
| Technical | PASS |
| Windows final evidence | PASS after corrected smoke-fixture setup |
| License | Standard Apache-2.0 installed in source and package |
| Exact npm redue namespace | Available: fresh unauthenticated public-registry HTTP 404 |
| npm publisher | Personal msiric; 2FA auth-and-writes, pending null |
| Release artifact | PASS: inspected and publish dry-run successful |
| Exact cross-platform package smoke | PASS: macOS, Linux, Windows |
| Repository/package hygiene | PASS |
| Repository visibility | PRIVATE |
| npm publication | NOT PUBLISHED |
| Version | 0.1.0-alpha.1 |

No npm organization is involved. The registry 404 is not a reservation or a promise
that a future publish will be accepted; recheck identity/namespace when releasing.
No credentials, tokens or recovery codes were copied into the product or reports.

## Exact publication candidate

- Tested package-content commit: `2355466debf0391638b066d50259ade76e36803f`.
- [Final exact-artifact workflow 37351739467](https://github.com/msiric/redue/actions/runs/37351739467): all jobs successful.
- Package: `redue-0.1.0-alpha.1.tgz`, 52 files, 83,643 compressed bytes.
- SHA-256: `2b102075831992932c19dbd459a22e00f419db29f0e85e448689aed884ef2a5a`.
- Retained local artifact/manifest/checksum directory (ignored by Git):
  `.local/release-candidates/0.1.0-alpha.1-2355466/`.
- Metadata: `private: false`, `license: Apache-2.0`, `publishConfig` public/alpha.
- CLI: `redue` → `bin/redue.mjs`; Node engine remains `>=22`.

The workflow packs once, then all three OS jobs download and install those identical
bytes. Each log records the checksum above. A local npm publish dry-run against
that exact tarball passed; no real publish command was executed. Older artifacts
with a private guard or earlier README/changelog bytes are superseded.

| Environment | Node | Package workflow | Initial / restored receipt |
| --- | --- | --- | --- |
| Hosted macOS | 22.23.2 | PASS | `dbdc1320-f357-49c1-994d-11be8fe33ba3` / `294101f4-2050-4613-9004-d6737102c7a3` |
| Hosted Linux | 22.23.3 | PASS | `f7e7cf0e-904b-4f24-b927-f64770fe6e17` / `a1b15ab6-ae2c-4e24-a06e-476cf26eed53` |
| Native Windows Server 2025 | 22.23.3 | PASS | `628026bf-eb6d-46a8-a3e4-f48e4830f548` / `6f9b90b7-3f5d-4057-a611-0f9b9ebeb061` |

Each exercised help/version, init preview/write, start, wrapped qualified typecheck,
cached/synchronized status, explain/JSON, unrelated CURRENT, relevant STALE/PASS,
rerun CURRENT, stop UNVERIFIED, restart with the historical receipt, fresh-process
inheritance, recording-only PASS, owned-state removal and installed-command removal.
The fixture includes a space/Unicode path. Windows uses npm's generated native shim,
not WSL or Git Bash. A separate process represents each named demo role; this is
engineering acceptance, not new agent-behavior, demand or saved-work evidence.

## Original Windows failure preserved

[Run 37238822164](https://github.com/msiric/redue/actions/runs/37238822164)
concluded FAILURE at `918154cc782c6c6786cc9e0543aa7efcc49da5a9`.
Job `111543228646` ran Windows Server 2025 build 10.0.26100, image
`windows-2025-vs2026` / `20260925.250.1`, Node 22.23.3, npm 10.9.9.
Its full regression suite passed: **61 pass, 12 platform skips, zero failures**
(73 tests). The applicable Windows cases were not skipped.

Its package smoke failed before verification: init reported recording-only. The
following PowerShell-shim step was skipped. Failure diagnostics at `55c3acb`
established missing `node_modules/typescript/package.json` (ENOENT at both short
and canonical paths) in the disposable fixture. The installed shim and direct Node
both correctly withheld qualification. The evidence does not establish a more
specific low-level reason for the manual copy's missing manifest.

`9f1e998` replaced that manually assembled compiler/shim and stub lockfile with a
normal npm installation of pinned TypeScript 5.6.3 in the owned fixture, asserting
the installed version before init. This fixes test setup, not product semantics.
The corrected private-guard candidate passed run `37283086590`; publication metadata
then passed `37294202889`. Final candidate text passed the workflow listed above.
The original failure was not relabeled as a pass or retried blindly.

Logs include Git line-ending and Actions runtime-deprecation warnings. These did
not cause the failure or skip applicable product cases. Historical macOS/Linux,
public npm/Yarn/pnpm, hardlink and Windows 11 acceptance remains inherited.
No full historical campaign was repeated for release metadata/documentation changes.

## Licensing, hygiene and release scope

The owner chose the unchanged standard [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0.txt),
including its standard appendix. Package/lockfile metadata agree. No custom
commercial restrictions were added. Source/fixture review identified no vendored
third-party implementation requiring a new NOTICE. Dependencies keep their own
licenses/notices and are installed separately, not bundled or relicensed.

The exact tarball was opened and inspected: no Git data, local state/receipts,
caches, node_modules, tests, CI, acceptance reports, matched credentials, personal
absolute paths or corporate identifiers. LICENSE bytes match the source. Runtime
npm audit found zero vulnerabilities. Relative documentation links pass. Full Git
history scanning found no leaks; later report-only commits also receive that scan.

`src/` and `bin/` remain unchanged from runtime `918154c`. The source and shipped
README retain conservative evidence semantics and prominent sync-cost/direct-command
limitations. Legacy internal/state naming is intentional compatibility, not a new
brand. No product feature, platform optimization or architecture work was added.

All package tests stopped their owned observers and removed their disposable state,
install prefixes and project fixtures. No normal user/corporate project or shared
package store was mutated. The final artifact is intentionally retained for review
and publication; it is separate from runtime evidence and earlier installations.

## Final human checkpoint

The release commit(s) and evidence report are pushed only to the private repository.
After explicit approval, follow the exact-artifact sequence in
[the release procedure](../contributor/releasing.md#reviewed-first-alpha-sequence).
Do not rebuild a different tarball for publication. Enable private vulnerability
reporting after the visibility change and before npm publication. Interactive npm
2FA must be completed by the maintainer. No publication authorization is inferred
from technical readiness, metadata changes, login, 2FA setup or this report.
