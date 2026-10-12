# Sealed-input TypeScript: current implementation boundary

Current conclusion: **preparation mechanics implemented; sealing and portable
authority NOT established**. Owner decisionD12 authorizes this opt-in direction,
not publication, expanded trust or a rewritten old receipt. The existing origin
containment stays enabled. No current sealed recipe is advertised as executable.

The new proposal `npm-sealed-typescript@1` records a different obligation:
the reviewed local compiler verifies an explicitly prepared stable input tree.
It does not claim live-checkout, npm launcher or lifecycle execution. The proposal
requires reviewed TS5.5.2 and the existing matched Darwin25.6/ARM64/official
Node22.13 profile. A local proposal cannot certify that profile or its enforcement.
Existing commands, user configurations and receipts are unchanged.

## Concrete implementation and review

- Root integrates `dev/portable-sealed-typescript` from containmentb3b4985 in
  the existing ordinary-boundary worktree. No main merge, tag or package write.
- Data leaf037f6da was repaired at4869269 and independently reviewed3d0c03b:
 32 author controls and3 independent controls passed. Failed partial trees remain
  retained; enumeration is bounded; physical case-alias nesting is refused.
  It preserves a real nonsensitive ancestor-swap outside-read counterexample.
  Parent rechecks and O_NOFOLLOW are not atomic read isolation.
- Preview28d690fe verifies the installed compiler implementation and standalone
  script, binds new staged argv/cwd/profile/interpretation, changes no config,
  and returns `sealed:false`, `executable:false`, `reuseEligible:false`.
  Its first test invocation rejected Node's test-runner environment. The corrected
  tests preserve that rejection and use a normal isolated child for positive
  inspection; actual agent environments are not stripped or reinterpreted.
- Child1bf73d6/export50840d has an8MiB EOF-bounded fixed protocol, no arbitrary
  command/compiler/shell execution, finite static failure codes and no error dump.
  Independent profile/child review5c687f5 passed25 deterministic controls.
- Parent0d7ab18 binds source, empty private parent, code and official Node before
  and after its fixed child; uses remaining120s monotonic budget/SIGKILL,
  validates finite protocol and actual staged directory, and always denies reuse.
  It is awaiting independent successor review before real-project preparation.

These helpers never establish complete namespace coverage from copied file pairs.
Empty directories, configuration membership and failed resolution candidates
still need fresh staged compiler queries. Caller and daemon filesystem views may
differ; daemon discovery cannot replace the caller's actual context.

## Actual local preparation observations

The first fixed two-case local sandbox-exec test returned UNKNOWN before an
accepted child result. A same-profile redacted startup diagnostic observed
SIGABRT with zero stdout/stderr. That does not establish its cause. A harmless
`/usr/bin/true` broad-read sanity exited0; it is not a preparation fallback or
enforcement result, and that broad grant is not used by the recipe.

Pinned [SRT24eb39e root-inode regression](https://github.com/anthropics/sandbox-runtime/blob/24eb39e94a6de386e83d126c52317d8e0fa49522/test/sandbox/allow-read.test.ts)
supports reviewing one literal-root read exception for dyld startup. Independent
review approved that finite change; it permits the root directory object, not its
descendants. No Mach/network/home-subpath grant was added. Installed Apple's
`sandbox-exec(1)` documents this deprecated local profile facility; this helper
does not substitute it for either agent product's actual command boundary.

After the literal-root change1aad059, the two fixed local cases passed267.857ms:
the fixed child copied one nonsensitive input to fresh inodes; intended source
reads/stage writes worked; outside-body and symlink-alias reads, source writes and
outside writes were denied. The subsequent affected suite passed62/62 in1.686s.
These are local preparer/kernel mechanics on the owner's development Mac, not
matched-machine, native Claude/Copilot sealing, compiler execution or economics.

Private evidence remains under `.local/portable-evidence/`:

| Record | SHA-256 |
| --- | --- |
| preparer-boundary-first.tap |45f389392ef0a28be338042c94c25cf15466c4f5d5e22329be2d1c37505f93ad|
| preparer-startup-diagnostic.json |b7c77e3d9bf4e3c0c4474191d5e12f71ad887e77191ff4f9f12378c93800e452|
| preparer-boundary-root-inode.tap |0c52986a3fd2b0b198a3ed607141947b2a2257e3dd51bcb125acd9c03fdfaef0|
| sealed-foundation-62.tap |064e2824188f871d09dadfeb490b1d26c6824a79e30fa3ef37e01102f9ae8299|

No credential or raw environment bodies, private transcripts or source contents
are retained in this public record. Previous failures remain evidence.

## Remaining authority gates

Finish independent parent/namespace review, enforce trusted/quiescent preparation
and bounded per-job stage accounting, and verify complete locally derived staged
queries. Actual native write/chmod/unlink/parent replacement/hardlink/MAP_SHARED
denial is required before any seal claim. Preparation must finish/reap before
authentication or agents gain access; no privileged stage-writer RPC is added.
Fresh signing/origin/policy bindings must retain the approved scope and receive
review; old records are not converted. Recipient applicability remains independent.

Hosted Claude's prior six-check diagnostic stays closed PASS only in its actual
scope. Copilot included Actions capacity remains pending. No new agent trial,
cross-machine reuse, staging economics or G1–G4 completion is claimed. Frozen
alpha.11 artifacts remain distinct, unchanged and unpublished.
