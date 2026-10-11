# One installed portable-evidence cost sample

Status: first attempt stopped at a harness precondition; complete-path sample
not yet established. The root ccba93d attempt stopped before portable recording:
the shipped runtime correctly declares cwd as ".", while the harness expected an
absolute string. Its failure JSON/stderr and all preceding setup-command timings
are retained privately; portable-workflow and model launches were zero. Source
`bin/redue.mjs` retains the selected relative cwd and `src/declared-plan.mjs`
resolves it against the root. The corrected harness requires a nonempty declared
string whose resolved physical directory is exactly the canonical owned root;
root/state/compiler identity checks stay intact. One justified rerun requires
independent review; this is not a product/economics failure or a score retry.

Original sample predeclaration follows. This is a controlled same-machine `noLib` mechanics
sample, not the public debugger workload, agent adoption, two-machine acceptance
or a benchmark distribution. No model or permission change is involved. Existing
installed-smoke behavior remains the default; `--economics` explicitly adds the
required rerun and restart checks.

Use the preserved d04b872 exact task-candidate tarball, SHA-256
`8695b612a5c33dae945b2bc8df57cd68ca3eefb401aa0ef9ca2850d212979ea2`.
Its alpha.10 metadata does **not** identify the public alpha.10 bytes. Do not repack
or replace it for this sample. Run once after independent source review and root
integration; retain failures instead of retrying for a favorable result:

```sh
node test/acceptance/portable-installed-smoke.mjs \
  --tarball PRESERVED_D04_TARBALL \
  --sha256 8695b612a5c33dae945b2bc8df57cd68ca3eefb401aa0ef9ca2850d212979ea2 \
  --source d04b872 --baseline @redue/cli@0.1.0-alpha.10 --economics
```

The fixed sequence is portable recorded execution and final query; export
preview/export/inspection; explicit digest import preview/apply in a fresh checkout;
caller-aware eligible query; conservative cached inspection; unrelated edit/query;
relevant edit/STALE query; ordinary configured recorded compiler rerun and final
query; observer stop/start and inherited local-evidence query. The rerun is not
silently given portable capture. Source outcomes and imported history must remain
unchanged; only the owned disposable experiment is removed after assertions.

Two plain `node LOCAL_TYPESCRIPT/lib/tsc.js --noEmit` commands measure the same
initial and relevant-edit obligations. The selected config must exactly match the
direct compiler tokens first, and the owned runtime snapshot must bind the same
Node executable, exact installed entry/argv, qualification, root, working directory
and state. The baseline executes that resolved configured command. The initial plain command runs before portable
recording and the relevant plain command after the entire sequence; normal caches,
inputs and process environment stay unchanged. That order is visible, not a
randomized or matched agent-task comparison. The existing old-receipt and policy
upgrade controls run separately before the measured sequence.

The report retains each executed command's stable phase, project role, scope,
elapsed time, exit status and bounded error code, including expected refusals and
cleanup. The policy-upgrade helper is an inclusive child-process measurement;
its internal commands are not separately profiled or added again. Setup/control/
cleanup costs remain visible. Complete workflow wall time is measured directly;
verification-command time is the sum of actual disjoint commands, not medians.
The two plain compiler costs are reported separately. Comparing these costs does
not assume every inspection avoided another verification execution. Model/tool
transport and whole-task benefit remain NOT MEASURED/NOT ESTABLISHED. One sample
cannot establish tail reliability, typical reuse frequency or practical savings.
