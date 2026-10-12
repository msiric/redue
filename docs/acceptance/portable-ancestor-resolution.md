# Portable ancestor resolution boundary

Current conclusion: the pinned public debugger project remains rejected with
`PORTABLE_EXTERNAL_INPUT`. Its builtin compiler libraries are already inside the
checkout. The first real raw-provider barrier missed a known transient; a fixed
ROOT/OWNED comparison observed late delivery in both modes. No @3 interval
authority or complete origin is enabled. Ancestor resolution absence and its
continuous observation remain the boundary. This record proposes review scope; it
does not enable a namespace, grant observation authority, or establish a released
false-CURRENT defect.

## Observed project and controlled result

Read-only discovery used `microsoft/vscode-js-debug` revision
`b1c00772e46d4ed6e73442944fb5f66b533431d2`, its unchanged `test:types = tsc --noEmit`
script and configuration, Node 22.13.0, and installed TypeScript 5.5.2. The reviewed
whole-package compiler digest was
`953b4844b5f6edc745be844b6c367c227b59029b73c4182f508f90cc47e21816`.
This was one compiler API input-discovery capture, not compiler verification or a
new REDUE run. It did not write the target checkout, state, or historical receipts.

Discovery returned one configuration, 914 consumed files, and 4,080 filesystem
queries. All 59 consumed builtin library files were under the checkout's installed
`node_modules/typescript/lib` tree. Exactly 424 queries were outside the checkout:

| Query classification | Count |
| --- | ---: |
| Absent directory | 196 |
| Present ancestor `node_modules` container | 2 |
| Absent file | 226 |
| Outside consumed files or file-body reads | 0 |

The two present containers were at ancestor depths four and six. Public reporting
retains classifications, not the owner's ancestor paths or directory contents.
The original observer was not started, and no historical outcome was replaced.

A separate owned disposable compiler A/B/A control retained the same compiler
bytes, Node, argv (`node <local-tsc> --noEmit`), source, and project configuration.
Adding only an ancestor `@typescript/lib-es2022` package supplied a declaration
needed by that controlled source:

| State | Actual exit | TypeScript errors | Duration |
| --- | ---: | ---: | ---: |
| Replacement absent | 2 | 1 | 201.9 ms |
| Replacement present | 0 | 0 | 206.1 ms |
| Replacement removed | 2 | 1 | 202.7 ms |

These are three real compiler executions, not wrapped REDUE applicability tests
or economic measurements. The owner-local result is retained at
`.local/pe-lib-boundary-dWxYp0/result.json`, SHA-256
`ff7b30562c8b0dbfde440fa8f24b839e57f8edd2ef151e5e4e07b424362ac2d1`.
The replacement and result contain only the owned controlled fixture; no private
source or raw environment was copied into this report. No process remains running.

## Source basis and current guards

