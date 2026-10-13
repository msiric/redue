# Pinned TypeScript directory metadata under a closed read view

Source-only boundary assessment for REDUE-PE-001. No API, compiler, native
sandbox, model or CI operation was executed for this assessment. This does not
admit the synthetic-inventory canary policy as a real compiler policy.

The already selected public debugger installation reports TypeScript5.5.2.
Its reviewed `lib/tsc.js` SHA256 is
`390875cd26ab0e496c55804c26c93adab850c0b48573a14967bc479538179c73`.
The references below use that distribution's line numbers and the official
[v5.5.2 system implementation](https://github.com/microsoft/TypeScript/blob/v5.5.2/src/compiler/sys.ts)
and [v5.5.2 resolution implementation](https://github.com/microsoft/TypeScript/blob/v5.5.2/src/compiler/moduleNameResolver.ts).
No new compiler implementation/version or coverage is proposed.

## Filesystem answers are semantic inputs

`directoryExists`/`fileExists` use `statSync`, follow filesystem resolution and
return false on errors (tsc5229–5233; entry helper5207–5227). Directory metadata
permission can therefore distinguish an existing outside directory from an
absent or denied one. `directoryProbablyExists` and the relative/ancestor module
loaders use that answer to suppress or perform further lookups
(16788,39839–39884,40665–40715). The path/query sequence, failed lookup collection
and optional trace output can differ without any outside source-file body being
read. Directory answers must not be projected away as "irrelevant" solely
because outside file reads are denied.

Directory enumeration is a different permission/result from directory metadata.
`getAccessibleFileSystemEntries` uses `readdirSync(...,{withFileTypes:true})`
(5165–5202), classifies ordinary directory entries from the returned dirents,
and only stats string/symlink entries. Its catch returns empty collections.
`getDirectories` and `readDirectory` consume those answers. Globally allowed
stat-directory does not establish that enumeration is allowed, nor does denied
enumeration establish that the directory was absent. A literal read exception
for `/` may admit enumeration of `/` itself: its names/types are directory body
data even though no child file body or file stat is admitted. That operation
needs actual native-policy evidence; it is not inferred as an observed success.

`realpath` can expose outside directory/link identity or map an admitted file to
another spelling. Denial returns the original path (5241–5247). Resolver uses
this answer for resolved/original path identity (38787+,39829–39837). A returned
unchanged string does not prove absence, a lack of symlinks or successful
canonicalization. Lexical outside paths must not be deemed physically disjoint
from admitted stage paths without independent alias/case/firmlink binding.

Initial sys construction also detects filesystem case sensitivity using a
case-swapped spelling of its own implementation filename (5069–5075). The
admitted native path view can affect that fileExists result. The API loads
`typescript.js` while CLI loads `tsc.js`; don't infer that their case/realpath
facts match merely because they belong to the same verified package.

## Concrete source-supported limitation, not an executed counterexample

For a locally supplied config with no `types` and with `typeRoots:["/"]`,
`getAutomaticTypeDirectiveNames` enumerates directories in `/` (39038–39063).
A non-dot directory name becomes an implicit type obligation unless its package
metadata says otherwise. If outside child-file metadata/body is denied, the
attempted type resolution can fail and generate diagnostic2688
(121015–121019). The presence of an extra root directory can thus introduce an
extra missing-type diagnostic using enumeration/metadata only. This is a
finite source-derived counterexample to a *general* claim that outside body
read denial removes all outside influence. It was not run, is not an approved
debugger counterexample, and is not a released false-CURRENT report.

The approved debugger config explicitly lists
`node`, `chai-subset`, `chai-as-promised`, and `mocha` in `types`; the automatic
name enumeration returns that explicit list before inspecting directories.
The current engineering probe's parsed-config guard rejects outside explicit
`typeRoots`, `rootDirs`, path mappings and relevant explicit config/output
paths. Those conditions rule out this particular root-enumeration route for
the selected contract; they do not prove exhaustive CLI/query independence.
Implicit ancestor lookups still occur, including built-in library replacement
resolution, and require an exact same-view justification.

## Narrow condition that still needs evidence

A potential initial compiler-only policy may conservatively reject outside
explicit paths, outside discovered configs/sources, plugins, references and
incremental state, and bind the actual locally parsed approved config. Under
that limited input set, outside directories used only as resolver containers
may affect attempted lookups while every outside file candidate remains
unresolvable. Treating those attempts as unable to change PASS/FAIL requires
source closure of the actual full CLI path **and** native proof that all such
file/body/alias paths have the stated denied outcomes in that same view. This
is a conditional direction, not an established assumption or a boolean gate.
Outside enumeration/root exception and realpath/case aliases remain explicit
questions. No broad OS read reallow or arbitrary external path is recommended.

Legacy `queryAnswer` remains unchanged: it returns null for ENOENT/ENOTDIR and
throws for EPERM/EACCES. The sealed forwarding adapter preserves ts.sys's true
false/undefined/text/error result separately from raw DENIED/MISSING events.
The historical partial API collection's388 outside EPERM observations are
actual retained denials, not388 proven absent inputs or a complete denial set.
Its914-file graph and partial journal do not establish deferred CLI diagnostics,
full query coverage, API/CLI equivalence, native isolation or reusable evidence.
The configured CLI performs full diagnostic/reporting work after createProgram
(128903+), so source-file discovery cannot replace that obligation.
