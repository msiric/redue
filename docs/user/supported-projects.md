# Supported Node projects

`init` detects npm from `package-lock.json`/`npm-shrinkwrap.json` or an npm
`packageManager` declaration. It detects Yarn from `yarn.lock` or its
declaration and reads `.yarnrc.yml` to distinguish node-modules/classic from
PnP and other modes. A Yarn v1 lockfile can identify the classic layout, but
without a declared Yarn version `init` does not create a runnable config:
Corepack can select a different version and edit `package.json`. Conflicting
package managers are reported without pretending that installation coverage
is known. When npm is not pinned in `package.json`,
`init` reads the local npm executable's package manifest if available; it
leaves the version unknown rather than guessing if that inspection fails.

At the repository root, `init` looks for existing typecheck, test, lint, and
build scripts. It prefers familiar script names, then unique recognizable
`tsc`, Vitest/Jest, ESLint, or Vite commands under other names. Multiple
matches are reported as ambiguous rather than guessed. It never creates a new
project script. Canonical `tsc --noEmit` npm scripts are discovered and recorded, but their
automatic applicability is withdrawn in alpha.4: npm's update notification uses
remote/cache/time inputs outside the observed contract. Even a successful run
remains UNVERIFIED/PASS. Historical receipts are retained. See the
[maintainer notice](npm-launcher-notice.md). A separately selected verification
obligation would require an explicit configuration and fresh evidence; alpha.4
does not provide the unreleased npm direct-compiler recipe. Root and package-level npm/Yarn workspace scripts are discovered from
`package.json` workspace declarations. Pinned Yarn 4 `node-modules`/classic
workspaces with a standalone `tsc -p .` script, local TypeScript, a conventional
`src` include, and Node module resolution can qualify automatically. For one
workspace, use `redue init --workspace NAME --check typecheck`; it writes only
that check and keeps derived relationships out of project configuration. The
contract observes selected `src` membership, root/package TypeScript config,
built declarations of internal workspace dependencies, and physical installed
files. It rechecks TypeScript's effective input list with a read-only probe.
A sibling workspace is not an input merely because it shares the repository.
When an internal dependency is consumed through built declarations, changing
only its source does not stale the selected check until the consumed output
changes. Unsupported custom resolution, project references, outside-root
source links, and installation modes remain recording-only. Other Yarn
typechecks, Vitest/Jest, ESLint, and builds start recording-only unless a
separately justified explicit contract is provided.
In particular, test caches and build-generated inputs are not excluded to
make evidence green.

Pinned pnpm 12 projects are read from `packageManager`, `pnpm-workspace.yaml`,
the lockfile, and the installed `node_modules/.modules.yaml` metadata. The
supported local layouts are pnpm's standard isolated and hoisted
`node_modules` with a project-local `.pnpm` virtual store. `init` can discover
root and workspace scripts. For a standalone `tsc --noEmit` or `tsc -p ...`
script in the narrow TypeScript contract, it records the exact installed
compiler invocation directly. This avoids pnpm 12's task-run bookkeeping
writes during `pnpm run`; it does not alter the project's script. Test, lint,
build, and ambiguous TypeScript scripts still execute through `pnpm run` and
start recording-only. The generated `@typescript-bin:WORKSPACE` token resolves
the local compiler when the check runs; it is not an absolute machine path.

The pnpm contract indexes consumed installed package contents inside the
project, selected workspace source, linked workspace declaration outputs,
relevant manifests, configuration, and installation metadata. The global pnpm
store is neither watched nor deleted. PnP, custom modules/virtual-store roots,
global virtual stores, injected workspace dependencies, and external links
without an observed boundary remain recording-only with a reason. Installed
files with hard-linked aliases outside the checkout remain recording-only on
macOS: writes through an unseen alias cannot support CURRENT there. On Linux,
redue watches project-installed file inodes and rehashes the selected
installed inputs on every synchronized read. A cached read remains UNVERIFIED
for these pnpm checks; a synchronized read can establish CURRENT after the
rehash. If an inode watch cannot be installed, observation becomes unavailable
instead of dropping that file. The global store is not watched. An absent
optional package remains unqualified when Node could later
resolve it from an unobserved ancestor `node_modules`; project-local candidate
locations are still tracked for plan changes. No configuration assertion is
generated to hide either gap.

An unobservable source symlink or missing Git checkout is reported by `init`
before writing a config. A local explicit configuration can grant a narrow
external observation root after review; `init` will not add machine-specific
paths to a project config automatically.

The generated config is project-relative and versioned. Runtime state and
receipts live separately. `packageManager`, `checks[].script`, `kind`,
`inputs`, optional `workspace`, and optional `qualification` are the generated
public fields. The
CLI also accepts `checks[].command` as exact argv for arbitrary checks;
`@node`, `@project`, `@which:NAME`, and the narrow
`@typescript-bin:WORKSPACE` token are resolved at invocation. A command
or input-declaration change invalidates previous evidence.


Windows supports the same qualified contracts on local NTFS, with project-visible installed hardlinks revalidated during synchronized reads. Cached hardlink-sensitive applicability is conservative. No package-manager or platform promises that synchronization is cheaper than execution.
