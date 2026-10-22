# Alpha release procedure

REDUE's permanent npm coordinate is `@redue/cli`; its executable is
`redue`. The repository is public. Publication still requires explicit release
authorization; package metadata is not permission to publish.

The unscoped name was rejected by npm's similarity policy. Alpha.1 used the
personal-scope bootstrap package. Alpha.2 uses the `redue` organization, owned by
`msiric`. Retain the old release and package; after canonical publication and
public smoke pass, deprecate the old package with the canonical install command.
A registry 404 does not establish scope ownership or guarantee publication.

## Candidate validation

1. Confirm a clean reviewed commit, publisher `msiric`, publishing 2FA, package
   ownership/availability and the intended version. Do not log credentials.
2. Run `node test/acceptance/registry-name.mjs`. It derives the exact encoded
   coordinate from package.json and distinguishes absent, owned, unexpected and
   unavailable metadata. Owned requires the expected maintainer and repository;
   authenticated publication permission remains a separate gate.
3. Run the focused packaging regressions. Run broader product/platform tests only
   when runtime changes require them; inherited acceptance is retained separately.
4. Dispatch **Exact release tarball smoke (no publication)** for the reviewed ref.
   It audits dependencies and packs once. All three OS jobs install the identical
   artifact selected from `npm pack --json`, verifying its checksum and exercising
   the real `redue` binary, freshness workflow, restart and scoped cleanup.
5. Download `exact-release-candidate` into a separately owned local candidate
   directory. Retain its `manifest.json`, `SHA256SUMS` and reported tarball. The
   optional **Prepare alpha package** workflow does not replace the three-OS gate.
6. Inspect actual package contents and scan the source/history for secrets. Keep
   Apache-2.0 and third-party notices. No receipts, caches, private configuration,
   tests or historical acceptance reports belong in the distributed package.
7. Repack and revalidate after any package-content change. Do not repack between
   successful validation and publication. Push the reviewed release commit to main.

A temporary candidate branch can supply the workflow before main advances. The
release target must include the reviewed scoped metadata; it must not target the
obsolete unscoped candidate. The source runtime is not rebuilt during packaging.

## Publication through CI, after approval

Publication runs in GitHub Actions through npm trusted publishing (OIDC); no
npm token exists. Local publication is not used: the maintainer's network
blocks `registry.npmjs.org`.

After the release commit is on main and **Exact release tarball smoke** passed
for it:

```sh
gh workflow run publish.yml --ref main -f version=0.1.0-alpha.N -f artifact_run_id=<smoke run id>
gh run watch <publish run id> --exit-status
```

`publish.yml` checks that the run is a successful `release-package.yml` run,
checks out its commit, verifies the downloaded tarball against its manifest
and `SHA256SUMS`, and checks that package.json and the tarball carry the
requested version and that the version is not yet on npm. It then publishes
those exact bytes with `--tag alpha` (npm 11.21.0+, provenance is automatic),
points `latest` at the same version with `npm dist-tag add`, and creates the
GitHub prerelease `vVERSION` at that commit, with only that
version's CHANGELOG entry as notes and the tarball, `SHA256SUMS` and
`manifest.json` attached.

Its `public-smoke` job then downloads the published package on macOS, Linux and
Windows, compares its SHA256 with the tested tarball, runs the package smoke,
and checks that `alpha` and `latest` both name the published version.

npm can hold a trusted publish as a staged version for many minutes (about 30
for alpha.12) before it serves it or applies the `latest` move. Publishing
again in that window fails with `409 ... previously staged version`. The
publish step treats that as published and waits up to 30 minutes for the
registry to serve the same bytes.

The workflow creates the tag `vVERSION` at the tested commit first, through
the Git refs API, before anything is published. Up to alpha.14 it created the
tag inside `gh release create`, after the npm publish, and that failed with
HTTP 404 for alpha.12 and alpha.14 although alpha.14 followed no workflow change. If
the tag step is refused, it prints GitHub's response and stops before npm;
push the tag from a maintainer checkout (`git tag vVERSION COMMIT && git push
origin vVERSION`) and rerun. The workflow then creates the release on that tag. A rerun skips npm when the same
bytes are already published and skips an existing release, so a failed later step
can be rerun. The `latest` move runs on every attempt. Stop on failure and diagnose it. Do not rebuild, republish different
bytes, or move a tag. On npm, `@redue/cli` has one trusted publisher: repository
`msiric/redue`, workflow `publish.yml`, no environment, with `npm publish` and
**Allow npm dist-tag** enabled. Without the dist-tag permission the `latest` step
fails after the publish; enable it on npmjs.com and rerun the workflow.

## Alpha.1 migration pointer

Only after `@redue/cli@0.1.0-alpha.2` is published and its public-registry smoke
passes, deprecate the personal-scope package without unpublishing it:

```sh
npm deprecate '@msiric/redue@*' 'REDUE has moved to @redue/cli. Install with: npm install -g @redue/cli@alpha' --registry=https://registry.npmjs.org
```

Complete interactive 2FA and verify the public deprecation message. Do not change
or delete the historical alpha.1 GitHub release, tag, assets or package bytes.

## Later automation and rollback

Do not add a long-lived publishing token. No automatic migration to the unscoped
name is planned.

Published versions are immutable. Fix forward with a new alpha. If necessary,
move `alpha` and `latest` to a previous tested version and deprecate the defective version with
an actionable message. Do not assume unpublish is possible or delete user evidence.
Incompatible state must fail clearly rather than being reinterpreted.

References: [npm scoped public packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/),
[npm trusted publishing](https://docs.npmjs.com/trusted-publishers/),
[npm unpublish policy](https://docs.npmjs.com/policies/unpublish/).
