# Disabled fixed native collector command — independent source review

This review covers the root-authored command proposal only. The reviewer did not
author that module. It is not native execution, effective permission enforcement,
credential isolation, model behavior, compiler correctness or sealing acceptance.

Reviewed bytes:

- `test/acceptance/sealed-typescript-native-base-collector-command.mjs`:
  `a9484f2ea828467510d4af0ad412f9da92fb34d983e81ecd28d7362b61e0bcc4`.
- Its authored test file:
  `fa7107b551d9f99f99c272231e156ce83b31b465ba7c050d8d8caf9d8fe25c55`.

Bounded source/mock GO for this disabled proposal. The private source capability
is checked before paths; the direct policy independently binds the actual private
pair/build/host; helper hash, fixed workspace, host settings and all four copied
source destinations must agree. The final source check follows policy construction.
Only the copied Node and four exact public source leaves are added to read scope.
The original write, network, socket and credential restrictions remain. The command
contains two fixed quoted paths and no caller-selected arguments or environment.

The five authored mock controls passed (43.09 ms). Four independent controls passed
(43.62 ms): null-prototype/symbol rejection with no policy action; extra execution
options refused; final sibling/host/helper binding drift refused; exact read leaves
and unchanged write scope with explicit NOT_TESTED/missing-provisioning blockers.
These are source and injected-function controls, not real private fixture creation.
The independent control initially omitted the inherited nativeEnforcement field;
its fixture was corrected to the actual direct proposal's NOT_TESTED value.

The collector renderer's deferred stdout fault was independently found before this
review. Its successor needs the separate non-author review; this document does not
self-certify renderer code authored by this reviewer. Before any real route, the
parent must validate current protected copies, native identity, effective settings,
authentication and approved capacity, reject preloads before starting Node, and
supervise actual native tool and collector lifecycle. Entry checks run after Node
startup and cannot replace that parent gate. Missing native assertions keep the
whole result UNKNOWN; no public-alpha gate is completed here.
