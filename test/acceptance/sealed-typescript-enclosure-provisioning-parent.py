#!/usr/bin/python3
"""Fixed PRE-NATIVE preparation parent. No native/model/compiled-code execution.

One reviewed inner entry, one reviewed Node and unchanged safe environment. This
is a process-lifetime envelope, not a command dispatcher or a native sandbox.
Private preparation mints are lost at child exit; reports never restore them.
"""
import time
_PROCESS_STARTED = time.monotonic()

import hashlib
import errno
import json
import os
from pathlib import Path
import platform
import pwd
import re
import selectors
import signal
import stat
import subprocess
import sys
import uuid

INNER_SHA256 = "cfc72d799e92a86a919deca7df12b711bcaa2f1186a3a8d22929c0ec0ef03223"
NODE_SHA256 = "5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc"
ENTRY_NAME = "sealed-typescript-enclosure-provisioning.mjs"
SCOPE = "FIXED_ENCLOSURE_PREPARATION_PARENT_ONLY"
_FALSE = {"compilerCheckExecutions": 0, "helperExecutions": 0,
          "nativeAgentLaunches": 0, "models": 0, "receiptWrites": 0,
          "recordAdoptionAuthority": False, "sealed": False, "reuseEligible": False,
          "nativeEnforcement": "NOT_ESTABLISHED"}
_UNREAPED = []  # Keep uncertain Popen objects live; no destructor auto-poll.


def require(condition):
    if not condition:
        raise ValueError("PREPARATION_UNKNOWN")


def mark(s):
    return (s.st_dev, s.st_ino, s.st_mode, s.st_uid, s.st_gid,
            s.st_nlink, s.st_size, s.st_mtime_ns, s.st_ctime_ns)


def ancestors(file):
    result = []
    for parent in Path(file).parents:
        s = os.lstat(parent)
        require(stat.S_ISDIR(s.st_mode) and not stat.S_ISLNK(s.st_mode)
                and Path(os.path.realpath(parent)) == parent)
        result.append((str(parent), s.st_dev, s.st_ino, s.st_mode, s.st_uid, s.st_gid))
    return result


