# Reproducible terminal demo

From the product checkout with development dependencies installed:

```sh
npm run demo
```

The script packs the candidate, installs it into a fresh user-owned disposable npm
prefix, initializes a small TypeScript checkout, and invokes the installed CLI in
separate processes. It checks actual states and run IDs rather than printing a
prewritten success transcript. It also uninstalls and removes only its resources.

The alpha.5 candidate demo explicitly selects the direct local compiler recipe.
It shows real compiler evidence, inherited CURRENT, preservation after unrelated
documentation, STALE after source edits, fresh evidence after rerun, and restart
reconciliation. Ordinary npm-launcher evidence remains UNVERIFIED. These are CLI
process roles, not new coding-agent behavior claims. Actual finite Codex trials
are reported separately in the agent-activation acceptance document.

The fixture is a product regression/demo, not one of the accepted real repositories
and not evidence of demand or measured time saved. A GIF/video can be made from this
script later; truthful behavior takes priority over visual polish.
