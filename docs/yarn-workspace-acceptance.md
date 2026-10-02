# Yarn workspace acceptance

Public repository: `streamich/memfs` at
`adae41a54ff34c89db4e0d0708ec7c166e8998c6`. Its root declares Yarn
`4.12.0`, `nodeLinker: node-modules`, and ten workspaces. The immutable lockfile
had SHA-256 `cac537f28909f005848f59b6b3084b062f181c1c3ce93b833c89a0eff00fb486`.
The disposable checkout used `yarn install --immutable --mode=skip-build` with
a process-local public registry mirror because direct registry access failed;
neither the lockfile nor Yarn configuration was changed. The dependency
workspace's existing `build` script was run once to make its declarations
available to the ordinary selected typecheck. This is project setup, not a
vstate check or a synthetic project script.

`vstate init --dry-run` discovered 33 existing root/workspace checks and ten
candidate workspace typechecks. The focused command
`vstate init --workspace @jsonjoy.com/fs-node-utils --check typecheck`
generated one 26-line project-relative check with no hand-written input plan or
review assertion. The selected command remained the repository's own `yarn
workspace @jsonjoy.com/fs-node-utils run typecheck` (`tsc -p .`). No project
source or package-manager configuration was modified.
The unscoped preview is useful for discovery, but starting all 33 checks took
longer than the old five-second startup wait; `start` now reports an owned,
still-initializing observer rather than a false launch failure. A focused init
kept this acceptance run small.

The derived contract includes the selected workspace's `src/**` membership,
its manifest and effective TypeScript configuration, root package/lock/Yarn
configuration, built `lib/**` declarations of its declared internal workspace
dependency, physical root and selected/dependency-local `node_modules` files
and membership, and caller Node/Yarn/environment identity. The read-only probe
checks the effective TypeScript file list and refuses files outside those
boundaries. Workspace directory links are resolution inputs, while their
contents are observed at the physical workspace paths. The selected check
emits to root `lib`; those emitted files are not part of its input contract.

Observed synchronized states with one real PASS receipt:

| Controlled change | Result | Explanation |
| --- | --- | --- |
| Root README edit | CURRENT/PASS | No declared input changed |
| Unrelated sibling source edit | CURRENT/PASS | Sibling is outside selected dependency closure |
| Internal dependency source edit without rebuilding | CURRENT/PASS | Selected check consumes its built declarations |
| Selected check's own emitted output edit | CURRENT/PASS | Output is not an input |
| Selected workspace source edit | STALE/PASS | `packages/fs-node-utils/src/index.ts changed` |
| Consumed dependency declaration edit | STALE/PASS | `packages/fs-node-builtins/lib/path.d.ts changed` |
| Shared root TypeScript config edit | STALE/PASS | `tsconfig.json changed` |
| Installed package code edit, lockfile unchanged | STALE/PASS | Installed file path changed |

Rerunning the selected check after each relevant source, declaration, and
configuration change returned CURRENT/PASS. Restoring a changed file after a
new receipt made that receipt STALE until another run; restoring the original
content before a new run let the original receipt apply again. The last receipt
(`f6ea0c21-d86b-4a06-8a62-bd72704ebcba`) was CURRENT/PASS before stop,
UNVERIFIED/PASS while stopped, and CURRENT/PASS with the same run ID after
restart/reconciliation. One earlier run completed PASS but stayed UNVERIFIED
because the first draft of the probe omitted a workspace-local `node_modules`
location; the implementation now observes that location and the run was
repeated with the corrected contract. Historical PASS was not promoted while
the gap existed.

Focused public fixtures test workspace links, internal closure, generated
declarations, selected/sibling membership, installed content and membership,
link retargeting, the effective TypeScript probe, and incremental fingerprints
against independent full recomputation. The full local suite passed 28/28.

This contract is deliberately narrower than general workspace support: Yarn 4
classic node-modules, a standalone `tsc -p .`, conventional `src` inclusion,
Node module resolution, no compiler plugins/project references/custom aliases,
and no source links outside the checkout. Other scripts remain recording-only.
The complete installed tree is observed conservatively, so installation cache
or metadata activity can cause extra invalidation. The kernel/index stays
package-manager-agnostic; the Yarn-specific workspace derivation is isolated
from it. A separate install provider will be needed to model pnpm's layout.
