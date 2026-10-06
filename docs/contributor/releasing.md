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

## Direct publication, after approval

From the clean checkout at the reviewed release commit, with the downloaded
candidate in `.local/release-candidates/<version>/`:

```sh
(
set -eu
redue_release_commit=$(git rev-parse HEAD)
redue_version=$(node -p 'require("./package.json").version')
redue_release_dir=".local/release-candidates/$redue_version"
test -z "$(git status --porcelain)"
test "$(npm whoami --registry=https://registry.npmjs.org)" = msiric
node test/acceptance/registry-name.mjs
redue_artifact=$(node test/acceptance/package-artifact.mjs verify "$redue_release_dir/manifest.json")
git push origin main
npm publish "$redue_artifact" --tag alpha --access public --registry=https://registry.npmjs.org
gh release create "v$redue_version" "$redue_artifact" "$redue_release_dir/SHA256SUMS" "$redue_release_dir/manifest.json" --repo msiric/redue --target "$redue_release_commit" --prerelease --title "REDUE v$redue_version" --notes-file CHANGELOG.md
)
```

Stop on failure and diagnose it. Do not silently switch coordinates, rebuild,
republish different bytes, or move a tag. The maintainer completes npm's interactive
2FA challenge. Use direct publication, not staged publishing, for the first version.
Publish with `--tag alpha`. On a brand-new package npm may also assign `latest`
automatically. Verify and report both tags; if `alpha` and the artifact are correct,
that registry behavior is not a failed release. Do not repeatedly attempt removal
of `latest` after a registry rejection.
GitHub private vulnerability reporting is already enabled.

## Public-registry smoke

Download from the registry, compare with the validated checksum, then exercise the
installed public command. This does not replace a user's installation.

```sh
(
set -eu
redue_smoke=$(mktemp -d /tmp/redue-postpublish.XXXXXX)
redue_version=$(node -p 'require("./package.json").version')
redue_coordinate=$(node -p 'const p=require("./package.json"); p.name+"@"+p.version')
npm pack "$redue_coordinate" --json --registry=https://registry.npmjs.org --pack-destination "$redue_smoke" > "$redue_smoke/manifest.json"
node test/acceptance/package-artifact.mjs record "$redue_smoke/manifest.json"
cmp ".local/release-candidates/$redue_version/SHA256SUMS" "$redue_smoke/SHA256SUMS"
node test/acceptance/package-smoke.mjs --manifest "$redue_smoke/manifest.json"
redue_download=$(node test/acceptance/package-artifact.mjs verify "$redue_smoke/manifest.json")
rm "$redue_download" "$redue_smoke/manifest.json" "$redue_smoke/SHA256SUMS"
rmdir "$redue_smoke"
)
```

Verify public npm version/dist-tags, repository visibility, release target and
attached checksums. Keep failure diagnostics if any step fails.

## Alpha.1 migration pointer

Only after `@redue/cli@0.1.0-alpha.2` is published and its public-registry smoke
passes, deprecate the personal-scope package without unpublishing it:

```sh
npm deprecate '@msiric/redue@*' 'REDUE has moved to @redue/cli. Install with: npm install -g @redue/cli@alpha' --registry=https://registry.npmjs.org
```

Complete interactive 2FA and verify the public deprecation message. Do not change
or delete the historical alpha.1 GitHub release, tag, assets or package bytes.

## Later automation and rollback

Trusted publishing through GitHub Actions/OIDC is a separate follow-up after the
package exists. Do not add a long-lived publishing token or release automation as
part of the first release. No automatic migration to the unscoped name is planned.

Published versions are immutable. Fix forward with a new alpha. If necessary,
move `alpha` to a previous tested version and deprecate the defective version with
an actionable message. Do not assume unpublish is possible or delete user evidence.
Incompatible state must fail clearly rather than being reinterpreted.

References: [npm scoped public packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/),
[npm trusted publishing](https://docs.npmjs.com/trusted-publishers/),
[npm unpublish policy](https://docs.npmjs.com/policies/unpublish/).
