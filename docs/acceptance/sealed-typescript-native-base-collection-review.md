# Fixed native stream collection — independent source/mock review

Bounded source/mock GO for root-authored successor:

- Module SHA-256 `b385b3c1c07b6e0c01d0cf7d7ebe9fa21a0fa8e40ccc439be48dcee79fb1e52a`.
- Authored test SHA-256 `233c0bd4c04dc0c5ddcf3ca0cbfd49f081c53f66d3704656a69f3b8c8382dbe9`.

Original `51cc1660...` failed two independent controls (51.76 ms): cancellation
inside the trusted factory did not stop the returned owned PID; and a completed
close at exactly115000 ms could publish collected rows before its timer callback.
The successor rechecks cancellation/error after listeners are installed, stops a
late-spawned child after refusal, and expires at elapsed >=115000 ms. The original
NO-GO and its mocks remain preserved; no actual native cause is inferred.

Eleven authored controls passed (69.66 ms). Five independent controls passed
(53.46 ms), including both retained countercases, stream overflow/contradictory
close, validated FAIL through cancellation and signal close, and invalid initial
clock making zero factory attempts. No actual native/model/helper/process dispatch
was performed; fake EventEmitters and lexical mock factories are engineering tests.

The collector bounds stdout to2MiB, lines/stderr to64KiB, validates restricted
I-JSON and the reviewed trace, and admits a complete collection only with actual
spawn/PID, balanced close0, correct initialized context and matching tool/final
result. Failed assertions survive later malformed stream, cancellation or close
uncertainty. Raw stdout/stderr are not returned. Deadline115s and cleanup120s are
cooperative parent timers; synchronous trusted factory work cannot be preempted by
JavaScript timers. ownedNativeReaped reports that one observed native process, not
all descendants or helper handles. Failed cleanup never fabricates exit/reaping.

The factory is a trusted enclosing-dispatcher seam, not imported-code or arbitrary
execution authority. The parent still owns current private copy/build/source and
native byte bindings, effective settings, in-place account/namespace approval,
included capacity, pre-startup runtime restrictions and real process supervision.
Collected rows remain partial diagnostic data; native enforcement/seal/reuse/public
release gates are not established here. Missing stage assertions remain missing.
