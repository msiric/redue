# Contributing

Use Node 22 or 24 and npm. Linux additionally requires Python 3 and a supported
native filesystem for observation tests.

```sh
npm ci
npm test
npm run test:package
```

`npm test` installs the pinned TypeScript 5.5.2 test fixture in its own package
before running the suites. It does not share `node_modules/.bin` with the main
TypeScript 5.6.3 development dependency. To run individual compiler tests after
`npm ci`, run `npm run pretest` once first. Both lockfiles use public npm URLs;
no global registry configuration is required.

There is no transpilation/build step. `npm pack` builds the distributable tarball.
Tests use disposable repositories and owned state. Do not run destructive acceptance
against personal/corporate checkouts or shared package stores.

Keep immutable execution outcomes, applicability, and reuse eligibility separate.
Observation uncertainty must withhold CURRENT; reconciliation is the fallback when
event history cannot be trusted. Add focused regressions for behavior changes.

The normal CI matrix runs fixture regressions and tarball installation on macOS,
Linux, and Windows. Manual acceptance workflows retain deeper native stress and
pinned public-repository tests. They are not run for every PR.

See [architecture](docs/contributor/architecture.md), [release preparation](docs/contributor/releasing.md),
and [security reporting](SECURITY.md). Do not attach private source, runtime receipts,
configuration bodies, credentials, or raw logs from work repositories to issues.
