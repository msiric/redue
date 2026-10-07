# Synchronized-query tail investigation

Current conclusion: **UNRESOLVED**. The prior 10,797 ms eligible response lacked
request-correlated phase capture. No cause or fix is established.

## Fixed experiment declared before execution

Use the prior public google-workspace-mcp checkout and installed dependencies,
Node 22.13.0, existing approved Codex workspace/state/exact-socket route, unchanged
proxy enforcement. The candidate adds opt-in local diagnostics only; deadlines,
observation barriers, certificate guards and receipt selection are unchanged.

Exactly 60 measured synchronized queries across three independent observers,
20 per session: first after restart; 10 warm unchanged; 4 after unrelated owned
document edits; 2 relevant edits (expect STALE, then record baseline again); and
3 after idle intervals around the five-second periodic work. Keep every response,
timeout, fallback and assertion failure. First/relevant/idle results are separate
from warm unchanged results. No retries to replace poor samples. Rebaseline runs
and cleanup are recorded but excluded from the 60-query latency distribution.

Profile records contain wall and monotonic time, process/request/generation/work
identity and bounded counts/reasons. Client submission and server receipt bracket
transport/event-loop delay; this does not claim to measure kernel arrival time.
History child snapshot/replay, probe launch/completion, existing plan/index phases,
periodic work, response construction/delivery and client completion are correlated.
No source, environment values or request payloads are recorded.

Diagnostics are opt-in (`REDUE_DECISION_PROFILE=1` with an owned
`REDUE_DECISION_PROFILE_FILE`). They cannot authorize applicability or change
fallback behavior. Local raw captures are not published. This bounded sample
cannot prove tail reliability even if the old outlier does not recur.

Prior evidence: [guidance comparison](agent-activation.md).