def inspect_file(file, owner, limit, expected=None):
    require(str(file) == os.path.realpath(file))
    before = os.lstat(file)
    require(stat.S_ISREG(before.st_mode) and before.st_uid == owner
            and before.st_nlink == 1 and not before.st_mode & 0o6022
            and 0 < before.st_size <= limit)
    lineage = ancestors(file)
    fd = os.open(file, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    try:
        require(mark(os.fstat(fd)) == mark(before))
        h = hashlib.sha256()
        remaining = before.st_size
        while remaining:
            body = os.read(fd, min(65536, remaining))
            require(0 < len(body) <= remaining)
            h.update(body)
            remaining -= len(body)
        require(mark(os.fstat(fd)) == mark(before))
    finally:
        os.close(fd)
    digest = h.hexdigest()
    require((expected is None or digest == expected)
            and mark(os.lstat(file)) == mark(before) and ancestors(file) == lineage)
    return {"file": str(file), "mark": mark(before), "lineage": lineage,
            "sha256": digest, "limit": limit, "owner": owner}


def file_current(row):
    after = inspect_file(row["file"], row["owner"], row["limit"], row["sha256"])
    require(after == row)


def prerequisites():
    uid = os.getuid()
    require(sys.flags.isolated == 1 and sys.flags.no_site == 1)
    require(sys.platform == "darwin" and platform.machine() == "arm64"
            and uid > 0 and uid == os.geteuid() and os.getgid() == os.getegid())
    forbidden = re.compile(r"^(?:NODE_OPTIONS|NODE_PATH|NODE_REPL_EXTERNAL_MODULE|BASH_ENV|ENV)$|^(?:DYLD_|LD_|OPENSSL_)", re.I)
    require(not any(forbidden.search(key) for key in os.environ))
    here = Path(__file__).absolute()
    require(here == here.resolve() and here.name == "sealed-typescript-enclosure-provisioning-parent.py")
    repo = here.parents[2]
    require((repo / "package.json").is_file())
    entry = here.parent / ENTRY_NAME
    node = Path(pwd.getpwuid(uid).pw_dir) / ".nvm/versions/node/v22.13.0/bin/node"
    rows = [inspect_file(here, uid, 65536),
            inspect_file(entry, uid, 65536, INNER_SHA256),
            inspect_file(node, uid, 128 * 1024 * 1024, NODE_SHA256)]
    for row in rows:
        file_current(row)
    return repo, entry, node, rows


def parse_inner(body):
    def unique(pairs):
        value = {}
        for key, item in pairs:
            require(key not in value)
            value[key] = item
        return value
    require(0 < len(body) <= 65536 and body.endswith(b"\n") and body.count(b"\n") == 1)
    value = json.loads(body, object_pairs_hook=unique)
    expected = {"schema", "scope", "profile", "outcome", "reason_code", "failedPhase", "phases", "ownedRootNames", "builds", "buildAttemptCount", "buildResultCount", "observedProcessCount", "compilerBuildOutcome", "newFileDigests", "elapsedMs", "privateMints", "newCodeCurrentness", "nativeIntervalBarrier", "completeSdkClosure", "preMainLoader", *_FALSE.keys()}
    require(type(value) is dict and set(value) == expected and value["schema"] == 1
            and type(value["schema"]) is int and value["scope"] == "FIXED_ENCLOSURE_PROVISIONING_OBSERVATION_ONLY"
            and value["profile"] == "fixed-enclosure-local-sdk27@1"
            and value["outcome"] in ("BUILT_NOT_EXECUTED", "UNKNOWN"))
    require(all(type(value[k]) is type(v) and value[k] == v for k, v in _FALSE.items()))
    require(value["privateMints"] == "PROCESS_LOCAL_NOT_ADOPTABLE_FROM_REPORT"
            and value["newCodeCurrentness"] == "PRE_NATIVE_ENDPOINTS_ONLY"
            and value["nativeIntervalBarrier"] == "NOT_ESTABLISHED"
            and value["completeSdkClosure"] == "NOT_ESTABLISHED"
            and value["preMainLoader"] == "NOT_ESTABLISHED")
    phase_names = {"operationImports", "freshPair", "freshHost", "hostFixture", "prerequisiteBuilds", "prerequisiteCurrent", "pairedSource", "pairedBuilds", "pairedCurrent", "campaignCopies", "copiesCurrent", "oldLauncherBuild", "oldLauncherCurrent", "originalProjection", "preparedNull", "enclosureSource", "enclosureBuilds", "enclosureCurrent", "finalValidation"}
    require(value["reason_code"] in ("PRECONDITION_UNAVAILABLE", "PHASE_UNAVAILABLE", "BUILT_NOT_EXECUTED", "FINAL_REPORT_OR_BUDGET_UNAVAILABLE")
            and value["failedPhase"] in (None, *phase_names)
            and type(value["phases"]) is list and len(value["phases"]) <= 19)
    ordered_phases = ["operationImports", "freshPair", "freshHost", "hostFixture", "prerequisiteBuilds", "prerequisiteCurrent", "pairedSource", "pairedBuilds", "pairedCurrent", "campaignCopies", "copiesCurrent", "oldLauncherBuild", "oldLauncherCurrent", "originalProjection", "preparedNull", "enclosureSource", "enclosureBuilds", "enclosureCurrent", "finalValidation"]
    require([row.get("name") for row in value["phases"]] == ordered_phases[:len(value["phases"])])
    for row in value["phases"]:
        require(type(row) is dict and set(row) == {"name", "elapsedMs", "outcome"}
                and row["name"] in phase_names and row["outcome"] in ("COMPLETED", "UNKNOWN")
                and (row["elapsedMs"] is None or type(row["elapsedMs"]) in (int, float) and 0 <= row["elapsedMs"] < 35000))
    require(type(value["ownedRootNames"]) is list and len(value["ownedRootNames"]) <= 3)
    for row in value["ownedRootNames"]:
        require(type(row) is dict and set(row) == {"role", "name"}
                and row["role"] in ("A", "B", "H") and re.fullmatch(r"redue-ci-recipient-[a-f0-9]{8}", row["name"]))
    require([row["role"] for row in value["ownedRootNames"]] == ["A", "B", "H"][:len(value["ownedRootNames"])]
            and len({row["name"] for row in value["ownedRootNames"]}) == len(value["ownedRootNames"]))
    require(type(value["builds"]) is list and len(value["builds"]) <= 8)
    for row in value["builds"]:
        require(type(row) is dict and set(row) == {"pidObserved", "status", "signal", "spawnError", "completed", "stdoutBytes", "stderrBytes"}
                and type(row["pidObserved"]) is bool and type(row["completed"]) is bool
                and (row["status"] is None or type(row["status"]) is int and 0 <= row["status"] <= 255)
                and row["signal"] in (None, "SIGKILL", "SIGTERM", "SIGABRT", "SIGSEGV", "SIGBUS", "SIGILL", "SIGINT", "UNKNOWN")
                and row["spawnError"] in ("NONE", "UNKNOWN")
                and all(type(row[k]) is int and 0 <= row[k] <= 9007199254740991 for k in ("stdoutBytes", "stderrBytes")))
    for key in ("buildAttemptCount", "buildResultCount", "observedProcessCount"):
        require(type(value[key]) is int and 0 <= value[key] <= 8)
    require(value["buildResultCount"] == len(value["builds"])
            and value["observedProcessCount"] == sum(row["pidObserved"] for row in value["builds"])
            and value["compilerBuildOutcome"] in ("EXIT_ZERO", "EXIT_NONZERO", "UNKNOWN"))
    require(type(value["newFileDigests"]) is list and len(value["newFileDigests"]) <= 6)
    for row in value["newFileDigests"]:
        require(type(row) is dict and set(row) == {"index", "sha256"}
                and type(row["index"]) is int and 0 <= row["index"] < 6
                and re.fullmatch(r"[a-f0-9]{64}", row["sha256"]))
    require([row["index"] for row in value["newFileDigests"]] == list(range(len(value["newFileDigests"]))))
    require(value["elapsedMs"] is None or type(value["elapsedMs"]) in (int, float) and 0 <= value["elapsedMs"] < 35000)
    if value["outcome"] == "BUILT_NOT_EXECUTED":
        require(type(value["elapsedMs"]) in (int, float) and 0 <= value["elapsedMs"] < 30000)
        require(value["buildAttemptCount"] == value["buildResultCount"] == value["observedProcessCount"] == 8
                and value["compilerBuildOutcome"] == "EXIT_ZERO"
                and all(row["completed"] and row["status"] == 0 and row["signal"] is None and row["spawnError"] == "NONE" for row in value["builds"])
                and len(value["newFileDigests"]) == 6 and len(value["phases"]) == 19
                and all(row["outcome"] == "COMPLETED" for row in value["phases"]))
    return value


def cleanup_error_classification(error):
    # Fixed exception classes and errno names only. Never serialize a message,
    # repr/type name, PID, path, environment or arbitrary numeric error value.
    families = {ProcessLookupError: "PROCESS_LOOKUP_ERROR", PermissionError: "PERMISSION_ERROR",
                OSError: "OS_ERROR", InterruptedError: "INTERRUPTED_ERROR",
                BlockingIOError: "BLOCKING_IO_ERROR", TimeoutError: "TIMEOUT_ERROR",
                FileNotFoundError: "FILE_NOT_FOUND_ERROR", TypeError: "TYPE_ERROR",
                ValueError: "VALUE_ERROR", OverflowError: "OVERFLOW_ERROR",
                SystemError: "SYSTEM_ERROR", RuntimeError: "RUNTIME_ERROR"}
    family = families.get(type(error), "OTHER_EXCEPTION")
    os_errors = {ProcessLookupError, PermissionError, OSError, InterruptedError,
                 BlockingIOError, TimeoutError, FileNotFoundError}
    if type(error) not in os_errors:
        return family, "NOT_PRESENT"
    code = error.errno
    if code is None:
        return family, "NOT_PRESENT"
    allowed = {getattr(errno, key): key for key in
               ("EPERM", "EACCES", "ESRCH", "EINVAL", "EINTR", "EIO", "EFAULT", "EBADF", "ENOSYS", "EOVERFLOW")}
    return family, allowed.get(code, "UNKNOWN") if type(code) is int else "UNKNOWN"


def collect(child, clock=time.monotonic, selector_factory=selectors.DefaultSelector,
            read=os.read, killpg=os.killpg, started=None):
    """Fixed process envelope; injection is for source/mock tests only.

    Never poll/wait/communicate before destructive cleanup. The Popen PID stays
    reserved until the ONE killpg attempt and subsequent wait/reap. Popen's
    start_new_session establishes its own PGID before fixed child exec.
    """
    began = started
    last = began
    output, error = bytearray(), bytearray()
    selector = None
    owned_pid = None
    reaped = False
    kill_attempted = False
    cleanup_signal = "NOT_ATTEMPTED"
    cleanup_exception_family, cleanup_errno = "NONE", "NONE"
    reason = "UNKNOWN"
    code = None
    inner = None
    try:
        require(type(child.pid) is int and 0 < child.pid <= 2147483647)
        owned_pid = child.pid
        if began is None:
            began = clock()
        last = began
        selector = selector_factory()
        for stream, role in ((child.stdout, "out"), (child.stderr, "err")):
            os.set_blocking(stream.fileno(), False)
            selector.register(stream, selectors.EVENT_READ, role)
        while selector.get_map():
            now = clock()
            require(now >= last)
            last = now
            if now - began >= 30:
                reason = "BODY_DEADLINE"
                break
            for key, _ in selector.select(min(0.1, max(0, 30 - (now - began)))):
                try:
                    block = read(key.fileobj.fileno(), 4096)
                except BlockingIOError:
                    continue
                if not block:
                    selector.unregister(key.fileobj)
                    continue
                selected, limit = (output, 65536) if key.data == "out" else (error, 4096)
                if len(block) > limit - len(selected):
                    reason = "OUTPUT_LIMIT"
                    raise ValueError("OUTPUT_LIMIT")
                selected.extend(block)
        else:
            reason = "BOTH_EOF"
    except Exception:
        if reason == "UNKNOWN":
            reason = "COLLECTION_UNAVAILABLE"
    finally:
        try:
            body_end = clock()
            require(began is not None and body_end >= last)
            if body_end - began >= 30:
                reason = "BODY_DEADLINE"
        except Exception:
            reason = "CLOCK_UNAVAILABLE"
        # No wait/poll/communicate has occurred: the child PID still reserves
        # this start_new_session PGID. Never issue a second destructive signal.
        try:
            require(owned_pid is not None)
            kill_attempted = True
            killpg(owned_pid, signal.SIGKILL)
            cleanup_signal = "SENT"
        except ProcessLookupError as cleanup_error:
            cleanup_signal = "GROUP_ALREADY_ABSENT"
            cleanup_exception_family, cleanup_errno = cleanup_error_classification(cleanup_error)
        except Exception as cleanup_error:
            cleanup_signal = "UNKNOWN"
            cleanup_exception_family, cleanup_errno = cleanup_error_classification(cleanup_error)
        try:
            require(owned_pid is not None and kill_attempted)
            remaining = 5.0 if began is None else max(0.0, min(5.0, began + 35 - clock()))
            code = child.wait(timeout=remaining)
            reaped = True
        except Exception:
            _UNREAPED.append(child)
        for stream in (child.stdout, child.stderr):
            try:
                stream.close()
            except Exception:
                reason = "STREAM_CLOSE_UNAVAILABLE"
        if selector is not None:
            try:
                selector.close()
            except Exception:
                reason = "SELECTOR_CLOSE_UNAVAILABLE"
    # No destructive PID or PGID operation is allowed after wait releases PID.
    absent = False
    if reaped:
        try:
            killpg(child.pid, 0)
        except ProcessLookupError:
            absent = True
        except Exception:
            pass
    try:
        elapsed = clock() - began
        require(elapsed >= 0)
    except Exception:
        elapsed = 35000
        reason = "CLOCK_UNAVAILABLE"
    try:
        inner = parse_inner(bytes(output))
    except Exception:
        pass
    normal = (reason == "BOTH_EOF" and kill_attempted
              and cleanup_signal in ("SENT", "GROUP_ALREADY_ABSENT") and reaped
              and absent and code in (0, 74) and len(error) == 0 and elapsed < 35)
    success = normal and code == 0 and inner is not None and inner["outcome"] == "BUILT_NOT_EXECUTED"
    if not success and reason == "BOTH_EOF":
        if not reaped or not absent or cleanup_signal == "UNKNOWN":
            reason = "OWNED_CLEANUP_UNKNOWN"
        elif isinstance(code, int) and code < 0:
            reason = "CHILD_SIGNAL_OBSERVED"
        elif error:
            reason = "STDERR_OBSERVED"
        elif inner is None:
            reason = "CHILD_PROTOCOL_UNAVAILABLE"
        elif code not in (0, 74):
            reason = "CHILD_EXIT_NOT_ACCEPTED"
        else:
            reason = "INNER_PREPARATION_UNKNOWN"
    return {"schema": 1, "scope": SCOPE, "outcome": "BUILT_NOT_EXECUTED" if success else "UNKNOWN",
            "reason_code": "PREPARATION_OBSERVED" if success else reason,
            "childReaped": reaped, "childExitCode": code if isinstance(code, int) and code >= 0 else None,
            "childSignal": -code if isinstance(code, int) and code < 0 else None,
            "cleanupSignal": cleanup_signal, "cleanupExceptionFamily": cleanup_exception_family,
            "cleanupErrno": cleanup_errno, "groupAbsentAfterReap": absent,
            "stdoutBytes": len(output), "stderrBytes": len(error), "elapsedMs": elapsed * 1000,
            "innerReport": inner, **_FALSE}


def prepare_record_directory(repo):
    """Only the fixed owned .local/portable-evidence namespace, before child."""
    uid = os.getuid()
    snapshot = []
    for part in (repo / ".local", repo / ".local" / "portable-evidence"):
        try:
            os.mkdir(part, 0o700)
        except FileExistsError:
            pass
        s = os.lstat(part)
        require(str(part) == os.path.realpath(part) and stat.S_ISDIR(s.st_mode)
                and s.st_uid == uid and not s.st_mode & (0o077 if part.name == "portable-evidence" else 0o022))
        snapshot.append((str(part), (s.st_dev, s.st_ino, s.st_mode, s.st_uid, s.st_gid), ancestors(part)))
    record_directory_current(snapshot)
    return snapshot


def record_directory_current(snapshot):
    require(type(snapshot) is list and len(snapshot) == 2)
    for file, before, lineage in snapshot:
        s = os.lstat(file)
        require(stat.S_ISDIR(s.st_mode) and not stat.S_ISLNK(s.st_mode)
                and os.path.realpath(file) == file
                and (s.st_dev, s.st_ino, s.st_mode, s.st_uid, s.st_gid) == before
                and ancestors(file) == lineage)


def save_record(repo, report, rows, directory_snapshot):
    uid = os.getuid()
    record_directory_current(directory_snapshot)
    file = repo / ".local" / "portable-evidence" / ("enclosure-preparation-" + str(uuid.uuid4()) + ".json")
    value = {**report, "sourceIdentities": [{"sha256": row["sha256"]} for row in rows],
             "sourceIdentityScope": "PRELAUNCH_OBSERVED_ONLY",
             "persistenceStatus": "PRE_FINAL_SNAPSHOT_ONLY",
             "finalParentCompletion": "NOT_ESTABLISHED_BY_SAVED_SNAPSHOT"}
    body = (json.dumps(value, separators=(",", ":"), allow_nan=False) + "\n").encode()
    require(len(body) <= 131072)
    fd = os.open(file, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW | os.O_NONBLOCK, 0o600)
    try:
        before = os.fstat(fd)
        require(stat.S_ISREG(before.st_mode) and before.st_uid == uid and before.st_nlink == 1
                and stat.S_IMODE(before.st_mode) == 0o600 and before.st_size == 0)
        at = 0
        while at < len(body):
            count = os.write(fd, body[at:])
            require(count > 0)
            at += count
        os.fsync(fd)
        saved = os.fstat(fd)
        require(saved.st_size == len(body) and mark(os.lstat(file)) == mark(saved))
    finally:
        os.close(fd)
    record_directory_current(directory_snapshot)
    readback = inspect_file(file, uid, 131072, hashlib.sha256(body).hexdigest())
    require(mark(os.lstat(file)) == readback["mark"])
    record_directory_current(directory_snapshot)
    return str(file), readback["sha256"]


def emit_final(value):
    body = json.dumps(value, separators=(",", ":"), allow_nan=False)
    require(len(body.encode()) <= 65536)
    print(body)


def unknown_with_observations(report, reason):
    observed = {}
    for key in ("childReaped", "childExitCode", "childSignal", "cleanupSignal",
                "cleanupExceptionFamily", "cleanupErrno", "groupAbsentAfterReap", "stdoutBytes", "stderrBytes", "elapsedMs",
                "finalSourceCurrentness"):
        if key in report:
            observed[key] = report[key]
    # Only the already validated, fixed redacted schema is retained. No captured
    # byte stream/error text/source/environment/credential is serialized here.
    inner = report.get("innerReport")
    if inner is not None:
        try:
            observed["innerReport"] = parse_inner((json.dumps(inner, allow_nan=False) + "\n").encode())
        except Exception:
            pass
    return {"schema": 1, "scope": SCOPE, "outcome": "UNKNOWN", "reason_code": reason,
            "recordPersistence": "UNKNOWN", "savedRecord": "NOT_ESTABLISHED",
            "finalParentCompletion": "NOT_ESTABLISHED", "observed": observed, **_FALSE}


def main():
    if sys.argv[1:] != ["--run"]:
        print(json.dumps({"scope": SCOPE, "outcome": "NOT_SELECTED", **_FALSE}))
        return 0
    begun = _PROCESS_STARTED
    report = {"schema": 1, "scope": SCOPE, "outcome": "UNKNOWN", "reason_code": "PRECONDITION_UNAVAILABLE", **_FALSE}
    phase = "PRECONDITIONS"
    try:
        repo, entry, node, rows = prerequisites()
        directory_snapshot = prepare_record_directory(repo)
        require(time.monotonic() - begun < 30)
        # No shell, credentials, settings or environment rewriting. The child
        # receives the existing safe environment unchanged, including proxies.
        child = subprocess.Popen([str(node), str(entry), "--fixed-preparation-child"], cwd=repo,
                                 env=os.environ.copy(), stdin=subprocess.DEVNULL,
                                 stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                 start_new_session=True, close_fds=True)
        # Include parent preflight/import/startup work in the original budget.
        report = collect(child, started=begun)
        phase = "POST_COLLECTION"
        require(time.monotonic() - begun < 35)
        try:
            for row in rows:
                file_current(row)
            report["finalSourceCurrentness"] = "ENDPOINTS_OBSERVED"
        except Exception:
            report.update(outcome="UNKNOWN", reason_code="SOURCE_CURRENTNESS_UNAVAILABLE", finalSourceCurrentness="UNKNOWN")
        phase = "PERSISTENCE"
        file, digest = save_record(repo, report, rows, directory_snapshot)
        require(time.monotonic() - begun < 35)
        emit_final({"scope": SCOPE, "outcome": report["outcome"], "reason_code": report["reason_code"],
                    "record": file, "sha256": digest, **_FALSE})
        return 0 if report["outcome"] == "BUILT_NOT_EXECUTED" else 74
    except Exception:
        reason = "PRECONDITION_UNAVAILABLE" if phase == "PRECONDITIONS" else "PERSISTENCE_UNAVAILABLE" if phase == "PERSISTENCE" else "POST_COLLECTION_UNAVAILABLE"
        emit_final(unknown_with_observations(report, reason))
        return 74


if __name__ == "__main__":
    sys.exit(main())
