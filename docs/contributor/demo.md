# Reproducible terminal demo

From the product checkout with development dependencies installed:

```sh
npm run demo
```

The script packs the candidate, installs it into a fresh user-owned disposable npm
prefix, initializes a small TypeScript checkout, and invokes the installed CLI in
separate processes. It checks actual states and run IDs rather than printing a
prewritten success transcript. It also uninstalls and removes only its resources.

The alpha.4 npm demo shows real execution and inherited historical outcomes.
It deliberately remains UNVERIFIED after success, edits and restart because the
retired npm-launcher contract lacks remote/cache/time coverage. It does not
show reusable npm CURRENT. Separate positive generic, Yarn and pnpm regression
contracts continue to cover CURRENT, preservation, STALE and reconciliation.
These are CLI process roles, not new coding-agent behavior claims.

The fixture is a product regression/demo, not one of the accepted real repositories
and not evidence of demand or measured time saved. A GIF/video can be made from this
script later; truthful behavior takes priority over visual polish.
