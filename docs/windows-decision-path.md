# Windows decision reliability and cost

Baseline: clean private `main` at `b671a64`. No evidence-state meanings change.
This pass targets unchanged synchronized decisions, not a new provider or UI.

## Measured baseline

Native Server 2025 / NTFS public run `37230922931` at `83e857b` separated
query contexts for the first time. Earlier numbers mixed these cases. Each
unchanged Windows query still did a complete provider discovery, cold index,
and TypeScript probe, regardless of healthy observation.

| Manager | Warm sync p50 / p90 / max (n=8), ms | Check p50 / max (n=2), ms | Cold-index p50, ms |
| --- | ---: | ---: | ---: |
| npm | 6637 / 9533 / 9533 | 4199 / 4263 | 3463 |
| Yarn | 5009 / 5103 / 5103 | 2479 / 2526 | 2307 |
| pnpm isolated | 8052 / 10998 / 10998 | 3849 / 3915 | 913 |

First queries after startup were 7001 / 5113 / 8597 ms respectively. First
queries after restart were 6487 / 4985 / 9072 ms. These are single samples per
manager, not tail estimates. pnpm's plan worker p50 was 4405 ms and its probe
p50 was 3309 ms: provider/compiler work dominated its 913 ms content scan.
For npm/Yarn, content traversal/read cost was itself substantial.

## Bounded corrections

- Reuse the already-resolved in-memory input plan only after validating its
  configuration, resolution links/candidates, workspace manifest membership,
  compiler-discovery questions, and input-content/membership identity. A source
  edit can change imports, so it still causes compiler rediscovery. Restart,
  root identity change, uncertainty, and incompatible state use full discovery.
- A supported TypeScript probe can preserve its result only if its compiler
  filesystem answers still match. These include file reads, failed existence
  queries, directory membership, and realpath resolution. The public compiler
  API's file list must first match the existing CLI listing independently.
  Unsupported compilers or excessive certificate size use the complete probe.
- Toolchain/execution context remains freshly validated. npm's distribution,
  configuration and launcher selection and Yarn's pinned launcher/distribution
  are not trusted merely because checkout inputs match. Caller context is still
  separately supplied and compared by the existing receipt contract.
- Windows continues to read content and membership through the existing index;
  directory events do not prove hardlink-alias contents unchanged. Eight bounded
  independent reads replace serialized content I/O. Before/after file identity
  checks remain. No lockfile/timestamp substitutes for content hashing.
- The compiler certificate is internal optimization metadata, not a receipt or
  a new evidence type. It contains answers/digests and local paths, not source
  text or environment values. It is not exported. No TTL grants applicability.

Opt-in timing now gives reasons for provider rebuild/reuse and probe execution,
and separately records index validation versus provider discovery. Metrics are
local/test-only; normal commands produce no telemetry.

## Checkout-root control loss

The earlier `connect ENOENT` did not establish whether the daemon died. Baseline
run `37230922248` passed the complete native suite and 40 consecutive exact
rename/copy-root replacements. That does not establish the historical cause.
The stress harness now owns a direct daemon process handle and records exit
code/signal on failure. Lifecycle events record control-listen, abnormal JS
exit, and normal exit state; state/control/cwd remain outside the replaced root.

A Windows decision connection failure has one bounded recovery path. A live
owner gets one reconnect, with the normal deterministic input validation. A
proven-dead owned observer may restart once only if no run lock exists. Pending
or failed recovery remains UNVERIFIED with historical outcomes; no receipt is
created. A recovery marker prevents repeated failed restart attempts. An
intentional stop (no observer lock), ambiguous ownership, surviving check work,
or repeated failure requires explicit inspection/start. Other failures are not
retried until green.

## Remaining platform gate

No approved Windows 11 desktop capable of running Node is available. The prior
managed-desktop policy restriction remains an environmental limitation. The
Windows 11 install/init/run/status/sync/restart/inherited-receipt/remove-state
smoke test remains open; no policy bypass was attempted.
