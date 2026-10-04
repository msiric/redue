# Shell usage

Run `redue start` once for the project/configuration you want to observe. A shell,
terminal multiplexer, and agent using that same config share its backend. Closing
the terminal does not stop the observer. `redue stop` does.

`redue status --short` is the intended small indicator:

```text
REDUE UNVERIFIED
```

It reads the cached snapshot, checks its expiry and observer liveness, and never
synchronizes, traverses installed packages, or runs probes/checks. Like ordinary
status, it can remain conservative when caller context or installed hardlinks
need a synchronized read. Do not turn that uncertainty into a green badge.

For an existing async/bounded prompt framework, use `redue status --short` from
the project root as the segment command and display unavailable on errors or
timeout. Node startup and configuration parsing still have a cost. REDUE does
not install a shell hook, edit global shell files, or provide its own prompt
scheduler. Running it manually is supported in PowerShell and POSIX shells.

Never put `status --sync` or `explain` in a prompt. Use those deliberately when
you need a decision and synchronization is worth its cost.
