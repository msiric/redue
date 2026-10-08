# Wrapped direct-compiler validation

Current status: implementation and deterministic acceptance in progress. This
candidate is separate from the frozen alpha.8 release. No performance improvement,
new model behavior or publication is claimed before the measurements below finish.

## Problem and bounded change

The retained debugger A–H replay cost 20,009.8 ms versus 16,972.7 ms for eight
ordinary compiler runs. Four reuses did not compensate for recording overhead.
D/F correlated traces attributed about 1.55–1.56 s per wrapped run to two full
caller probes and 0.79–0.81 s to start/end checkpoints. See
[the completed project evaluation](real-project-coverage.md).

Only the existing direct-TypeScript recipe on macOS with a healthy history barrier
can use this change. Windows/Linux retain the original full caller probes. There
is no compiler, project, invocation, environment, provider or policy expansion.

The observer may include its existing discovery certificate in a requested start
snapshot. Export requires healthy observation, completed catch-up, no pending
changes/rebuild/external boundary, current input key, plan guard, compiler probe
hash and an unresolved-free direct recipe. The certificate is bound to the check's
plan, cwd, exact built-in probe argv and original full-probe result. Old observers
or unavailable certificates use full caller validation.

The caller independently revalidates that certificate in its **actual environment**
at both execution boundaries. The existing built-in probe verifies current reviewed
compiler bytes, context and retained filesystem queries, including content,
membership, resolution and absence. Bounded decompression and existing 10-second
certificate validation apply; ordinary full-probe and checkpoint deadlines remain
unchanged. Bad identity, malformed/incomplete metadata, changed queries, rejected
runtime or failed validation falls back to the existing full caller probe.

The start snapshot now precedes caller certificate validation, conservatively
including that work in the observed interval. It is not rebased after edits. End
validation still precedes the ending snapshot. Both caller results must match
their observer probe hashes; environment, generation, plan, input-event serial,
revision and fingerprint checks remain unchanged. Change-and-restore events still
disqualify. Exit/cancellation, durable receipt selection/persistence and failed
reload protections are unchanged. Discovery metadata never represents a PASS.

No TTL, shared caller environment, global ignore list, persistent certificate cache
or asynchronous receipt write was added. A test-only boundary gate is enabled only
by the existing explicit test-fault mode and times out without fabricating evidence.

## Fixed acceptance and measurement plan

- Real compiler and full-reference comparison; malformed/missing/cross-check
  certificate, ETW/preload/implementation rejection, membership/absence changes,
  start/launch/post-exit edits, actual execution edits/restoration, cancellation,
  observer loss/root replacement, and existing receipt/incomplete-write tests.
- Exact installed candidate on macOS, Linux and native Windows; no host behavior
  claim follows solely from a package test.
- Three paired A–H cycles, independent observer sessions, order B/C/C/B/B/C.
  Each session alternates eight ordinary compiler runs with the unchanged eight
  decision paths: four potential reuses and four required executions. Same pinned
  vscode-js-debug revision, normal dependencies/caches, actual environment, exact
  socket/state permissions. No competing local tests during timings.
- Initial startup, qualified restart and setup remain separate and visible. Record
  all failures/fallbacks, complete measured sequences, means/medians/maxima and
  per-cycle totals. Do not sum medians or infer CPU/whole-agent savings.
- Six independent model sessions on the final candidate: recorded baseline,
  inherited reuse, relevant edit, reuse of new evidence, explicit fresh execution,
  unavailable observer. Existing in-context fail-closed gate; no retries for score.
  Claude/cross-host behavior remains NOT RUN.

Owner-local plan was written before new measurements. Earlier historical attempts
remain in their original evidence. Initial focused testing had one conservative
UNVERIFIED-versus-STALE recovery failure; a diagnostic single-case run passed.
The missing diagnostic in the first attempt prevents assigning a cause. The test
now asserts/explains its initial CURRENT baseline and retains the final reason.
A separate new test initially wrote profiling output into an unowned state directory;
its ownership refusal was correct. The test now writes outside the state directory.
Neither failure is relabeled as a passing first attempt.
