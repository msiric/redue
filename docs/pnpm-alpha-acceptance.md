# Historical acceptance note

This acceptance predates the REDUE name. Commands and artifact names below use
the former `vstate` spelling; the current CLI is `redue`.

# pnpm 12 alpha acceptance (2026-10-03)

This is an engineering acceptance run on public, disposable checkouts. It is not
product-use evidence. Installations used exact frozen lockfiles and separately
owned pnpm 12 executables/stores; no global pnpm configuration was changed.

## Real repositories

| Repository | Revision and layout | `vstate init` result | Execution/applicability |
| --- | --- | --- | --- |
| [BerriAI/litellm-bench](https://github.com/BerriAI/litellm-bench) | `642704a95555bc0fc25dd73017584345c8eedb3b`; pnpm 12.4.1; isolated; 22 workspaces | Selected `@litellm-bench/result-store:typecheck`; 28-line project-relative config; no hand-written input list | Standalone existing `tsc -p tsconfig.json --noEmit` ran through vstate in 865 ms; `CURRENT/PASS`, qualified, direct-command provenance |
| [lichess-org/chessground](https://github.com/lichess-org/chessground) | `01aa3e5f2693b2878fbe9cae828d480c520ce8ea`; pnpm 12.3.4; isolated; single package | Existing Vitest `test`; 19-line config | `vstate run test` passed 2 files/3 tests in 1,975 ms; historical `PASS` with `UNVERIFIED` applicability because runtime/transforms/cache coverage is not qualified |

Both lockfiles and tracked source were unchanged at the end. Each checkout only
had an untracked generated `vstate.config.json`; dependencies and, in the
workspace case, required ignored declaration outputs remained installed. Two
ordinary workspace builds were required once to supply the selected check's
existing declaration inputs. `init` itself executed no verification check.

For the workspace check, the same receipt became `STALE/PASS` after a selected
source edit, a consumed internal workspace declaration edit, and a
project-visible installed `@types/node` declaration edit with no lockfile
change. An unrelated root README edit and unrelated sibling workspace source
edit preserved `CURRENT/PASS`. Restoring input contents restored applicability;
a later relevant edit and wrapped rerun produced a new `CURRENT/PASS` receipt
(`756f80c7-1f51-4be7-a473-9d372ac9931e`). The installed-file mutation was
performed only in the disposable isolated installation; that file had one
link. Creating/removing an unrelated file in the separate pnpm store preserved
the same CURRENT receipt. Stopping the observer produced `UNVERIFIED/PASS`;
restart/reconciliation restored `CURRENT/PASS` with that receipt unchanged. A
new clean zsh process read the inherited CURRENT receipt. This was a new
process, not an agent-behavior test.

The internal dependency's consumed boundary was generated declarations, so
its source-only edit did not stale the selected check in the fixture. The
workspace relationship, link, declarations, actual compiler file list, and
installed package roots were checked at plan/probe time. The unrelated sibling
was outside the plan. Plan identity included the lockfile, workspace config,
installation metadata, and selected manifests. Public regressions covered
link retargeting, absence-to-presence, missing required installations,
configuration changes, installed-file membership, and project-visible
hardlink-content mutation. A live fixture observer also rebuilt its plan for
new project-local Node resolution topology: it briefly withheld CURRENT while
reconciling, then preserved the unchanged receipt. An installed file with an
unseen hardlink alias is
recording-only even though its present content is indexed: outside-alias
writes cannot support an authoritative CURRENT claim.

## Hoisted layout and limits

A faithful disposable pnpm 12.4.1 `nodeLinker: hoisted` installation produced a
qualified standalone root typecheck and `CURRENT/PASS`. It was intentionally
not counted as a real repository. PnP, custom `modulesDir`, custom/global
virtual store, separate workspace lockfiles, custom installation hooks,
injected workspace dependencies, source/install links outside the observed
boundary, shared installed hardlinks, and optional absences with unobserved
ancestor Node lookup locations stay recording-only with explicit reasons.
Project-local absence candidates still participate in plan changes. A missing
required installed dependency is reported as a defect, not as an acceptable
optional absence. The supported contract does not claim coverage for arbitrary
compiler plugins/loaders, lifecycle scripts, or custom resolvers.

For qualified standalone TypeScript scripts vstate invokes the installed
compiler with the existing script arguments and working directory. It does not
invoke `pnpm run`: pnpm 12's script bookkeeping writes at the repository root
caused an unnamed FSEvents notification and an observation gap in a disposable
reproduction. Other discovered scripts remain `pnpm run` recording-only.

## Cost and cleanup

The workspace plan indexed 6,001 files / 86.3 MB. A retained-state restart
reported 1,460 ms discovery, 0 ms new indexing, 50.6 ms catch-up, and 60 MiB
daemon RSS in one idle sample. Five Node CLI cached queries had a 76.7 ms
median; five synchronized queries had a 1,653 ms median because the bounded
compiler input probe runs on synchronization. These numbers are local samples,
not p95 or cold-machine benchmarks. The single-package recording-only index
had 27 files / 0.21 MB; the hoisted fixture had 128 files / 22.4 MB. Peak RSS
and warm edit-to-state-update latency were not measured reliably here.

All three disposable observers were stopped. Removing only the hoisted
fixture's owned vstate state left its installation and separate pnpm store
intact. The two real-repository acceptance states remain outside their
checkouts for inspection, with observers stopped. The final public regression
suite passed 33/33 tests.
