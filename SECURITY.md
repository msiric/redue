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
