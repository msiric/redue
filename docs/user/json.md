# Alpha JSON interface (schema 1)

Use `status --json` for cached state, `status --sync --json` for caller-aware
applicability, and `explain CHECK --json` for selected synchronized detail.
`detail` remains an alias. Successful reads emit one JSON object, no human prose.

```json
{
  "schema": 1,
  "state": "stale",
  "current": 0, "stale": 1, "failed": 0, "observed_failed": 0, "unverified": 0,
  "checks": [{
    "name": "typecheck",
    "result": "PASS",
    "freshness": "STALE",
    "reason": "src/main.ts changed",
    "changed_inputs": ["src/main.ts"],
    "reuse_eligible": false,
    "invocation": {"runId": "opaque-run-id", "status": "exited", "exitCode": 0, "durationMs": 940}
  }],
  "observation": {"healthy": true}
}
```

Stable-enough-for-alpha fields:

| Field | Contract |
| --- | --- |
| `checks[].name` | Configured check identity. |
| `result` | Historical `PASS`, `FAIL`, or null. A failed invocation is not green even with CURRENT applicability. |
| `freshness` | `CURRENT`, `STALE`, or `UNVERIFIED`, independent of result. |
| `reuse_eligible` | True only for qualified, applicable passing evidence. Never derive permission to reuse from outcome alone. Missing means false. |
| `reason` | Human explanation; not a stable machine enum. Do not parse it to authorize reuse. |
| `changed_inputs` | Known changed relevant paths when available, possibly only the first difference; empty/missing is not proof of no changes. |
| `invocation` | Null without a receipt; otherwise run ID, completion `status`, duration, exit code/signal when known. Status distinguishes exited, interrupted, and start/capture failure. |
| `target_provenance` | Available target evidence. Unknown is not executed or cache-hit. |
| `observation.healthy` | False means no check is reusable. Additional reason/phase diagnostics may appear. |
| `state` | Aggregate lowercase current/stale/failed/unverified (and runtime pending states where applicable). Use per-check fields for decisions. |

Counts cover the whole configuration even when `explain CHECK` filters `checks`.
`failed` counts applicable failures; `observed_failed` preserves historical failures
regardless of applicability. Fields not listed here are diagnostic and may evolve.
Ignore unknown fields; reject unknown schema versions. These responses contain local
paths/check names and must not be uploaded automatically.

`init --json` returns discovery levels (`ready`, `recording`, `unsupported`),
reasons, workspace ownership, `written`, and `proposed_config`. Ready is not PASS.
`init --dry-run --json` writes no config and runs no check.

Read commands normally exit 0 even when the evidence is not current. Errors exit
nonzero; synchronized transport failures may still return conservative JSON.
Usage/configuration errors go to stderr and are not guaranteed JSON. Never treat
a failed read as authority from a previously cached answer.

`run CHECK --json` preserves ordinary command stdin/stdout/stderr and appends a
JSON summary. **Its stdout is not a JSON-only stream.** Query status/details after
completion for machine-readable evidence. Normal check exit codes are preserved;
interruption/process-start failures are nonzero. REDUE retains metadata and receipts,
not arbitrary terminal output. The CLI does not infer tests executed from prose.
