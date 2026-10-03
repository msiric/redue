# Windows port status

Native Windows acceptance is pending. The shared evidence engine is unchanged.
The current Windows boundary uses path-aware state identity and a named-pipe
control endpoint, Parcel's Windows watcher, and deterministic reconciliation
for synchronized reads. Cached Windows applicability remains conservative when
event continuity cannot be established.

Windows batch commands use a restricted argv mapping through `cmd.exe`.
Cancellation requests a process-tree termination; unresolved ownership retains
the run lock for review. Portable tests cover these contracts, but NTFS paths,
junctions, native watcher behavior, process trees, and npm/Yarn/pnpm workflows
must be exercised on a real Windows runner before support is claimed.
