# Engineering acceptance evidence

These documents preserve the measured development history. Dated conclusions are
historical; the current public support boundary is in [supported projects](../user/supported-projects.md).
No private checkout or corporate configuration belongs here.

- [Agent activation candidate and bounded Vitest investigation](agent-activation.md)
- [Alpha release gate](alpha-release-gate.md)
- [Alpha productization](alpha-productization.md)
- [Yarn workspace](yarn-workspace-acceptance.md)
- [pnpm](pnpm-alpha-acceptance.md)
- [Linux](linux-port.md)
- [Windows port](windows-port-progress.md)
- [Windows decision economics and repeatability](windows-decision-path.md)

The Windows baseline accepted at `ef1f89c` includes repeated native suites, root
replacement stress, nine public npm/Yarn/pnpm workflows, and Windows 11 ARM64/NTFS
smoke. It establishes alpha support, not universally cheaper decisions.
The original performance measurements remain unchanged.
