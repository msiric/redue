# Observation recovery

Live events maintain the content and membership index. Event history can
accelerate a synchronized read, but it is not the correctness authority.

When history fails or times out, or a subscription/root becomes uncertain,
REDUE immediately withholds CURRENT and keeps the historical result. It
reconciles declared inputs from disk with a bounded fresh scan. Events arriving
during that scan are rechecked before observation becomes healthy. Matching
inputs restore CURRENT; changed inputs yield STALE. Reconciliation never creates
an execution receipt. A failed scan remains UNVERIFIED with a reason.

On macOS, `@parcel/watcher` history runs in a short-lived child so a wedged
native call cannot block status or stop. The child has a five-second default
deadline. The deterministic input-plan worker has a 120-second default
deadline. Recovery attempts are bounded to two per gap. After persistent
failure, correcting the filesystem/permission issue and restarting is the
manual recovery path.

The observer does not claim an atomic checkout snapshot against concurrent
writers. Direct checks outside `redue run` do not create receipts.

After the macOS history fast path has been disabled for an observer generation,
every decision checkpoint uses deterministic reconciliation. Reattaching a live
subscription alone is not a delivery barrier: its next notification may still
be pending when a caller asks for a decision. No repeated wedged history queries
are needed, and historical receipts are unchanged.
