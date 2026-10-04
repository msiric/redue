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

## Dependency advisory disposition

The alpha audit found [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
in braces through micromatch. REDUE used only micromatch's matcher/isMatch, both
exact delegates to picomatch 2.3.1. It now depends directly on that same pinned
matcher through `src/glob.mjs`; the unused braces parser and micromatch are removed
from the runtime dependency tree. No pattern syntax or input coverage was narrowed.

YAML is pinned to the patched 2.8.3 release for
[GHSA-48c2-rrv3-qjmp](https://github.com/advisories/GHSA-48c2-rrv3-qjmp).
Pathological documents must produce a parse error instead of stack exhaustion.
Audit results are retained with each prepared candidate rather than suppressed.
