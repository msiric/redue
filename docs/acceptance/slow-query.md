# Synchronized-query tail investigation

Current conclusion: **reproduced and isolated; correction under review**. The fixed
60-query sample included a 10,941 ms warm response. Its certificate child blocked
in synchronous stdin reading until the existing 10-second deadline, then full
probe fallback returned eligible evidence. History catch-up was 50 ms, not the
10-second phase. A separate 60-child reproduction hit the same fd-0 read stall
once. Bounded asynchronous input consumption completed all 60 follow-up children
(160–185 ms); the lower-level Node/libuv cause is not established.

The correction changes only certificate transport consumption. No timeout,
continuity barrier, receipt selection, compiler validation or applicability rule
is relaxed. The fixed end-to-end follow-up uses the same declared 60-query design;
results will be retained whether good or bad.

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


## Baseline observations (diagnostic commit 8b9fddb)

| Category | n | Mean ms | Median ms | p90 ms | Max ms |
|---|---:|---:|---:|---:|---:|
| All | 60 | 614.7 | 389.1 | 766.4 | 10941.1 |
| Warm unchanged | 30 | 748.8 | 386.5 | 420.6 | 10941.1 |
| Unrelated edit | 12 | 383.8 | 379.8 | 398.8 | 419.2 |
| Relevant edit | 6 | 805.2 | 781.7 | 943.5 | 943.5 |
| First after restart | 3 | 385.5 | 386.1 | 392.4 | 392.4 |
| Idle/periodic transition | 9 | 425.3 | 398.4 | 544.6 | 544.6 |

Total measured query time 36,882.9 ms. All expected outcomes matched: 54 eligible
unchanged/unrelated/restart/idle responses, six STALE relevant-edit responses;
zero failed responses. The slow response was not an unsafe stale snapshot: it
completed full discovery and the final history barrier. Warm mean includes the
outlier. One preparation failure (prior fixture dependencies had been cleaned)
launched no sample/model; normal npm ci restored them before the fixed matrix.

Slow request timeline, relative to client invocation: submit/server receipt at
105 ms; history completed 155 ms; certificate launch 156 ms; compiler bytes
validated 208 ms; child killed at 10,169 ms (ETIMEDOUT); full probe completed
10,881 ms; final history completed 10,934 ms; client completed 10,941 ms. No plan
rebuild or observation gap was involved. A child-only reproduction with 1,972
retained queries and ~364 KB UTF-8 input stopped between input-start/input-end,
before query validation. This separates transport blocking from expensive hashing.

Tests include chunked EOF delivery, malformed/oversized certificate input, changed
inputs before EOF, relevant changes during delayed response, newer FAIL during
delayed response, incomplete selector persistence and history-loss fallback.
