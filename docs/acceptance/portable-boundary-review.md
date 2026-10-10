# Portable evidence: independent boundary review

Current conclusion: bounded envelope parsing and pure inspection reviewed;
origin capture, recipient applicability, transactional import, trust/selection,
and machine/agent gates remain pending. REDUE-PE-001 G1–G4 are not certified by
this document. Baseline inspected: `b4f286034f43021a74f1babf2c1d0fee5df2a9e5`.

The review lane is independent of core and envelope authors. It owns this record
and `test/portable-boundaries.test.mjs`; it does not modify the applicability
implementation or existing expected results. Pure retained-query controls pass
only when observed facts match; they do not establish an observed execution
interval, producer trust, or portable eligibility.

## Required interface decisions

**D1 — origin completeness.** Export may use only original immutable captured
facts. New facts must be collected within the original checked observation interval
and bound to invocation, command, contract, scope, compiler and actual caller.
Today's filesystem cannot repair an old run. Missing, unstable, interrupted or
partially persisted origin evidence remains non-reusable. The original outcome
must remain visible when applicability or trust is absent.

**D2 — independent recipient identity.** The recipient discovers its full required
input set through locally supported recipe code, never through a producer-supplied
subset or executable validator. Bind configuration, command and scope rather than
the name `typecheck`. Paths are a declared case-sensitive project namespace, not
an arbitrary prefix replacement. Preserve content, membership, missing resolution
candidates, query options and omitted-argument indices. Preserve symlink topology
or reject it explicitly. File hashes cannot substitute for membership or interval
continuity, including changes restored before an end read.

**D3 — selection and trust.** Exact digest acceptance is an explicit local decision,
not an import side effect or global producer exemption. Imports never overwrite
local selectors or immutable runs. A newer local incomplete/unstable outcome or
FAIL must not reveal an older imported PASS. An applicable trusted FAIL plus an
unordered trusted PASS is a conflict until a declared authority or fresh observed
local execution resolves it. An unrelated-input historical failure must not block
new evidence forever. An untrusted failure cannot poison accepted local evidence.

## Runtime boundary finding

The local Node 22.13.0 arm64 process reports 347 loaded images: Node and three
system dylibs are readable files; 343 image paths are not ordinary readable files
and are provided by the macOS shared cache. Matching Node bytes and OS release
alone does not establish identical platform code. Hashing every presumed cache
filename is also insufficient unless those files are bound to the cache actually
loaded by the process.

Pinned Apple dyld source was reviewed at
`fd8d0c4d52320ebf64db34f3cb280310d905c5ae`:

- [Cache layout](https://github.com/apple-oss-distributions/dyld/blob/fd8d0c4d52320ebf64db34f3cb280310d905c5ae/doc/CacheLayout.md)
  describes executable/data/linkedit mappings split among cache files.
- [Cache format](https://github.com/apple-oss-distributions/dyld/blob/fd8d0c4d52320ebf64db34f3cb280310d905c5ae/include/mach-o/dyld_cache_format.h)
  binds the base header to subcache UUIDs and filename suffixes.
- [Process configuration](https://github.com/apple-oss-distributions/dyld/blob/fd8d0c4d52320ebf64db34f3cb280310d905c5ae/dyld/DyldProcessConfig.cpp)
  selects a system cache directory, override or ignition/cryptex payload and
  accounts for development/customer cache choices.
- [dyld process APIs](https://github.com/apple-oss-distributions/dyld/blob/fd8d0c4d52320ebf64db34f3cb280310d905c5ae/include/mach-o/dyld_priv.h)
  expose actual-process cache UUID, cache path and override/interposition facts.

A cross-machine macOS rule therefore needs a justified actual loaded-runtime
binding, complete selected cache constituent identity, remaining loaded-file
identity, architecture/build and conservative loader restrictions. An initial
same-host-only runtime constraint may support a truthful G1 checkout experiment;
it cannot satisfy G2. No unavailable library is represented by a fabricated hash.

## Adversarial acceptance to apply to the implementation

| Cases | Independent expected result |
| --- | --- |
| V03/V04 | Full recipient discovery matches original facts; real recipient has no equivalent execution or copied state. |
| V05/V06 | Content, config, additions/removals/renames and absent-candidate changes withdraw reuse. |
| V07/V08 | Compiler/runtime/dependency mismatch, case or unsupported topology withdraw reuse. |
| V09/V11/V12 | Mutation, malformed/duplicate keys, malicious paths, URLs, argv, nesting and size abuse cannot execute/fetch/write outside owned import state. |
| V13 | Missing start, unstable interval or incomplete outcome cannot be repaired during import. |
| V14 | Observer loss, root replacement or edits during validation do not return stale green. |
| V15–V17 | Replay, unordered trusted conflicts and untrusted failures obey D3; local selection stays authoritative. |
| V18/V19 | Old/unknown interpretations and interrupted transactional writes preserve historical records while withholding unsupported authority. |
| V20–V22 | Explicit obligations execute; trust-refresh policy is honest offline; outer CI success cannot invent an executed check. |

Each implemented case must retain an exact commit, command and actual result.
Deterministic CLI mechanics remain separate from genuine host behavior, machine
acceptance and economic evidence. Unknown resource availability is not a PASS.

## Envelope review result

Envelope author commit: `ab7f66d`. Independent test commits: `0b392ca`, `6ecbf59`.
On macOS arm64 Node 22.13.0:

```sh
node --test test/portable-boundaries.test.mjs test/portable-envelope.test.mjs
```

Result: 20 tests passed, zero failed or skipped. The independent tests include
absence/membership, rename, change-and-restore limitations, symlink topology,
case/Unicode and identity binding, inert JSON prototype keys, incomplete origin,
untrusted inspection, unknown embedded command/transport fields, malformed Unicode
and encoded duplicate keys. Author tests additionally cover size/depth/item limits,
truncation, digest substitutions, accessor rejection and incompatible schemas.

The review found contradictory `FAIL`/exit-zero and complete/interrupted origins
could initially pass schema validation. The author corrected exact outcome mapping
and complete-origin prerequisites before the reviewed commit; regression tests
passed. No remaining concrete parsed-input exploit was found in this finite review.
This result does not verify runtime equivalence, authenticate a producer or authorize
reuse. JavaScript producer objects are local API inputs; the imported-byte threat
boundary is parsed JSON, which cannot supply executable accessors or proxies.
