# Changelog

## 0.1.0-alpha.8 — 2026-10-08

- Consume compiler-certificate input asynchronously while preserving the input-size
  limit, parent deadline, complete-input validation and conservative fallbacks.
- Support the exact reviewed TypeScript 5.5.2 distribution in the explicitly selected
  single-package npm direct-compiler recipe. Enforce implementation membership and
  reject ETW module overrides before compiler API loading.
- Real independent Codex/macOS sessions reused compiler evidence on the pinned
  vscode-js-debug project. Cross-platform CLI/package acceptance is separate;
  Claude behavior and cross-host handoff remain untested.
- The measured eight-case workflow avoided four compiler executions but cost
  20.01 seconds versus 16.97 seconds for eight ordinary compiler runs. No net
  workflow or whole-agent speedup is claimed. This verifies compiler inputs only,
  not npm lifecycle behavior or application correctness.
- Stop observers before upgrading, retain the same configuration/state, then
  restart. Do not delete receipts or automatically convert existing checks.

## 0.1.0-alpha.7 — 2026-10-07

- Guide explicitly configured direct-compiler reuse through one caller-aware
  synchronized query; skip reuse queries when fresh execution is already required.
- Update intact project-local agent instructions safely; installation alone does
  not update them. See the [existing-user procedure](docs/user/agents.md#update-an-existing-connection).
- In the finite Codex/macOS comparison, revised guidance reached eligible evidence
  and reused it in 4/4 opportunities versus 1/4; verification tool calls fell
  from 28 to 14. Evidence semantics are unchanged. No universal compliance,
  tail-latency or causal agent-task speedup is claimed. Claude behavior and
  cross-host handoff remain untested.

## 0.1.0-alpha.6 — 2026-10-07

- Reuse guarded compiler discovery for warm direct-TypeScript decisions on macOS
  with healthy historical observation. Membership, absence, compiler bytes,
  caller context and receipt selection remain validated independently.
- Keep full discovery/reconciliation fallbacks and existing platform boundaries.
- On one measured project, complete warm decision median fell from roughly
  791 to 474 ms. This is not a universal speedup, agent-task acceleration,
  memory improvement, or a faster relevant-edit/rebuild claim.
- Stop observers before upgrading and restart with the same config/state.
  Preserve receipts; no configuration migration is performed.

## 0.1.0-alpha.5 — 2026-10-07

- Add opt-in project-local agent activation and direct TypeScript evidence, with
  fresh-session reuse demonstrated in the tested Codex/macOS configuration.
- Preserve ordinary npm execution as a separate, recording-only obligation.
  Direct compilation requires explicit selection and a fresh baseline receipt.
- Initial direct recipe supports reviewed TypeScript 5.6.3/5.9.3 in single-package
  npm projects, with documented Node/environment restrictions.
- Claude integration mechanics are tested; Claude behavior and cross-host reuse
  remain untested. No universal compliance or inexpensive-check speedup is claimed.

## 0.1.0-alpha.4 — 2026-10-07

- Withdraw automatic npm-launcher applicability because update notifications consume
  unobserved remote/cache/time state. Npm scripts still run and record outcomes.
- Preserve historical PASS/FAIL and require stop/start when upgrading an observer.
  Do not delete receipts. See the [maintainer notice](docs/user/npm-launcher-notice.md).
- Supported Yarn/pnpm and explicit reviewed contracts are unchanged. No agent
  activation or npm direct-compiler recipe is included in this correction.

## 0.1.0-alpha.3 — 2026-10-06

Install: `npm install --global @redue/cli@alpha`.

- Fix selected execution outcomes remaining hidden behind an older observer/cache
  after a missed reload notification. A newer failure must not leave an older
  passing receipt eligible for reuse.
- Withhold applicability during incomplete receipt persistence, unreadable or
  changing selection, and client connections to an older observer.
- Preserve immutable run history. Upgrade requires an observer stop/start;
  receipts need not be deleted. See the [maintainer notice](docs/user/receipt-selection-notice.md).

## 0.1.0-alpha.2 — 2026-10-06

Install: `npm install --global @redue/cli@alpha`.

- npm distribution moved to the product-owned `@redue/cli` package.
- The executable remains `redue`; verification semantics and runtime code are unchanged.
- Alpha.1 (`@msiric/redue`) remains available but is superseded by the canonical package.

## 0.1.0-alpha.1 — 2026-10-06

Install: `npm install --global @msiric/redue@alpha`. The command remains `redue`.

- Persistent execution evidence with independent CURRENT, STALE, and UNVERIFIED applicability.
- Node/TypeScript onboarding for npm, supported Yarn node-modules workspaces, and pnpm 12 isolated/hoisted layouts.
- macOS, Linux, and Windows observation with conservative deterministic recovery.
- Human status/explain output, JSON integration contract, and recording-only checks.
- Standard npm tarball installation and scoped state cleanup.

Known limitations include incomplete test/lint/build contracts, uncaptured direct
commands, and synchronized decisions that can cost more than cheap checks. See README.
