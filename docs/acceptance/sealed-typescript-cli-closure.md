# Selected TypeScript CLI closure assessment

REDUE-PE-001 / D12, source-only. No TypeScript API, verification command, native
agent, model or CI was launched for this assessment. Shared capture helpers and
all existing provider behavior are unchanged.

The selected5.5.2 `tsc.js` SHA256 is
`390875cd26ab0e496c55804c26c93adab850c0b48573a14967bc479538179c73`.
Line references below refer to that reviewed distribution. Primary source is
[TypeScript v5.5.2 program implementation](https://github.com/microsoft/TypeScript/blob/v5.5.2/src/compiler/program.ts).
The preserved public debugger stage's raw `tsconfig.json` SHA256 is
`b686bac4abc2a8b17ca7a33ac1b5766c8a3bb7e09e5affb30bff5a3c9914a4f8`.
Reading raw JSON does not establish a newly parsed effective config.

## Scope actually selected

The config declares module ES2022, target ES2021, lib ES2022, bundler resolution,
strict/noImplicitAny, noUnusedLocals, skipLibCheck and noEmit. It includes `src`,
explicitly lists four ambient type packages, and maps `jsonc-parser` to its
installed ESM JavaScript entry. There are no declared extends, project references,
plugins, incremental/composite or explicit outside paths in this file. Runtime
parsing must still validate those conditions without altering the options.

The historical generic diagnostic counterpath at48156–48158 requires Node16 or
NodeNext resolution plus an ESNext extensionless relative import. Bundler maps
to100; the tested condition requires3 or99. That particular late suffix path
is not justified as a branch taken by the selected debugger. The prior three
synthetic API attempts remain UNKNOWN; a different mode fixture must not be
used to claim ordinary-project closure or new supported coverage.

## Actual CLI work beyond source-file discovery

The common discovery helper returns `createProgram(...).getSourceFiles()`. It
neither requests the checker nor substitutes for the following CLI obligations:

- `performCompilation` creates a compiler host/program and calls the full report/
  exit-status pipeline (128903+).
- The report pipeline collects configuration, syntactic, options, global and
  conditional semantic diagnostics, then invokes `program.emit` (125389–125426).
- Crucially, `handleNoEmitOptions` calls `program.getSemanticDiagnostics` even
  when noEmit is true (122140–122145). An earlier options/syntax/global error
  suppressing the pipeline's first semantic call does not prove semantic work
  absent; noEmit processing still requests it. Cached results may avoid repeated
  work, but the graph-only discovery never establishes that cache/result.
- Semantic checking invokes the lazy checker and source diagnostics
  (120014+,120130–120153). The checker can ask filesystem questions not required
  merely to enumerate its source files. Source evidence for one such conditional
  path is already retained in the independent boundary review.
- `noEmit` still passes through emit/build-info logic; incrementality, references,
  build outputs, plugins and unsupported path options must remain refused. A
  configured noEmit command is not permission to ignore arbitrary write paths.

Default libraries are obtained through library replacement resolution and
fallback to the compiler's installed library path (121027+), not only by knowing
the package version. All59 historically consumed installed libraries were inside
the copied tree. Installed declarations, package metadata, resolution candidates,
path mapping targets and any diagnostics-only candidates must remain represented
by the protected actual namespace; the914-file graph is not that namespace.

## What would close the bounded compiler-input claim

Whole staged namespace coverage can make unenumerated *in-tree* diagnostic
queries safe without constructing a second TypeScript graph, only after native
interval enforcement protects every staged file, directory membership/absence,
empty directory and modeled link/alias topology. Source file hashes alone do
not describe that full filesystem. Positive directory answers and readDirectory
behavior must not be fabricated from a file-only manifest.

Outside directory metadata/root enumeration/realpath answers remain separately
modeled questions, as detailed in the directory-metadata assessment. Body denial
alone is not a blanket proof of outside independence. Exact caller cwd, Node/
compiler/runtime interpretation, environment and read-view policy must be bound
before loading the implementation and through the real command. A daemon probe
with a more permissive view cannot supply missing caller facts.

The smallest subsequent diagnostic is the **unchanged configured CLI** inside
that independently reviewed compiler-only native view: staged Node runs the
staged `node_modules/typescript/lib/tsc.js` with only `--noEmit`, cwd at the same
stage root. This is a proposed engineering verification execution, not executed
or authorized by this note. Keep the real exit/signal and bounded result; no
changed options, artificial missing imports or NodeNext substitution. Before
using its outcome as evidence, independently establish full protected namespace
and outside-answer obligations. A successful CLI alone still cannot establish
those prerequisites, and no API graph is promoted to complete along the way.

No additional synthetic API trial or generic journal/controller is recommended
now. Existing source/fake countercontrols already establish the generic graph
limitation; the next missing evidence is the actual selected CLI under the final
proved input boundary. The partial collection's388 EPERM events remain actual
retained denials, not absence or an exhaustive query set. Its preceding UNKNOWN
attempts, all false completeness flags and prior positive/negative outcomes are
preserved. Stage-only compiler acceptance remains NOT ESTABLISHED.
