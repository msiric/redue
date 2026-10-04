# Configuration

Prefer `redue init` over hand-authoring a qualified contract. A typical generated
npm configuration is concise and portable:

```json
{
  "schema": 1,
  "root": ".",
  "packageManager": "npm",
  "checks": [{
    "name": "typecheck",
    "script": "typecheck",
    "kind": "typecheck",
    "qualification": "typescript-noemit-v1",
    "inputs": ["package.json", "package-lock.json", "tsconfig*.json", "src/**"]
  }]
}
```

The exact inputs are derived from the detected project; use the emitted config,
not this example to assert your project's coverage. Generated Yarn/pnpm workspace
checks also identify the owning workspace and actual command. Large dependency
relationships stay in local runtime state. `qualification` selects a supported
validation recipe; it is not a blanket coverage assertion.

Use `--config FILE` to select an external configuration. `root` is relative to
that file. Runtime paths, resolved executables, local evidence, and sockets stay
out of version-controlled configuration.

## Arbitrary commands

An unrecognized ecosystem can still record ordinary execution:

```json
{
  "schema": 1,
  "checks": [{
    "name": "migration",
    "command": ["@node", "tools/check-migrations.mjs"],
    "inputs": ["migrations/**", "tools/check-migrations.mjs"]
  }]
}
```

Commands are exact argv, not shell text. Use `cwd` for a project-relative working
directory. `@node`, `@project`, and `@which:NAME` resolve explicit invocation facts.
Manual checks start recording-only: a plausible list of files is not proof of a
complete input boundary. Do not copy coverage assertions from unrelated projects.

Advanced explicit contracts may declare `generatedInputs`, `installedInputs`, narrow
`allowedExternalRoots`, read-only `probes`, and relevant `environment`. These are
reviewed escape hatches, not onboarding requirements. A coverage rationale cannot
override unsupported storage, unresolved links, missing inputs, or observation failure.

Changing commands, relevant configuration, installed material, or consumed inputs
invalidates prior applicability. It does not erase historical execution outcomes.
