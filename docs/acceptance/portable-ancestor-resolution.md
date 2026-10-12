# Portable ancestor resolution boundary

Current conclusion: the pinned public debugger project is rejected with
`PORTABLE_EXTERNAL_INPUT`. Its builtin compiler libraries are already inside the
checkout. Ancestor resolution absence, and the observation interval supporting
that absence, are the remaining boundary. This record proposes review scope; it
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
