# Alpha release procedure

No release is automatic. The repository remains private and the package unpublished
until the owner explicitly authorizes public release. The alpha.1 candidate has
`private: false` and `publishConfig` set to public/alpha for artifact validation;
this metadata is not permission to publish. The owner selected the standard
Apache-2.0 license for the open-source core.

## Candidate validation

1. Run the product CI matrix (Node 22 on macOS/Linux/Windows; Node 24 on Linux).
2. Run the manual public-project acceptance on the packaged build when a release
   changes onboarding/install boundaries. Retain deeper native stress separately.
3. For the final candidate, dispatch **Exact release tarball smoke (no publication)**.
   It checks the exact public npm name, audits runtime dependencies, and packs once.
   macOS, Linux and Windows then install/exercise/uninstall that identical tarball,
   recording its SHA-256. The tarball, manifest and checksum remain private artifacts.
   **Prepare alpha package (no publication)** remains an optional single-platform
   preparation check; it does not replace the final cross-platform package gate.
4. Inspect the manifest: runtime source/native observer helper, entry points, user
   docs/examples, README/changelog/license only. No local state, private config,
   test installation, corporate material, or historical evidence.
5. Scan the tree and Git history for secrets. Review dependency licenses and
   vulnerabilities. Confirm package name availability/ownership immediately before
   first publication; a registry 404 is not a reservation or proof of publishing rights.

## Explicit release gates

- Preserve the standard Apache-2.0 LICENSE and matching package metadata. Keep any
  third-party attribution required by the material actually distributed.
- Confirm the intended personal npm publisher account, 2FA, and ability to own the
  exact `redue` name. Do not store credentials in this repository or its logs.
- Enable GitHub private vulnerability reporting when the repository becomes public,
  before publishing the package; the private-repository API currently returns 404.
- Obtain explicit approval to change repository visibility and publish the package.
- Review the publication-enabled metadata and dated CHANGELOG candidate. Repack
  and revalidate the exact candidate after any package-content changes.

## Standard publication, after approval

Use `0.1.0-alpha.1` for the first public alpha and increment the prerelease for fixes.
The repository and prepared artifact remain privately held until explicit release approval.
Publish to the `alpha` tag, never silently to `latest`:

```sh
# Use the inspected, cross-platform-tested tarball retained during validation.
npm publish ./path/to/redue-0.1.0-alpha.1.tgz --tag alpha --access public
```

The first publish may require the maintainer's interactive npm authentication/2FA.
Do not automate around that control. Once the package exists, configure npm's
GitHub Actions trusted publisher for this owner/repository and one reviewed publish
workflow. Prefer standard OIDC (`id-token: write`) over a long-lived stored token.
Use a current npm CLI meeting npm's trusted-publishing requirements. Automatic
provenance requires a public source repository and public package; private candidate
artifacts must not be represented as having public npm provenance.

Tag the reviewed commit `v0.1.0-alpha.1`, create a GitHub prerelease from CHANGELOG,
and attach the matching tarball, manifest, and checksum. There is intentionally no
publish workflow or write-token release automation before these decisions.

## Rollback

A published version is immutable; fix forward with a new alpha. If necessary,
move the `alpha` dist-tag to a previous tested version and deprecate the defective
version with an actionable message. Do not assume unpublish is possible: npm's
policy restricts it and deletion can disrupt users. Do not delete user evidence.
Users can install an exact prior version; incompatible local state must fail clearly,
not be silently reinterpreted.

## Reviewed first-alpha sequence

These commands are for the reviewed alpha.1 candidate and are **not executed by
preparation**. Run only after explicit approval to make REDUE public and publish.
The final release/report commits are already on private main. From that clean
checkout, verify that its packaged contents still match candidate `2355466` and
that npm still identifies `msiric` with publishing 2FA enabled. Recheck the exact
registry name; stop if another package has appeared.

```sh
(
set -eu
redue_release_commit=$(git rev-parse HEAD)
redue_release_dir=.local/release-candidates/0.1.0-alpha.1-2355466
test -z "$(git status --porcelain)"
(cd "$redue_release_dir" && shasum -a 256 -c SHA256SUMS)
git push origin main

# Public actions: require the owner's final release approval.
gh repo edit msiric/redue --visibility public --accept-visibility-change-consequences
gh api --method PUT repos/msiric/redue/private-vulnerability-reporting
npm publish "$redue_release_dir/redue-0.1.0-alpha.1.tgz" --tag alpha --access public --registry=https://registry.npmjs.org
gh release create v0.1.0-alpha.1 "$redue_release_dir/redue-0.1.0-alpha.1.tgz" "$redue_release_dir/SHA256SUMS" "$redue_release_dir/manifest.json" --repo msiric/redue --target "$redue_release_commit" --prerelease --title "REDUE v0.1.0-alpha.1" --notes-file CHANGELOG.md
)
```

Stop on any failure. `gh release create` creates the tag at the reviewed commit;
do not move an existing tag. The maintainer completes npm's interactive 2FA challenge.
Publish the retained artifact, not a new pack from a different checkout or platform.

Immediate registry smoke, also only after publication:

```sh
(
set -eu
redue_smoke=$(mktemp -d /tmp/redue-postpublish.XXXXXX)
npm pack redue@0.1.0-alpha.1 --registry=https://registry.npmjs.org --pack-destination "$redue_smoke"
node test/acceptance/package-smoke.mjs --tarball "$redue_smoke/redue-0.1.0-alpha.1.tgz"
rm "$redue_smoke/redue-0.1.0-alpha.1.tgz"
rmdir "$redue_smoke"
)
```

The smoke installs into its own prefix and exercises the real public command,
qualified workflow, restart and scoped removal. It does not replace a user's
installation. If it fails, retain diagnostics and use the rollback guidance above.

References: [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/),
[npm pack](https://docs.npmjs.com/cli/v11/commands/npm-pack/),
[npm unpublish policy](https://docs.npmjs.com/policies/unpublish/).