The [pinned TypeScript program source](https://raw.githubusercontent.com/microsoft/TypeScript/v5.5.2/src/compiler/program.ts)
constructs library replacement lookup from the configuration directory and selects
a resolved replacement before the builtin fallback. The
[pinned resolver source](https://raw.githubusercontent.com/microsoft/TypeScript/v5.5.2/src/compiler/moduleNameResolver.ts)
uses Node10 library resolution and walks ancestor `node_modules` directories.
The actual reviewed 5.5.2 distribution implements this path; its version does not
provide a supported `libReplacement` option to disable it.

At REDUE preparation `30608a15d630483750e4fce13abe04bb1b941b2e`,
`portableDiscovery` in `src/portable-facts.mjs` conservatively rejects every
absolute query path outside the project. The existing input manifest already
covers the consumed local library bytes. `src/typescript-list.mjs` retains the
filesystem queries, and query validation compares their answers.

A before/after absence comparison alone does not establish interval coverage.
An external replacement could influence execution and disappear before final
validation. The A/B/A experiment proves input influence, but does not reproduce
that sequence inside a REDUE wrapped run. Its effect on released direct-contract
applicability therefore remains an unconfirmed hypothesis, not an affected-user
or exploit claim.

## Smallest proposed scope, not approval

Preserve the existing project-relative consumed-file namespace. Add only a
versioned external **query** representation containing ancestor depth,
`node_modules`-relative safe suffix, query kind, exact answer, lookup options, and
complete ancestry termination. Initially require the same chain shape. Do not
accept outside source files, positive replacement candidate files, file-body reads,
symlinks, unknown query kinds, or arbitrary external paths. Recipient discovery
must independently compare every query; imported data cannot select observation
roots, filters, or code to execute.

Derive candidate scopes only from reviewed local compiler discovery. For each
accepted absent candidate, the event filter must cover its exact pathname,
creation/removal/rename of every missing prefix, and replacement of the present
container used to establish absence. Directory notifications at an ancestor of a
candidate must invalidate; filtering only its final filename is insufficient.
Present container identities and the complete candidate set belong in the guard.
New source/configuration membership or changed resolution queries require full
local discovery and a newly bound guard, not reuse of an old filter.

Origin start and end must bind those scopes to healthy observation, generation,
completed catch-up, and event/history continuity. Change-and-restore events must
withhold reuse. Missing coverage, a watcher gap, root replacement, incomplete
catch-up, or an unrecognized event shape must remain conservative. A discovery
certificate cannot supply this interval or create PASS evidence.

Existing declared external-input machinery can contribute indexing and event
accounting, but it is not sufficient unchanged: `permittedRoots` rejects an
ancestor containing the checkout, while external subscriptions and identity checks
require an existing root. Watching creation of an absent `node_modules` can require
its nearest existing parent. On a standard VM that may include `/private/tmp`,
`/private`, or `/`; the exact set must be derived and reviewed, not guessed or
copied from an import.

Any such broader native subscription requires an explicit owner scope decision.
The proposal is limited to approved standard VMs and owned synthetic/public
projects. It does not approve watching the owner's private parent directories,
arbitrary external writes or body reads, or broaden the agent's sandbox/socket
permissions. Unrelated event paths must be discarded before journal/diagnostic
retention, with no unrelated directory traversal. If these guarantees cannot be
established, keep `PORTABLE_EXTERNAL_INPUT` and report the project as unsupported.

A future implementation needs independent critical review and focused candidate
creation/removal/rename, parent replacement, same-parent change-and-restore,
watcher-gap, and cross-checkout query-equivalence controls before any support claim.
No interpretation, source runtime, package bytes, permissions, or trust policy was
changed for this finding.

## Derived parent requirements and worker integration proposal

The non-authoritative leaf now returns private `requiredWatchRoots`, physical
identities, scope indexes and fixed roles. These cover the candidate's nearest
present directory **and the proper parent of every present path component through
the filesystem root**. Present `node_modules` is not treated as an adequate
subscription root by itself. A replaced/restored container can retain the same
final logical answers and original inode; its interval events still disqualify.
No watcher is started by this helper, and its result remains `reuseEligible:false`.

The reviewed installed `@parcel/watcher` 2.5.6
[FSEvents source](https://raw.githubusercontent.com/parcel-bundler/watcher/v2.5.6/src/macos/FSEventsBackend.cc)
creates a FileEvents stream without WatchRoot. It requires an existing directory,
uses metadata queries to classify some coalesced events, and reports dropped-event
uncertainty. Therefore the integration must not infer root-replacement continuity
from a child-root subscription. Native processing temporarily receives paths and
may inspect their metadata before the JavaScript callback; it does not read file
bodies in this path. No broad native subscription was exercised for this review.

Proposed narrow integration, owned by the integration lane:

1. The coordinator derives the plan from current local reviewed compiler queries
   and independently validates a protected CI provisioning record. That record,
   located outside agent-writable checkout/state, must bind the approved public or
   synthetic project, matched host profile and observation scope. The module,
   environment labels, imported values and CLI flags cannot mint this authority.
2. Extend the existing observation worker boundary with this locally minted plan,
   scope digest, private physical guard identities and generation. Any subscription
   minimization must demonstrably cover **all** `requiredWatchRoots`; choosing `/`
   on an approved CI VM is an explicit broad subscription with narrow filtering,
   not a new permission for the owner Mac or agent.
3. In the worker, apply `portableAncestorEventMatch` before IPC, journals or
   diagnostic retention. Valid unrelated events are discarded. Relevant events
   transmit only fixed scope indexes, an increasing interval serial and known
   event classes; unknown paths/backend failures transmit fixed uncertainty codes,
   without raw paths. Existing `history-worker.mjs` sends unfiltered changes today,
   so it cannot be reused unchanged for this broader scope.
4. Live delivery and required history completion must settle a start boundary and
   an end boundary with the same generation/guard, no pending relevant work and no
   uncertainty. Worker readiness, subscription errors, disappearance/replacement,
   dropped history, cancellation, EOF and failed catch-up remain fail-closed.
   Reconciliation cannot retroactively repair a missing origin interval. Persisted
   portable evidence carries the normalized query meaning, not this worker's
   subscriptions, cursors, private paths or authority.

This is an API/coverage proposal rather than a daemon implementation or backend
continuity proof. Candidate creation/removal and container replacement/restoration
controls in the leaf compare actual owned filesystem states and expected filter
results. They are not real FSEvents coverage, authenticated imports, model trials,
or cross-machine acceptance. The root integration and its independent reviewer
must establish the latter boundaries before enabling the CI route.

## Raw provider leaf — not interval acceptance

Independent review found that Parcel's `EventList::getEvents` omits an entry marked
both created and deleted. Consequently, successful filtered Parcel history is not
sufficient proof of continuously absent resolution candidates. The proposed worker
must not use that lossy aggregation as authority.

The new `src/portable-ancestor-fsevents.cc` leaf captures raw FSEvents occurrences,
without Parcel cancellation aggregation, `stat`, directory traversal or file-body
reads. It creates only the fixed `/` stream with FileEvents, WatchRoot and NoDefer
on a dedicated serial dispatch queue. It is not enabled and has never been started
on the owner Mac. Locally compiled production bytes are retained only for review.

Its bounded private initialization is `INIT COUNT\n`, followed by each
`SCOPE_ID BYTE_LENGTH DESCENDANTS\n`, exactly that many ASCII canonical absolute path bytes,
and a newline. Maximums are 8,192 unique IDs, 4,096 path bytes and 8 MiB total.
Multiple IDs may identify the same path. `DESCENDANTS` is exactly `0` or `1`,
derived only from current local query kinds: membership questions
(`readDirectory`, `directories`, `entries`) use `1`; other kinds use `0`.
Unknown kinds do not default to broader scope. Existence-only container child
events are discarded; exact-target and ancestor replacement events remain covered. Only subsequent `barrier ID\n` and
`close ID\n` requests are supported, with strictly increasing safe-integer IDs.
No imported values select the executable or initialize its scopes.

The parent must mint protected CI scope authority before launch. Child output is
fixed JSON: `ready`, `occurrence` with scope IDs and a monotonic safe-integer serial,
`uncertainty` with a fixed code, and `barrier`/`closed` with request, serial and
uncertain state. No event path is emitted. Uncertainty is irreversible; overflow,
EOF, output failure, abandonment or timeout must withdraw authority in the parent.
The child output is capped at 32,768 rows/4 MiB, with a 65,536-byte row limit.
The parent's bounded reader and hard child deadline remain necessary.

Raw candidate, prefix and descendant events are retained before any cancellation
logic. ASCII case-folding conservatively catches APFS aliases. Unicode ambiguity
in a potentially matching component yields uncertainty; a preceding mismatched
ASCII component can establish irrelevance. Invalid paths, unknown flags, drops,
wrap, root changes, mounts/unmounts and unexpected history events remain uncertain,
even if no candidate occurrence is otherwise emitted. The matching JavaScript
leaf has the same conservative case treatment; it grants no interval authority.

Apple's [FlushSync API](https://developer.apple.com/documentation/coreservices/1445629-fseventstreamflushsync)
and the installed SDK header specify delivery of callbacks for events already
occurred when the call was made, after a started stream. The collector calls it
on the main control thread, outside its callback queue. `ready` follows the initial
flush; each barrier follows its flush. Close flushes, stops/invalidates and drains
the queue before its final acknowledgement. A blocked native operation cannot
produce a timely success; the parent must terminate it conservatively, never
reuse an earlier barrier after loss. This does not assert atomicity with later
project edits or prove real provider coverage.

The pure C++/Node controls do not instantiate an FSEvents stream. They establish
framing/filter/serial/latch behavior, including raw create/remove, coalescing and
case aliases. Actual filtered CI subscription, change-and-restore delivery,
start/end integration and independent critical review remain required before any
origin or recipient reuse claim. No agent permissions, trust policy or configured
compiler execution has changed.

The raw scope derivation also covers **every in-root compiler filesystem query
path**, not only external absence candidates. `derivePortableRawQueryScopes`
reuses the strict local query validation, merges kinds for identical private
paths, and assigns deterministic IDs from project-relative or ancestor logical
namespaces. Its separate interpretation and scope digest bind the complete query
meaning, membership options and path/kind set. Directory membership prefixes
(`readDirectory`, `directories`, `entries`) deliberately include unnamed transient
additions below them. Such a file can be consumed and removed without appearing
in the final manifest; Parcel cancellation elision therefore also matters inside
the owned checkout. This conservative prefix coverage can include harmless edits,
and is not a claimed latency improvement. It remains `reuseEligible:false` and
does not alter envelope or receipt interpretation by itself.

Potential `/System/Volumes/Data` aliases are a refusal guard, not a physical
equivalence rule. When the logical tail could overlap a scope or has unresolved
Unicode ambiguity, the filter reports uncertainty. A clearly disjoint tail is
discarded. The prefix is never stripped to grant relevance or applicability;
actual metadata-bound aliases and CI delivery remain unestablished.

Known Data-prefix recognition also folds ASCII case conservatively. Short
`/System` or `/System/Volumes` notices and Unicode ambiguity in a potentially
matching prefix produce uncertainty, not applicability. A clearly differing ASCII
prefix such as `/System/Library` remains disjoint. This closes the refusal guard;
it does not establish a physical alias interpretation or real provider delivery.

## CI-only provider implementation checkpoint

Owner D10 approves filtered observation only on the disposable standard runner
VMs. The integration branch `dev/portable-ordinary-boundary` now contains a
fixed raw FSEvents collector and a private parent wrapper. This supplements the
existing engine; it is not yet connected to portable origin completeness or
recipient applicability. The ordinary project therefore remains unsupported.

The final build-only collector is 80,984 bytes, SHA-256
`39cc3829f4fe640ad35baf87794e2e98d4812ee8afd3193f94dad5a11aa66389`,
from C++ source SHA-256
`a322b31d6c686b009fea2067b2c97f57068b50c99affb156b87df217175075a2`.
The build records Apple clang21, C++17/O2/ARM64/blocks/macOS13 minimum. It has not
been launched on the owner's Mac. Earlier leaf/binary identities remain history.

The wrapper requires the exact portable runtime profile and unprivileged
UID/EUID/GID/EGID, a freshly minted protected CI capability outside checkout/state,
current local resource identities and the exact non-setid helper bytes. Only
locally discovered query paths select native filters. Membership queries include
descendants; existence questions retain exact paths and ancestor replacement.
Potential Data-volume aliases withdraw authority rather than inventing physical
mapping. Unknown flags, dropped events, malformed protocol, partial output,
capability mutation, missing acknowledgments or unknown child reaping remain
conservative. Only scope IDs and serials leave the callback filter.

77 deterministic/pure/process-mock controls pass. They start no real collector,
model or native-agent operation. The initial helper import was blocked by a
missing local `yaml` dependency; ordinary locked installation repaired that
fixture before the read-only prerequisite check. One author C++ compile error was
corrected before final source/build freezing. Neither is native enforcement or
product applicability evidence.

The prepared task-only `portable-preflight.yml` has contents:read, pinned checkout
and Node setup, one standard macos-26 job, no secrets, model, signing, upload or
trust changes. Its fixed provider trial tests start, one transient source
membership change-and-restore, one missing ancestor package creation/removal,
and provisioning-byte mutation refusal. It does not claim an existing-container
swap or agent enforcement. Failed assertions remain FAIL; unavailable capture
remains UNKNOWN. Cleanup requires actual owned-child close, independently of a
clean observation interval. Unknown reaping leaves the owned files intact for
that VM. Independent review precedes dispatch; no CI result is implied here.
## First actual provider trial and diagnostic-only build

Approved CI run `38287392906`, source
`eb0d68ed18a6a323c4ba8436e337be799c942ede`, failed
`MEMBERSHIP_INTERVAL_NOT_OBSERVED`: start and immediate post-create/delete barrier
both reported healthy serial zero. It completed in 118.689 ms; close exited zero,
was reaped and clean. No compiler or model ran. The ancestor/provisioning tests
were not reached. A clean close does not establish that the mutation was observed.

Cause is unresolved. Apple's SDK describes flushing events buffered by the
service and callback delivery; current evidence cannot distinguish startup/delivery
lag, volume/root coverage, or another path representation. No delay, marker or
later successful sample establishes interval authority by itself.

A separate diagnostic-only build adds `REDUE_ANCESTOR_DIAGNOSTIC`. It accepts
exactly `root OWNED_ROOT` or `owned OWNED_ROOT`, where the parent-provisioned root
must be canonical ASCII and not `/`. The former watches `/`; the latter watches
that one owned root. It shares the callback, filter, bounded initialization,
barrier/close protocol and uncertainty handling. It does not add subscriptions to
the production collector, unrelated callback counters, event paths or body reads.
The normal binary retains argc-one/root-only semantics. The build helper accepts
only the explicit boolean diagnostic option, not arbitrary compiler flags.

Both variants were built locally but never started. A fixed, independently
reviewed CI-only supervisor may compare those two cases on owned synthetic paths,
reporting only matched scope IDs and static outcomes. No production applicability
or continuity change is authorized by this diagnostic selector. Preserve the
first failure, fixed sample boundaries and conservative result until the actual
provider behavior is established.

The fixed follow-up supervisor retains both per-action baselines and each
immediate/500ms/2000ms observation for ROOT and OWNED streams. The held marker
remains intact throughout transient observations, avoiding a marker-deletion
confound. Diagnostic waits establish no observation authority. Expiry prevents
another launch or new fixture mutations; only owned close/reap and cleanup remain.
A missing actual close retains owned files and UNKNOWN. Five independent harmless
VM harness controls and the native/query/build controls passed before dispatch;
these are not actual stream observations. The unchanged production binary still
has the known failed continuity result.


## Actual fixed delivery comparison — no interval authority

[Run38289084959](https://github.com/msiric/redue/actions/runs/38289084959),
sourceebccf99e46cf79f72e800ed9dc439b90c6a95989, collected all fixed observations
with no model or compiler. Both ROOT and OWNED streams report serial0 immediately
after held-marker creation, serial1 by500ms, then unchanged at2s. Both report
serial1 immediately after transient creation/removal and serial2 by500ms, then
unchanged at2s. The marker remained present through transient observations.
Both child processes exited0/no signal, reaped/protocol-clean; owned files cleanup
completed. Complete diagnostic9502.386ms is not verification or economic timing.

The VM reports Darwin25.6.0/ARM64/Node22.13.0, filesystem type26, and the fixture
device equals the filesystem-root device. The diagnostic source hash isdc93cf87;
actual CI-built executable15a4eda787ae08c5fde28607bd0acef183e2c6f87b8be03f840469c162d881b7
(81,528 bytes) differs from the local diagnostic build7e819ccf. Both retain
separate identities; the production39cc binary is unchanged. Private structured
record `.local/portable-evidence/ancestor-delivery-38289084959.json`, SHA256
871ec945f07ba817debc1c1aa95d36369edb7c8374e195021858f8f3dc738d16.
Independent actual review87af5fd preserves the original failed immediate barrier.

This sample establishes later matching delivery in both stream classes, not a
root-only routing failure or a proven deeper kernel/service/queue cause. Longer
waits are not currency. The next bounded source-reviewed diagnostic compares
no-drain versus explicit serial callback-queue drain after FlushSync, exclusively
in a diagnostic compile. It can close already queued callback work; it cannot
prove kernel/service ingress. No qualifying engine integration follows from a
quiet sample or successful cleanup.
The next fixed diagnostic comparison adds a separate
`REDUE_ANCESTOR_DIAGNOSTIC_DRAIN` build, allowed only together with the diagnostic
selector. On the control thread it calls `dispatch_sync` on the serial callback
queue immediately after each `FSEventStreamFlushSync`, before ready or barrier
reporting. No callback or collector/output lock is held at that fence. This waits
for already queued callbacks; it cannot establish that kernel or service ingress
has completed. A delay or clean diagnostic result still cannot authorize an
observation interval.

The build helper permits only fixed literal boolean options and fixed CLI flags;
unknown options and getters are refused. Production SHA-256 remains
`39cc3829f4fe640ad35baf87794e2e98d4812ee8afd3193f94dad5a11aa66389`
(80,984 bytes), and the diagnostic build without the drain remains
`7e819ccf8682d50afa7e52dc0c56b125dd068d0d9ec197377e75bb0373310eed`
(81,528 bytes). The drain build is
`acbc5fac2c4c817b75a5ce639ecb76bfec89f29cb4634cf9e323742f23d348de`
(81,768 bytes), from source SHA-256
`a7e766b3df8431441f9333df75deb15f36270ac3b4cc142fc57c2ddcd9b1528a`.
All three were built with Apple clang 21.0.0, and none was started locally.
