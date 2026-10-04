# Reproducible terminal demo

From the product checkout with development dependencies installed:

```sh
npm run demo
```

The script packs the candidate, installs it into a fresh user-owned disposable npm
prefix, initializes a small TypeScript checkout, and invokes the installed CLI in
separate processes. It checks actual states and run IDs rather than printing a
prewritten success transcript. It also uninstalls and removes only its resources.

Story: Agent A records a real check; a fresh Agent B process reads inherited evidence;
unrelated docs preserve it; source edits stale it; rerun restores it; stop withholds
applicability; restart reconciles the same receipt. Recording-only PASS stays
UNVERIFIED. These are process roles, not a new claim about coding-agent behavior.

The demo first shows ordinary cached status. Qualified Node checks may need
caller-aware `--sync` before CURRENT can be established. It explicitly shows that
step; do not edit it out of a recording to imply a cheaper decision.

The fixture is a product regression/demo, not one of the accepted real repositories
and not evidence of demand or measured time saved. A GIF/video can be made from this
script later; truthful behavior takes priority over visual polish.
