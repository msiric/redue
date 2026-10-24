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
build scripts. It prefers familiar script names (for typecheck: `typecheck`,
`type-check`, `check-types`, `check:types`, `types:check`, `tsc`, `types`,
`lint:types`), then for typecheck one script named under such a name
(`typecheck:test`, `tsc:build`; not a watch script), then unique recognizable
`tsc`, Vitest/Jest, ESLint, or Vite commands under other names. Multiple
matches are reported as ambiguous rather than guessed. It never creates a new
project script. Without `--recipe`, `init` tries the strict recipes below first,
then the [general recipe](node-script.md) for a root typecheck or lint
script: the script run through the package manager with every Node process
recorded and the whole checkout as its input. `--recipe typescript-direct`,
`tests-direct` or `node-script` selects one recipe alone. The direct TypeScript recipe supports
a typecheck script of `tsc --noEmit` runs in any argument order, chained runs,
or no typecheck script at all (a proposed `tsc --noEmit`; see
[script forms](direct-typescript.md#script-forms)), in a single-package npm installation using
TypeScript 5.x or 6.0 (a reviewed release, or one whose installed files match the
tarball package-lock.json names in npm's cache; see
[compiler identity](direct-typescript.md#compiler-identity)) and Node 22/24. It executes the local compiler,
not npm. Full installed compiler identity, config/membership, installed inputs
and relevant Node environment are checked before reuse. See the
[exact direct boundary](direct-typescript.md). Unsupported plugins, preloads,
configuration or outside-root inputs remain UNVERIFIED. Root and package-level npm/Yarn workspace scripts are discovered from
`package.json` workspace declarations. In a workspace of more than 50
packages, `init` proposes the root's checks only and names what it skipped;
add package checks to the config yourself. Up to 1000 packages are read. Pinned Yarn 4 `node-modules`/classic
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
typechecks, Vitest/Jest, ESLint, and builds in workspace packages start
recording-only unless a separately justified explicit contract is provided.
For a single-package project whose test script runs Vitest 4/5 or Jest 29
directly, `init` uses the direct test recipe, which records the run and guards
its inputs; see [direct tests](tests-direct.md).
In particular, test caches and build-generated inputs are not excluded to
make evidence green.

pnpm 9-12 projects are read from `packageManager`, `pnpm-workspace.yaml`,
`.npmrc`, the lockfile, and the installed `node_modules/.modules.yaml`
metadata. The installed metadata names the pnpm version; a `packageManager`
pin is optional, and when present (with or without Corepack's `+sha512` hash)
it must name the installed version. Settings that only change what gets
installed are accepted, because the installed files are what REDUE observes.
Settings that move or copy installed files, or run code during install, are
not: custom `modulesDir`, `virtualStoreDir` or `lockfileDir`, the global
virtual store, injected workspace packages, separate workspace lockfiles,
pnpmfile hooks and `configDependencies`. They are refused when either
`pnpm-workspace.yaml` or `.npmrc` sets them. The linker is read from the file
the installed major reads (`.npmrc` for pnpm 9, `pnpm-workspace.yaml` then
`.npmrc` for pnpm 10, `pnpm-workspace.yaml` for pnpm 11 and 12) and must match
the installed one. Only the project's files are read: settings from a user or
global rc file, or `npm_config_*` variables during install, are not. The
supported local layouts are pnpm's standard isolated and hoisted
`node_modules` with a project-local `.pnpm` virtual store. `init` can discover
root and workspace scripts. For a typecheck script of `tsc` runs
([script forms](direct-typescript.md#script-forms); `tsc -p .` without
`--noEmit` is also accepted), or a package with a `tsconfig.json` and no
typecheck script, it records the exact installed compiler invocation directly.
The source inputs are the directories the config's `include` covers, as
TypeScript itself computes them for new files, minus `node_modules` (`exclude`
entries stay inputs: an import can still reach an excluded file); a file the
program reads outside them keeps the check recording-only. This avoids pnpm's task-run bookkeeping
writes during `pnpm run`; it does not alter the project's script. Test, lint,
build, and ambiguous TypeScript scripts still execute through `pnpm run`; root
typecheck and lint ones can use the [general recipe](node-script.md). The generated `@typescript-bin:WORKSPACE` token resolves
the local compiler when the check runs; it is not an absolute machine path.

The pnpm contract indexes consumed installed package contents inside the
project, selected workspace source, linked workspace declaration outputs,
relevant manifests, configuration, and installation metadata. The global pnpm
store is neither watched nor deleted. PnP, custom modules/virtual-store roots,
global virtual stores, injected workspace dependencies, and external links
without an observed boundary remain recording-only with a reason. Installed
files with hard-linked aliases outside the checkout remain recording-only on
macOS: writes through an unseen alias cannot support CURRENT there. On Linux,
redue watches project-installed file inodes and re-reads the identity of the
selected installed inputs on every synchronized read. A cached read remains UNVERIFIED
for these pnpm checks; a synchronized read can establish CURRENT after that
re-read. If an inode watch cannot be installed, observation becomes unavailable
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
