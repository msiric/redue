# Alpha release procedure

No release is automatic. This repository and package remain private/unpublished
until the owner explicitly authorizes public release. `package.json` deliberately
retains `private: true`; license choice and npm ownership are separate release gates.

## Candidate validation

1. Run the product CI matrix (Node 22 on macOS/Linux/Windows; Node 24 on Linux).
2. Run the manual public-project acceptance on the packaged build when a release
   changes onboarding/install boundaries. Retain deeper native stress separately.
3. Dispatch **Prepare alpha package (no publication)**. It performs an exact public
   npm registry check, installs/exercises/uninstalls the tarball, and produces the
   tarball, package manifest, and SHA-256 checksum as a private Actions artifact.
4. Inspect the manifest: runtime source/native observer helper, entry points, user
   docs/examples, README/changelog/license only. No local state, private config,
   test installation, corporate material, or historical evidence.
5. Scan the tree and Git history for secrets. Review dependency licenses and
   vulnerabilities. Confirm package name availability/ownership immediately before
   first publication; a registry 404 is not a reservation or proof of publishing rights.

## Explicit release gates

- Confirm the open-source license and copyright holder, then add LICENSE and its
  SPDX identifier. The current UNLICENSED marker is a publication block, not the
  recommended final license.
- Confirm the intended personal npm publisher account, 2FA, and ability to own the
  exact `redue` name. Do not store credentials in this repository or its logs.
- Enable GitHub private vulnerability reporting when the repository becomes public,
  before publishing the package; the private-repository API currently returns 404.
- Obtain explicit approval to change repository visibility and publish the package.
- Remove `private: true`, finalize CHANGELOG date, and review the release commit.
  Repack and revalidate that exact candidate after metadata changes.

## Standard publication, after approval

Use `0.1.0-alpha.0` for the first alpha and increment the prerelease for fixes.
Publish to the `alpha` tag, never silently to `latest`:

```sh
npm pack
npm publish ./redue-0.1.0-alpha.0.tgz --tag alpha --access public
```

The first publish may require the maintainer's interactive npm authentication/2FA.
Do not automate around that control. Once the package exists, configure npm's
GitHub Actions trusted publisher for this owner/repository and one reviewed publish
workflow. Prefer standard OIDC (`id-token: write`) over a long-lived stored token.
Use a current npm CLI meeting npm's trusted-publishing requirements. Automatic
provenance requires a public source repository and public package; private candidate
artifacts must not be represented as having public npm provenance.

Tag the reviewed commit `v0.1.0-alpha.0`, create a GitHub prerelease from CHANGELOG,
and attach the matching tarball, manifest, and checksum. There is intentionally no
publish workflow or write-token release automation before these decisions.

## Rollback

A published version is immutable; fix forward with a new alpha. If necessary,
move the `alpha` dist-tag to a previous tested version and deprecate the defective
version with an actionable message. Do not assume unpublish is possible: npm's
policy restricts it and deletion can disrupt users. Do not delete user evidence.
Users can install an exact prior version; incompatible local state must fail clearly,
not be silently reinterpreted.

References: [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/),
[npm pack](https://docs.npmjs.com/cli/v11/commands/npm-pack/),
[npm unpublish policy](https://docs.npmjs.com/policies/unpublish/).
