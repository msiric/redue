# Managed Bash profile source prerequisite — DIR-068

The fixed startup witness now requires metadata-only absence of
`/private/var/db/ManagedConfigurationFiles/com.apple.bash/etc/profile`.
Apple Bash can select this file before the pinned `/etc/profile`; pinning the
stock profile and supplying an empty HOME do not close that source.

The primary basis is Apple `bash-144`, commit
`51bf3fc6f26e9517c3a2e4bc3d208f9b39b87178`:

- [pathnames.h.in](https://github.com/apple-oss-distributions/bash/blob/51bf3fc6f26e9517c3a2e4bc3d208f9b39b87178/bash-3.2/pathnames.h.in)
  defines the literal managed path under `__APPLE__`.
  SHA256: `bdd2f209f4503cfdaede9f603692e6807e6574fce2142f1feab3424d0695939a`.
- [shell.c](https://github.com/apple-oss-distributions/bash/blob/51bf3fc6f26e9517c3a2e4bc3d208f9b39b87178/bash-3.2/shell.c)
  uses `access(MANAGED_SYS_PROFILE, F_OK)` under
  `__APPLE__ && TARGET_OS_OSX` in both the noninteractive login and interactive
  login startup branches, preferring the managed file when present.
  SHA256: `41e86baac3861152e77e479dac988d80f42bffa467ef42c3c10a1ea04a48c542`.

Only ENOENT establishes the required absence. A file, directory, symlink or
metadata error produces UNKNOWN without opening the managed source. The guard
runs before startup body inspection/provisioning, around each currentness state
scan and after final namespace checks. A failed minted witness stays invalid
after removal or restored access. Interpretation advances to
`redue-native187-isolated-bash-startup@3`; no binary pins change.

This is a source prerequisite correction with in-memory controls. It does not
assert that a managed profile existed during historical native diagnostics or
rewrite their scoped observations. It establishes no actual shell behavior,
native enforcement, pre-main confinement, seal or reuse authority.

Apple's published [macOS 26.5 manifest](https://github.com/apple-oss-distributions/distribution-macOS/blob/83390100289cedfe669c31a96c94326d31afa1ed/release.json)
maps Bash to `bash-144` and shell commands to `shell_cmds-329`. The observed
runner image is macOS 26.6.2, build 25G83; this earlier manifest is source context,
not proof of the runner binaries' complete implementation. Inventory38555298834
observed different Bash/path_helper hashes and approved neither a host profile
nor their startup behavior. The current inventory executes fixed xcrun queries
and hashes public files; it does not execute Bash or path_helper.
