# Agent decision policy

Use the CLI; no SDK or bespoke agent integration is required. Add these
instructions to a session or project only with its owner's permission.

1. Query ordinary `redue status --json` first.
2. If a check has `freshness: "CURRENT"`, `result: "PASS"`, and
   `reuse_eligible: true`, reuse it. Do not rerun merely for freshness.
3. If STALE, run `redue run CHECK` when that verification is needed.
4. If the historical `result` is FAIL, report it honestly. The human CLI calls
   this FAILED; applicability is a separate field, never an excuse to call it green.
5. If UNVERIFIED, inspect its reason. Use `status --sync --json` when establishing
   applicability is worthwhile, or rerun the underlying check when cheaper/simpler.
   Use `redue run CHECK` if a new receipt is wanted. Incomplete coverage can remain
   UNVERIFIED even after success.
6. Do not assume synchronization is cheaper than execution. There are no universal
   package-manager or OS thresholds. Inexpensive checks may be cheaper to rerun.

`redue explain CHECK --json` gives synchronized detail, including a known changed
input when available. It has the same cost caveat as synchronized status.

No previous conversation history is needed to read a persisted receipt. Still
consider independent task-specific reasons to run verification: the configured
check is not universal product correctness. Report additional uncaptured checks
separately. Do not infer that an outer invocation's success proves a specific
check ran or that an upstream cache was hit; inspect `target_provenance`.

On a CLI error, unhealthy observation, or unavailable context, do not infer
CURRENT. Do not delete state or reset receipts to make the output green.

REDUE tells you what evidence exists and whether it still applies. It does not
promise that establishing applicability is cheaper than every possible check.
