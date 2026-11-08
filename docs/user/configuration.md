# Configuration

Prefer `redue init` over hand-authoring a contract. An ordinary generated npm script (recording-only in this candidate)
configuration is concise and portable:

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

For the explicit direct compiler choice and generated exact argv, see
[direct TypeScript](direct-typescript.md). Existing script receipts cannot satisfy it.
A general check (`"qualification": "node-script-v1"`) has a `script` and no
`command`; see the [general recipe](node-script.md).

## End-of-turn check

With Claude Code, REDUE's hook checks at the end of each agent turn: when the
turn changed files and the work made a check due, it asks the agent once to run
`redue verify` before it finishes ([agents](agents.md)). To turn this off,
add `"endOfTurnCheck": false` at the top level of the config. Only the hook
reads it; the observer does not need a restart.

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

A chained typecheck script gets one generated check per `tsc` run, all with
the script's name (see [script forms](direct-typescript.md#script-forms)). A
proposed check for a project without a typecheck script has no `script`.

Input patterns are relative to the project root. They cannot name a `.git`
directory, because REDUE does not observe one; `!.git/**` is fine.

A pattern takes the files git ignores only beneath its fixed directory (`dist/**`
takes all of `dist/`); a pattern such as `**` or `**/*.ts` does not take them,
when the observer starts or when one changes later, so a build or test that
writes git-ignored output (`dist/`, `build/`) leaves such checks as they were.
A sandboxed check that runs with the git-ignored files (`sandbox-v1`) takes them
all. A general or direct test run that reads a git-ignored file REDUE does not
observe is UNVERIFIED; the direct TypeScript recipe's probe content-checks every
file the compiler reads.

Changing commands, relevant configuration, installed material, or consumed inputs
invalidates prior applicability. It does not erase historical execution outcomes.

Installed inputs (under `node_modules` or other installed roots) are observed by
file identity: inode, size, mode, link count, and modification and change times.
REDUE does not read every installed file, so large installations become ready
quickly. Any write to an installed file makes dependent checks STALE until they
run again, even when it restores earlier bytes, reinstalls identical packages
(`npm ci`), copies the installation, or remounts it under another device. Timestamps tick in milliseconds, so a file
changed in the last 2 seconds could be rewritten at the same size without a new
identity; `redue run` waits until such files are 2 seconds old before it records
a checkpoint, which adds up to 2 seconds right after an install. Source files are
content-hashed, and the direct TypeScript recipe's probe content-checks every file
the compiler reads. The 2-second window assumes the filesystem clock matches this
machine's; on a network or VM-shared mount whose clock runs behind, keep the
installation on a local disk.
