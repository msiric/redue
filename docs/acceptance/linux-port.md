# Linux observation boundary

Linux uses an inotify helper behind the shared observation interface. The
evidence engine, plans, immutable outcomes, applicability, and deterministic
reconciliation are shared with macOS.

Overflow, watch loss, root replacement, helper failure, and failed barriers
immediately withhold CURRENT. Recovery reattaches observation and reconciles
content and membership from disk before historical evidence can be CURRENT
again. The helper also observes selected pnpm installed-file inodes. A
synchronized status rehashes those installed inputs, including possible
hard-link aliases; cached status is conservative when it cannot establish that
state. The global pnpm store is not watched.

The supported observation mounts are local ext2/3/4, XFS, Btrfs, F2FS, tmpfs,
and ZFS. Network, FUSE, overlay, and unrecognized mounts remain unavailable.
Python 3 and sufficient inotify watches are required. The current product
acceptance used ext4; the other filesystem entries need further validation.

Linux cancellation signals the verification process group. A check that
deliberately creates a new process session is outside normal cancellation
guarantees. A killed wrapper retains an uncertain lock if child work may
survive; lock age does not clear ownership.
