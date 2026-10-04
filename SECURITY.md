# Security

REDUE executes configured checks and read-only probes as your user. Only use
configuration from repositories you trust. It does not sandbox project commands.
Runtime evidence is local; no telemetry or automatic upload is implemented.

Before public release, the maintainer must enable GitHub private vulnerability
reporting for this repository. Once enabled, use the repository's Security tab →
Report a vulnerability. Do not put exploit details, credentials, private project
configuration, or raw local receipts into public issues. Until that channel is
available, keep sensitive reports private and ask the maintainer for a secure channel.

The initial alpha receives fixes on the current alpha line. No long-term support
or schema-compatibility policy is promised yet.

## Reviewed dependency advisory

`braces` 3.0.3 (through micromatch) has no patched release for
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) as of
2026-10-04. REDUE routes every pattern compilation/match through `src/glob.mjs`,
which rejects nesting over 64 and patterns over 32768 characters before the
recursive parser. Unsupported patterns fail closed; no input is silently omitted.
Tests cover the advisory's deeply nested case and ordinary matching equivalence.
The npm advisory remains visible (both braces and its micromatch dependent are
reported); this is an application-level mitigation, not an upstream fix or a
claim that npm audit is clean. Review and remove the mitigation only after an
upstream fix is validated. There is no remote glob-input service.

YAML is pinned to the patched 2.8.3 release; pathological documents must produce
a bounded parse error instead of exhausting the call stack.
