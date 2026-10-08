# Unavailable-start recording

Current status: implementation under review; final exact-package, economic and
model results pending. This does not change or supersede the complete negative
[A–H result](wrapped-run.md). New runtime is not approved for publication.

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

## Validation plan and evidence

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
