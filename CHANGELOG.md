# Changelog

## Unreleased

- Large installations reach ready quickly. Installed files are observed by
  identity (inode, size, mode, link count, times), not by hashing their contents;
  the compiler's own reads stay content-checked by the probe. On macOS:
  Recordly (75k files in `node_modules`) ready in 7 s instead of failing after
  120 s; worldmonitor (143k) in 30 s instead of not ready after 15 min.
  Behavior change: reinstalling identical packages, restoring an installed
  file's bytes or copying the installation now makes the check STALE once.
- The direct TypeScript recipe supports TypeScript 6.0.2 and 6.0.3.
- Claude Code: the typecheck hook also matches a typecheck that starts a `;` or
  `&&` chain. When it skips one, the message names the rest of the chain. The
  skill lists the exact commands the hook matches for the selected config.
- Shorter agent instructions: the CLAUDE.md block is 327 bytes instead of 739,
  the skill 1.7 KB instead of 5 KB. The reuse rules are unchanged.
- Releases are published to the `latest` npm tag as well as `alpha`, so
  `npm install -g @redue/cli` installs the newest release.

## 0.1.0-alpha.11 — 2026-10-18

Bench numbers below are from one 800-file project on macOS arm64, Node 22.13.0.
Released alpha.10 and this build ran back to back on the same machine.

- Faster status decisions for the direct TypeScript recipe on macOS and Linux.
  The observer checks the compiler's recorded filesystem questions in-process
  instead of starting a probe that rebuilds the whole program. A full probe runs
  only when that check fails, the plan or toolchain changes, or observation was
  interrupted. While idle it no longer starts any probe process.
  - warm `status --sync`: 741 → 194 ms (+683 → +154 ms over cached `status`)
  - `status --sync` after an unrelated edit: 619 → 219 ms
  - `status --sync` after a relevant edit: 1472 → 321 ms. It answers STALE without
    a full probe when the edited inputs already differ from the receipt.
  - probe processes started in 20 s idle: 4 → 0
- Cheaper `redue run` on macOS and Linux. The compiler records its own inputs
  while it runs, so REDUE no longer probes before and after the compile. After
  a relevant edit, the run builds the new certificate from that recording instead
  of running a full probe. Output and exit code are those of plain `tsc`.
  - repeat run: 4143 → 2752 ms, overhead over plain `tsc` 72% → 16%
  - run right after a relevant edit: 3990 → 2802 ms, overhead 65% → 18%
- The direct TypeScript recipe accepts inert Node settings. Before, any non-empty
  `NODE_*` setting other than `NODE_ENV` kept a check from becoming CURRENT.
  Now accepted: `NODE_EXTRA_CA_CERTS`, `NODE_PATH`, and `NODE_OPTIONS` made only of
  `--max-old-space-size`, `--max-semi-space-size`, `--use-openssl-ca`,
  `--use-bundled-ca`, `--use-system-ca` and `--dns-result-order`. A run under one
  value is not reused under another. See [Node settings](docs/user/direct-typescript.md#node-settings).
- `redue agent setup claude --apply` adds a Claude Code hook to
  `.claude/settings.local.json`. When the agent reruns a configured typecheck
  that is CURRENT and PASS, the hook blocks it and names the passing run. When
  the check is not CURRENT, it rewrites the command to `redue run CHECK`, so the
  result is recorded and the next identical command can be skipped. Prefix a
  command with `REDUE_FORCE=1` to always run it. On the bench: a skip decision
  takes about 155 ms; a forced command adds 39 ms. Tested live with Claude Code
  2.1.302 (`claude -p`). See [the hook](docs/user/agents.md#claude-code-typecheck-hook).
- Unstable-run and observation-gap reasons now name the failed check or operation.
- macOS counts each input event once, which removes an intermittent UNVERIFIED
  after an edit.

Known limits:

- Two bench targets are still missed: warm sync adds 154 ms over cached status
  (target < 100 ms), and `redue run` adds 16–18% over plain `tsc` (target < 10%).
- An edit that changes imports, configuration or lib files still costs one full
  probe, at the end of the next run.
- Windows keeps the earlier probe-based path, except the STALE shortcut. Yarn
  and pnpm recipes still probe on each decision. The bench was not run on Linux.
- The Claude hook covers the Bash tool only, from the project root. It allows the
  rewritten command without a permission prompt. It judges its own environment,
  not variables the Bash tool adds from your shell profile.
- To upgrade, stop observers, install into the same prefix, and keep config, state
  and receipts. Rerun `redue agent setup claude --apply` to add the hook.

## 0.1.0-alpha.10 — 2026-10-10

- Combine guarded caller-discovery reuse and cheaper non-reusable recording on
  the existing macOS direct-TypeScript path. Healthy runs still validate both
  boundaries in the caller context, falling back to full probes when necessary.
- Once a healthy start observation is missing, omit qualification-only work that
  cannot repair it. Execute the configured compiler and durably record its true
  outcome; later observer recovery cannot make that invocation reusable.
- Refuse missing, malformed or mismatched state ownership before execution.
  Preserve cancellation, immutable history and newest-receipt selection.
- Three fixed A–H cycles cost 15.16/15.35/15.82 seconds versus matched ordinary
  compiler totals of 16.69/16.66/16.56 seconds. These modest CLI savings do not
  establish real-world reuse frequency, CPU/memory or whole-agent benefit.
- Provide a [fixed-build opt-in pilot guide](docs/user/pilot.md). External usage
  has not started. No compiler/platform expansion or policy redesign is included;
  Claude behavior and cross-host handoff remain untested.
- Stop observers before upgrading in the same prefix, preserve config/state and
  receipts, preview/apply project-local policy updates, then restart and reassess.
  Never silently migrate a check. Alpha.9 remains an unshipped candidate.

## 0.1.0-alpha.9 — unshipped candidate (2026-10-09)

- Reduce repeated caller discovery on the guarded macOS direct-TypeScript path.
  Both execution boundaries still validate in the actual caller environment,
  with full-probe fallback when a discovery certificate cannot be used.
- Preserve required content/membership, compiler/context, observation and durable
  receipt-selection guards. The configured compiler still executes on every run.
- Recording overhead fell in the measured debugger-project sample, but every
  complete A–H candidate cycle remained slower than eight ordinary compiler runs.
  No net workflow saving, broader support or CPU/memory improvement is claimed.
- Stop observers before upgrading in the existing prefix, retain config/state
  and receipts, then restart. No automatic migration is performed.

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
