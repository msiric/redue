#!/usr/bin/python3
"""Two fixed routes: --run preparation (60s body + <=5s cleanup, 65s total),
--native-run diagnostic (115s work + <=5s cleanup, 120s total), both from the
original process/job start. Sync filesystem calls are checked at boundaries,
not OS-interruptible. No supplied command/path or restored private authority.
Node-group closure never establishes detached native Bash descendant closure.
"""
import time
_PROCESS_STARTED = time.monotonic()
_PROCESS_STARTED_WALL_MS = int(time.time() * 1000)

import hashlib
import errno
import json
import math
import os
from pathlib import Path
import platform
import pwd
import re
import selectors
import select
import signal
import stat
import subprocess
import sys
import uuid

INNER_SHA256 = "f46bb06767a23e8e8eb52aa5a1ab6ff4378aef22fb8d036892d3cdd7fc7c4906"
ENCLOSURE_REFUSAL_STAGES = ("OPTIONS", "ORIGINAL_DERIVATION", "PREPARED_NULL_CURRENT", "INITIAL_ORIGINAL_CURRENT", "PROJECTION_INTERPRETATION", "CAMPAIGN_RENDER", "DERIVED_BINDINGS", "COLLECTOR_FUNCTION_PIN", "C_TEMPLATE_READ", "COLLECTOR_TEMPLATE_READ", "LAUNCHER_REBIND", "ENCLOSURE_REBIND", "FINAL_ORIGINAL_CURRENT", "SOURCE_RESULT")
ORIGINAL_CURRENT_REFUSAL_STAGES = ("DERIVATION", "PROJECTION_CURRENT", "PREPARED_NULL_CURRENT", "PROJECTION_RESULT", "PREPARED_NULL_RESULT", "C_SOURCE_READ", "C_SOURCE_IDENTITY", "COLLECTOR_SOURCE_READ", "COLLECTOR_SOURCE_IDENTITY", "C_SOURCE_NAMED", "COLLECTOR_SOURCE_NAMED")
NODE_SHA256 = "5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc"
ENTRY_NAME = "sealed-typescript-enclosure-provisioning.mjs"
SCOPE = "FIXED_ENCLOSURE_PREPARATION_PARENT_ONLY"
PARENT_SOURCE_LIMIT = 131072  # Only this owned, reviewed Python source file.
NATIVE_ENTRY_NAME = "sealed-typescript-native-enclosure-child.mjs"
NATIVE_ENTRY_SHA256 = "231ab81534dea2565b0f5bb547a6de827409e7f3f1e4ed4394c99fb175d31ff3"
# Finite reviewed literal JS import closure. No runtime graph or path selector.
NATIVE_SOURCE_PINS = (
    ("portable-claude-diagnostic.mjs", "239111f87bbe1ae229ba83127c3ce174333179b76f1bc7da2eb9f907bb007d5a"),
    ("portable-claude-invocation.mjs", "58a09a206c1fe1532999abd7c0f5278cce63594a6cc832d20ef001dc0843024e"),
    ("portable-claude-native-profile.mjs", "5feec095db8bbf22ee4fa23082d89ed6824e7b777238e2d0854d53d1e2a4169f"),
    ("portable-native-diagnostic-assets.mjs", "0318a5aead13de956dbcfeea4bc4041947a7d69c4e1803887ef73112472e4836"),
)
NATIVE_SEALED_SOURCE_PINS = (
    ("base-collector-copies.mjs", "70b129684c8896e7f7e1c4b134b46a29f9f84818f10c8b7e65a094b1579cc699"),
    ("base-collector-source.mjs", "88b60905f59af6aedf62d80492bacc8e60ee8c58b1ed45d2abeed4c03a19c421"),
    ("base-exchange-assets.mjs", "d2c8a0c1720c0869537e58a748444e5bb3e6a64da7e789005dfa5adc0f99a6de"),
    ("base-exchange-pair.mjs", "1eb18eaa4768ece210afcdea400d88fedf1408adf7ffec4caf190109ae403196"),
    ("base-exchange-result.mjs", "be2d30edf40597f52a6a9e919b5a3ee26e15bf0dc9f942badda0fb54db10b05d"),
    ("base-exchange-source.mjs", "1a66abed15ecff05ee41266ff3e3a5230fc109164a0e74ecafce83525d1c16f6"),
    ("claude-policy.mjs", "d19957530cd238ea2f1b3b7b7ae95f5d7ccc65f457fb3763edef85a1e844407d"),
    ("closed-read-policy.mjs", "d171a31ea942d81f7f93134a26f73bf0b1ccb826edf9bcb878debd82f3397f3d"),
    ("enclosure-provisioning.mjs", "f46bb06767a23e8e8eb52aa5a1ab6ff4378aef22fb8d036892d3cdd7fc7c4906"),
    ("fixed-campaign-copies.mjs", "06380846f206a66100c7b5216f969ae55fc8ee2188449e8183e81f8827132a59"),
    ("fixed-campaign-enclosed-collector.mjs", "a15fee9374767e14483575264bcfa85732d90eab503c8a1f2b770c5156395878"),
    ("fixed-campaign-enclosure-build.mjs", "5c3c920e755b6c107622ec4eb2b98fcc1ceb189c71d26a6ab8b60e0e3dd1d299"),
    ("fixed-campaign-enclosure-source.mjs", "cd0ae0b719f1a1fff6ef410a56c2b5e10485fd2b560e23a6848c23eb6de70ffd"),
    ("fixed-campaign-launcher-source.mjs", "e1c9ca3dbfbeccc187015a3c78061166a5f4c494f4389d0dc4622a6424c113c5"),
    ("fixed-campaign-prepared-null-source.mjs", "9403878927795fd0a3d176d438e767a85a507adab5e20a5df9267d8dc26f73e6"),
    ("fixed-campaign.mjs", "9984ffa1719401dd5cf3ab2b10313d8e9606524fac361905d31fb14172860f21"),
    ("map-result.mjs", "d19e3d1f33394b74c2771207d24ed3697ba1665e1e0d5f49564ecb80e0dcce13"),
    ("native-assets-build.mjs", "ee28e073c9019fb537e98777db1aeedeac65d99b8951aa6ed0a154acd18fc75b"),
    ("native-assets-proposal.mjs", "9ae0d2a89045fba1645909e9ecf26c5b505187ded255f8d110de4654003debe3"),
    ("native-base-command.mjs", "fd34d5ad1eb2f252c18aaa3130dd3db08c7f03fdf6e7f17b1b0db0ea63a12a14"),
    ("native-enclosure-command.mjs", "0b1e4fa3ad93eb511140fc352d04d7645cd953108cd7a69019402a1e1ed58178"),
    ("native-enclosure-startup.mjs", "a942b2f0dbfc99e7390f7d1320a1b179bf280a474e94d9c09181e6e5d73d0c01"),
    ("native-enclosure-trace.mjs", "e03ef28fe63604a182e897933a50cf1300ced7c7244174ed25e023ab5b0a866e"),
    ("native-startup-witness.mjs", "61eeb17831e5b2641078bb520a42b8baa81d74f0cb0e5a7695cf0b306eb3439f"),
    ("native-stdio-build.mjs", "2056ac09bccde1e7ec1f053a389bc05f2f08f696c9152ab5ea452e75cbd9f3e9"),
    ("native-stdio-direct-trace.mjs", "f6fc4cc8db70f5db08019c7a5924a8b537933ecb6eaf127a1eb22fb159291777"),
    ("native-stdio-probe.mjs", "8ac2b29ad0e31e98611821baeddc011869bf590d9e3d51337c7f35152b53f4c6"),
    ("native-stdio-startup.mjs", "ae74c7492f162708807e455b1d8676354e7eb5b23a90340a281c8c6c49a7a025"),
    ("paired-canary-policy.mjs", "45cd4884696768fe272d811887f094e0ba41f3eb29b1d8b189e3c5a546797362"),
    ("paired-stage-source.mjs", "5a101d8a13a1d0c1d299d38d9672f57605d0e6ff8f8f292dc45641528d889c39"),
    ("stage-exchange-result.mjs", "dc86c11a62ef22563d63ea0541185b86b14910a029c67c9b3f58eec4a52b6654"),
    ("stage-result.mjs", "7c6f7685314deeac8de6974604b0dae8154286262e0e2cbc7a6fda41a84e6813"),
    ("synthetic-fixture.mjs", "928f851d202999c2b3001a0bcfce9e354f6cc62bd5f7568bb5d48a1d487f46b0"),
)
NATIVE_ROOT_SOURCE_PINS = (
    ("src/decision-profile.mjs", "6890fec7b8800d150f284bf6a7b8dcfb5029baf6af9eb93e0e78dd6554e97d13"),
    ("src/portable-envelope.mjs", "3a10d9546b5b71ceb99121412471f250676cb71a2c943532ddec39a3ac836482"),
)
NATIVE_SCOPE = "FIXED_NATIVE_ENCLOSURE_PARENT_DATA_ONLY"
_NATIVE_FALSE = {"publicDataOnly": True, "nativeAuthenticated": False, "nativeEnforcement": "NOT_ESTABLISHED", "nativeIntervalBarrier": "NOT_ESTABLISHED", "originAuthority": False, "receiptAuthority": False, "recordAdoptionAuthority": False, "sealed": False, "reuseEligible": False, "groupClosureScope": "OWNED_NODE_GROUP_ONLY", "detachedDescendantClosure": "UNKNOWN", "resources": "RETAINED_NOT_DELETED"}

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


def prerequisites(_native=False):
    require(type(_native) is bool)
    uid = os.getuid()
    require(sys.flags.isolated == 1 and sys.flags.no_site == 1)
    require(sys.platform == "darwin" and platform.machine() == "arm64"
            and uid > 0 and uid == os.geteuid() and os.getgid() == os.getegid())
    forbidden = re.compile(r"^(?:NODE_OPTIONS|NODE_PATH|NODE_REPL_EXTERNAL_MODULE|BASH_ENV|ENV)$|^(?:DYLD_|LD_|OPENSSL_)", re.I)
    require(not any(forbidden.search(key) for key in os.environ))
    if _native:
        require(not any(key in os.environ for key in ("REDUE_DECISION_PROFILE", "REDUE_DECISION_PROFILE_FILE", "REDUE_PROFILE_CONTEXT")))
    here = Path(__file__).absolute()
    require(here == here.resolve() and here.name == "sealed-typescript-enclosure-provisioning-parent.py")
    repo = here.parents[2]
    require((repo / "package.json").is_file())
    entry = here.parent / (NATIVE_ENTRY_NAME if _native else ENTRY_NAME)
    node = Path(pwd.getpwuid(uid).pw_dir) / ".nvm/versions/node/v22.13.0/bin/node"
    rows = [inspect_file(here, uid, PARENT_SOURCE_LIMIT),
            inspect_file(entry, uid, 65536, NATIVE_ENTRY_SHA256 if _native else INNER_SHA256),
            inspect_file(node, uid, 128 * 1024 * 1024, NODE_SHA256)]
    if _native:
        rows.extend(inspect_file(here.parent / name, uid, 131072, pin) for name, pin in NATIVE_SOURCE_PINS)
        rows.extend(inspect_file(here.parent / ("sealed-typescript-" + name), uid, 131072, pin) for name, pin in NATIVE_SEALED_SOURCE_PINS)
        rows.extend(inspect_file(repo / name, uid, 131072, pin) for name, pin in NATIVE_ROOT_SOURCE_PINS)
    for row in rows:
        file_current(row)
    return repo, entry, node, rows


def recorded_build_outcome(builds):
    # Outcome derives only from the bound returned process facts. A historical
    # nonzero is never displaced by an asserted zero/unknown summary.
    if any(row["pidObserved"] and row["status"] is not None and row["status"] > 0
           and row["signal"] is None and row["spawnError"] == "NONE" for row in builds):
        return "EXIT_NONZERO"
    if len(builds) == 8 and all(row["pidObserved"] and row["completed"] and row["status"] == 0
                               and row["signal"] is None and row["spawnError"] == "NONE" for row in builds):
        return "EXIT_ZERO"
    return "UNKNOWN"


def parse_inner(body):
    def unique(pairs):
        value = {}
        for key, item in pairs:
            require(key not in value)
            value[key] = item
        return value
    require(0 < len(body) <= 65536 and body.endswith(b"\n") and body.count(b"\n") == 1)
    value = json.loads(body, object_pairs_hook=unique)
    expected = {"schema", "scope", "profile", "bodyBudgetMs", "cleanupBudgetMs", "totalBudgetMs", "outcome", "reason_code", "failedPhase", "enclosureSourceRefusal", "originalCurrentRefusal", "phases", "ownedRootNames", "builds", "buildAttemptCount", "buildResultCount", "observedProcessCount", "compilerBuildOutcome", "newFileDigests", "elapsedMs", "privateMints", "newCodeCurrentness", "nativeIntervalBarrier", "completeSdkClosure", "preMainLoader", *_FALSE.keys()}
    require(type(value) is dict and set(value) == expected and value["schema"] == 1
            and type(value["schema"]) is int and value["scope"] == "FIXED_ENCLOSURE_PROVISIONING_OBSERVATION_ONLY"
            and value["profile"] == "fixed-enclosure-preparation-local-sdk27@2"
            and type(value["bodyBudgetMs"]) is int and value["bodyBudgetMs"] == 60000
            and type(value["cleanupBudgetMs"]) is int and value["cleanupBudgetMs"] == 5000
            and type(value["totalBudgetMs"]) is int and value["totalBudgetMs"] == 65000
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
                and (row["elapsedMs"] is None or type(row["elapsedMs"]) in (int, float) and 0 <= row["elapsedMs"] < 65000))
    refusal = value["enclosureSourceRefusal"]
    require(refusal is None or type(refusal) is str and refusal in ENCLOSURE_REFUSAL_STAGES)
    if refusal is not None:
        require(value["outcome"] == "UNKNOWN" and value["failedPhase"] == "enclosureSource"
                and value["reason_code"] in ("PHASE_UNAVAILABLE", "FINAL_REPORT_OR_BUDGET_UNAVAILABLE")
                and value["phases"] and value["phases"][-1]["name"] == "enclosureSource"
                and value["phases"][-1]["outcome"] == "UNKNOWN")
    inner_refusal = value["originalCurrentRefusal"]
    require(inner_refusal is None or type(inner_refusal) is str and inner_refusal in ORIGINAL_CURRENT_REFUSAL_STAGES)
    if inner_refusal is not None:
        require(refusal in ("INITIAL_ORIGINAL_CURRENT", "FINAL_ORIGINAL_CURRENT"))
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
    require(value["buildResultCount"] == len(value["builds"]) <= value["buildAttemptCount"]
            and value["observedProcessCount"] == sum(row["pidObserved"] for row in value["builds"])
            and value["compilerBuildOutcome"] == recorded_build_outcome(value["builds"]))
    require(type(value["newFileDigests"]) is list and len(value["newFileDigests"]) <= 6)
    for row in value["newFileDigests"]:
        require(type(row) is dict and set(row) == {"index", "sha256"}
                and type(row["index"]) is int and 0 <= row["index"] < 6
                and re.fullmatch(r"[a-f0-9]{64}", row["sha256"]))
    require([row["index"] for row in value["newFileDigests"]] == list(range(len(value["newFileDigests"]))))
    require(value["elapsedMs"] is None or type(value["elapsedMs"]) in (int, float) and 0 <= value["elapsedMs"] < 65000)
    if value["outcome"] == "BUILT_NOT_EXECUTED":
        require(type(value["elapsedMs"]) in (int, float) and 0 <= value["elapsedMs"] < 60000
                and value["reason_code"] == "BUILT_NOT_EXECUTED" and value["failedPhase"] is None
                and len(value["ownedRootNames"]) == 3)
        require(value["buildAttemptCount"] == value["buildResultCount"] == value["observedProcessCount"] == 8
                and value["compilerBuildOutcome"] == "EXIT_ZERO"
                and all(row["completed"] and row["status"] == 0 and row["signal"] is None and row["spawnError"] == "NONE" for row in value["builds"])
                and len(value["newFileDigests"]) == 6 and len(value["phases"]) == 19
                and all(row["outcome"] == "COMPLETED" for row in value["phases"]))
    return value


# Fixed finite protocol: <=38 progress frames, three root names, eight returned
# build facts, one FINAL <=16KiB. Enforced aggregate maximum: 57,728 bytes;
# the original 65,536-byte stdout cap remains authoritative independently.
PHASE_NAMES = ("operationImports", "freshPair", "freshHost", "hostFixture", "prerequisiteBuilds", "prerequisiteCurrent", "pairedSource", "pairedBuilds", "pairedCurrent", "campaignCopies", "copiesCurrent", "oldLauncherBuild", "oldLauncherCurrent", "originalProjection", "preparedNull", "enclosureSource", "enclosureBuilds", "enclosureCurrent", "finalValidation")


def unique_json(body, _native=False):
    def unique(pairs):
        value = {}
        for key, item in pairs:
            require(key not in value)
            value[key] = item
        return value
    if _native:
        def number(token):
            require(not token.startswith("-"))
            value = float(token) if any(c in token for c in ".eE") else int(token)
            require(math.isfinite(value))
            return value
        return json.loads(body, object_pairs_hook=unique, parse_int=number,
                          parse_float=number, parse_constant=number)
    return json.loads(body, object_pairs_hook=unique)


NATIVE_REASONS = {"ACTIVATION_OR_RUNTIME_UNAVAILABLE", "PINNED_RUNTIME_OR_ENVIRONMENT_UNAVAILABLE", "GENUINE_PREPARATION_UNAVAILABLE", "ORIGINAL_COMMAND_OR_STARTUP_UNAVAILABLE", "EXCLUSIVE_SETTINGS_OR_BINDINGS_UNAVAILABLE", "PRE_NATIVE_CURRENTNESS_UNAVAILABLE", "NATIVE_COLLECTION_UNAVAILABLE", "POST_NATIVE_ENDPOINT_OR_STARTUP_UNAVAILABLE", "NATIVE_INTERPRETATION_UNAVAILABLE", "CLOCK_UNAVAILABLE", "OVERALL_BUDGET_OR_CANCELLATION", "SYNTACTIC_NATIVE_COLLECTION_ONLY", "CONTROLLER_RESULT_UNAVAILABLE"}
NATIVE_SIGNALS = {"SIGHUP", "SIGINT", "SIGQUIT", "SIGILL", "SIGTRAP", "SIGABRT", "SIGIOT", "SIGBUS", "SIGFPE", "SIGKILL", "SIGUSR1", "SIGSEGV", "SIGUSR2", "SIGPIPE", "SIGALRM", "SIGTERM", "SIGCHLD", "SIGCONT", "SIGSTOP", "SIGTSTP", "SIGTTIN", "SIGTTOU", "SIGURG", "SIGXCPU", "SIGXFSZ", "SIGVTALRM", "SIGPROF", "SIGWINCH", "SIGIO", "SIGINFO", "SIGSYS"}


def parse_native_final(body):
    require(type(body) in (bytes, bytearray) and 0 < len(body) <= 4096
            and body.endswith(b"\n") and body.count(b"\n") == 1)
    text = body.decode("utf-8", "strict")
    require(not text.startswith("\ufeff"))
    value = unique_json(text, _native=True)
    fixed = {"schema": 1, "scope": "FIXED_NATIVE_ENCLOSURE_CHILD_SUMMARY_ONLY", "interpretation": "fixed-native-enclosure-child-summary@1", "bodyDigestScope": "PARSED_BODY_SERIALIZATION_NOT_ORIGINAL_WIRE", "bodyRetained": False, "publicDataOnly": True, "nativeAuthenticated": False, "nativeEnforcement": "NOT_ESTABLISHED", "nativeIntervalBarrier": "NOT_ESTABLISHED", "detachedDescendantClosure": "UNKNOWN", "resources": "RETAINED_NOT_DELETED", "originAuthority": False, "receiptAuthority": False, "recordAdoptionAuthority": False, "sealed": False, "reuseEligible": False}
    fields = {"reportStatus", "outcome", "reportedAssertionOutcome", "reason", "preparationAttempted", "preparationOutcome", "preparationBuildAttemptCount", "preparationBuildResultCount", "preparationObservedProcessCount", "preparationProcessesComplete", "compilerBuildOutcome", "nativeSpawnAttempts", "nativeLaunches", "models", "helperExecutions", "nativeSpawnObserved", "nativeExit", "nativeSignal", "nativeCloseObserved", "nativeReaped", "timedOut", "cancelled", "overallBudgetExceeded", "milliseconds", "traceSyntaxValid", "completionDataValid", "commandSha256", "parsedBodySha256"}
    require(type(value) is dict and set(value) == fields | set(fixed))
    require(all(type(value[key]) is type(item) and value[key] == item for key, item in fixed.items()))
    require(value["reportStatus"] in ("CONTROLLER_RETURNED", "RESULT_UNAVAILABLE")
            and value["outcome"] in ("FAIL", "UNKNOWN") and value["reportedAssertionOutcome"] == value["outcome"]
            and value["reason"] in NATIVE_REASONS and value["preparationOutcome"] in (None, "BUILT_NOT_EXECUTED", "UNKNOWN")
            and value["compilerBuildOutcome"] in ("EXIT_ZERO", "EXIT_NONZERO", "UNKNOWN"))
    for key in ("preparationAttempted", "nativeSpawnObserved", "nativeCloseObserved", "nativeReaped", "timedOut", "cancelled", "overallBudgetExceeded"):
        require(value[key] is None or type(value[key]) is bool)
    require(all(type(value[key]) is bool for key in ("preparationProcessesComplete", "traceSyntaxValid", "completionDataValid")))
    for key, maximum in (("preparationBuildAttemptCount", 8), ("preparationBuildResultCount", 8), ("preparationObservedProcessCount", 8), ("nativeSpawnAttempts", 1), ("nativeLaunches", 1), ("models", 0), ("helperExecutions", 0), ("nativeExit", 255)):
        require(value[key] is None or type(value[key]) is int and 0 <= value[key] <= maximum)
    counts = [value[key] for key in ("preparationObservedProcessCount", "preparationBuildResultCount", "preparationBuildAttemptCount")]
    require(all(item is None for item in counts) or all(type(item) is int for item in counts) and counts == sorted(counts))
    require(value["nativeSignal"] is None or value["nativeSignal"] in NATIVE_SIGNALS)
    require(value["nativeExit"] is None or value["nativeSignal"] is None)
    require(value["milliseconds"] is None or type(value["milliseconds"]) in (int, float)
            and math.isfinite(value["milliseconds"]) and 0 <= value["milliseconds"] < 120000)
    for key in ("commandSha256", "parsedBodySha256"):
        require(value[key] is None or type(value[key]) is str and re.fullmatch(r"[a-f0-9]{64}", value[key]))
    require(not value["completionDataValid"] or value["traceSyntaxValid"] and value["nativeSpawnAttempts"] == 1
            and value["nativeSpawnObserved"] is True and value["nativeCloseObserved"] is True and value["nativeReaped"] is True
            and value["nativeExit"] == 0 and value["nativeSignal"] is None and value["timedOut"] is False
            and value["cancelled"] is False and value["overallBudgetExceeded"] is False)
    require(not value["completionDataValid"] or value["commandSha256"] is not None and value["parsedBodySha256"] is not None)
    if value["nativeSpawnAttempts"] == 0:
        require(value["nativeLaunches"] == 0 and value["models"] == 0 and value["helperExecutions"] == 0
                and value["nativeSpawnObserved"] is False and value["nativeCloseObserved"] is False and value["nativeReaped"] is False
                and value["nativeExit"] is None and value["nativeSignal"] is None)
    if value["nativeSpawnAttempts"] == 1:
        require(value["preparationAttempted"] is True and counts == [8, 8, 8])
        require(value["models"] is None and value["helperExecutions"] is None
                and value["preparationOutcome"] == "BUILT_NOT_EXECUTED" and value["preparationProcessesComplete"])
    if value["nativeSpawnObserved"] is True:
        require(value["nativeLaunches"] == 1 and value["nativeSpawnAttempts"] == 1)
    if value["preparationAttempted"] is False:
        require(value["preparationOutcome"] is None and value["nativeSpawnAttempts"] == 0)
    if value["preparationOutcome"] is None:
        require(all(item is None for item in counts) and value["compilerBuildOutcome"] == "UNKNOWN")
    require(value["compilerBuildOutcome"] != "EXIT_ZERO" or counts == [8, 8, 8])
    if value["preparationProcessesComplete"]:
        require(value["preparationAttempted"] is False or value["preparationOutcome"] == "BUILT_NOT_EXECUTED"
                and counts == [8, 8, 8] and value["compilerBuildOutcome"] == "EXIT_ZERO")
    if value["outcome"] == "FAIL":
        require(value["nativeSpawnAttempts"] == 1 and value["preparationOutcome"] == "BUILT_NOT_EXECUTED")
    if value["reportStatus"] == "CONTROLLER_RETURNED":
        require(type(value["preparationAttempted"]) is bool and type(value["nativeSpawnAttempts"]) is int)
    if value["nativeLaunches"] == 1:
        require(value["nativeSpawnObserved"] is True)
    if value["reportStatus"] == "RESULT_UNAVAILABLE":
        require(value["outcome"] == "UNKNOWN" and value["reason"] == "CONTROLLER_RESULT_UNAVAILABLE"
                and not value["traceSyntaxValid"] and not value["completionDataValid"] and not value["preparationProcessesComplete"]
                and all(value[key] is None for key in ("models", "helperExecutions", "nativeLaunches", "nativeSpawnAttempts", "preparationAttempted", "nativeSpawnObserved", "nativeCloseObserved", "nativeReaped")))
    return value


def native_deadline(timing):
    raw = os.environ.get("REDUE_DIAGNOSTIC_JOB_STARTED_MS")
    require(type(raw) is str and re.fullmatch(r"[0-9]{10,16}", raw))
    elapsed = _PROCESS_STARTED_WALL_MS - int(raw)
    require(0 <= elapsed < 115000)
    deadline = timing.started + 120 - elapsed / 1000
    require(timing() < deadline - 5)
    return deadline


def native_unknown(report, reason):
    summary = report.get("nativeSummary")
    try:
        summary = parse_native_final((json.dumps(summary, allow_nan=False) + "\n").encode())
    except Exception:
        summary = None
    failed = summary is not None and summary["reportedAssertionOutcome"] == "FAIL"
    observed = {key: report[key] for key in ("childReaped", "childExitCode", "childSignal", "cleanupSignal", "cleanupExceptionFamily", "cleanupErrno", "groupAbsentAfterReap", "exitMonitorState", "elapsedMs", "bodyElapsedMs", "stdoutBytes", "stderrBytes") if key in report}
    return {"schema": 1, "scope": NATIVE_SCOPE, "outcome": "FAIL" if failed else "UNKNOWN", "reportedAssertionOutcome": "FAIL" if failed else "UNKNOWN", "reason_code": reason, "collectionStatus": "UNKNOWN", "nativeSummary": summary, "observed": observed,
            "models": summary["models"] if summary else None, "helperExecutions": summary["helperExecutions"] if summary else None, "nativeAgentLaunches": summary["nativeLaunches"] if summary else None, "recordPersistence": "UNKNOWN", "finalParentCompletion": "NOT_ESTABLISHED", **_NATIVE_FALSE}


class ProgressProtocol:
    """Strict valid-prefix observations, never restorable execution authority."""
    def __init__(self):
        self.pending = bytearray()
        self.bytes_seen = 0
        self.frames = []
        self.roots, self.builds, self.phases = [], [], []
        self.attempts = 0
        self.active = None
        self.last_elapsed = 0
        self.inner = None
        self.invalid = False
        self.stopped = False

    def accept(self, value, size):
        require(type(value) is dict and type(value.get("schema")) is int and value["schema"] == 1
                and value.get("protocol") == "fixed-enclosure-progress@2" and self.inner is None)
        if value.get("kind") == "FINAL":
            require(set(value) == {"schema", "protocol", "kind", "report"} and size <= 16384 and self.active is None)
            inner = parse_inner((json.dumps(value["report"], allow_nan=False) + "\n").encode())
            require(inner["ownedRootNames"] == self.roots and inner["builds"] == self.builds
                    and inner["buildAttemptCount"] == self.attempts and len(inner["phases"]) == len(self.phases)
                    and inner["compilerBuildOutcome"] == recorded_build_outcome(self.builds)
                    and type(inner["elapsedMs"]) in (int, float) and inner["elapsedMs"] + 0.00051 >= self.last_elapsed)
            for final, observed in zip(inner["phases"], self.phases):
                require(final["name"] == observed["name"] and final["outcome"] == observed["outcome"]
                        and type(final["elapsedMs"]) in (int, float)
                        and abs(final["elapsedMs"] - observed["elapsedMs"]) <= 0.00051)
            if inner["outcome"] == "BUILT_NOT_EXECUTED":
                require(len(self.frames) == 38 and len(self.phases) == 19 and not self.stopped)
            self.inner = inner
            return
        expected = {"schema", "protocol", "kind", "sequence", "phaseIndex", "name", "elapsedMs", "phaseElapsedMs", "outcome", "newRoots", "newBuilds", "buildAttemptCount", "buildResultCount", "observedProcessCount", "compilerBuildOutcome", "countsMeaning", "activeDispatchCount"}
        require(set(value) == expected and not self.stopped and len(self.frames) < 38
                and type(value["sequence"]) is int and value["sequence"] == len(self.frames)
                and type(value["phaseIndex"]) is int and value["phaseIndex"] == len(self.phases)
                and len(self.phases) < 19 and value["name"] == PHASE_NAMES[len(self.phases)]
                and type(value["elapsedMs"]) in (int, float) and self.last_elapsed <= value["elapsedMs"] < 65000
                and value["countsMeaning"] == "RETURNED_OBSERVATIONS_LOWER_BOUND"
                and value["activeDispatchCount"] == "UNKNOWN"
                and type(value["newRoots"]) is list and type(value["newBuilds"]) is list)
        roots = self.roots + value["newRoots"]
        builds = self.builds + value["newBuilds"]
        require(len(roots) <= 3 and len(builds) <= 8
                and size <= 1024 + len(value["newBuilds"]) * 256 + len(value["newRoots"]) * 128)
        for index, row in enumerate(roots):
            require(type(row) is dict and set(row) == {"role", "name"}
                    and row["role"] == ("A", "B", "H")[index]
                    and type(row["name"]) is str and re.fullmatch(r"redue-ci-recipient-[a-f0-9]{8}", row["name"]))
        require(len({row["name"] for row in roots}) == len(roots))
        for row in builds:
            require(type(row) is dict and set(row) == {"pidObserved", "status", "signal", "spawnError", "completed", "stdoutBytes", "stderrBytes"}
                    and type(row["pidObserved"]) is bool and type(row["completed"]) is bool
                    and (row["status"] is None or type(row["status"]) is int and 0 <= row["status"] <= 255)
                    and row["signal"] in (None, "SIGKILL", "SIGTERM", "SIGABRT", "SIGSEGV", "SIGBUS", "SIGILL", "SIGINT", "UNKNOWN")
                    and row["spawnError"] in ("NONE", "UNKNOWN")
                    and all(type(row[k]) is int and 0 <= row[k] <= 9007199254740991 for k in ("stdoutBytes", "stderrBytes")))
        for key in ("buildAttemptCount", "buildResultCount", "observedProcessCount"):
            require(type(value[key]) is int and 0 <= value[key] <= 8)
        require(value["buildResultCount"] == len(builds) <= value["buildAttemptCount"] and value["observedProcessCount"] == sum(row["pidObserved"] for row in builds)
                and value["buildAttemptCount"] >= self.attempts
                and value["compilerBuildOutcome"] == ("EXIT_NONZERO" if any(row["pidObserved"] and row["status"] is not None and row["status"] > 0 and row["signal"] is None and row["spawnError"] == "NONE" for row in builds) else "UNKNOWN"))
        if value["kind"] == "BEGIN":
            require(self.active is None and value["outcome"] == "IN_PROGRESS" and value["phaseElapsedMs"] is None
                    and not value["newRoots"] and not value["newBuilds"] and value["buildAttemptCount"] == self.attempts)
            self.active = value["name"]
            self.phase_began = value["elapsedMs"]
        else:
            require(value["kind"] == "END" and self.active == value["name"]
                    and value["outcome"] in ("COMPLETED", "UNKNOWN")
                    and type(value["phaseElapsedMs"]) in (int, float) and 0 <= value["phaseElapsedMs"] < 65000
                    and abs(value["elapsedMs"] - self.phase_began - value["phaseElapsedMs"]) <= 0.0011)
            capacity = {"prerequisiteBuilds": 3, "pairedBuilds": 2, "oldLauncherBuild": 1, "enclosureBuilds": 2}.get(self.active, 0)
            require(len(value["newBuilds"]) <= value["buildAttemptCount"] - self.attempts <= capacity)
            require(not value["newRoots"] or self.active in ("freshPair", "freshHost"))
            if value["outcome"] == "COMPLETED":
                require(len(value["newBuilds"]) == capacity and value["buildAttemptCount"] - self.attempts == capacity)
                require(all(row["pidObserved"] and row["completed"] and row["status"] == 0 and row["signal"] is None and row["spawnError"] == "NONE" for row in value["newBuilds"]))
                require(len(value["newRoots"]) == (2 if self.active == "freshPair" else 1 if self.active == "freshHost" else 0))
            if self.active == "freshPair":
                require(len(roots) <= 2)
            if self.active == "freshHost":
                require(len(self.roots) == 2)
            self.phases.append({"name": self.active, "elapsedMs": value["phaseElapsedMs"], "outcome": value["outcome"]})
            self.active = None
            self.stopped = value["outcome"] == "UNKNOWN"
        self.frames.append(value)
        self.roots, self.builds = roots, builds
        self.attempts = value["buildAttemptCount"]
        self.last_elapsed = value["elapsedMs"]

    def feed(self, body):
        if self.invalid:
            return
        self.bytes_seen += len(body)
        if self.bytes_seen > 65536:
            self.invalid = True
            self.pending.clear()
            return
        self.pending.extend(body)
        try:
            while b"\n" in self.pending:
                at = self.pending.index(10) + 1
                line = bytes(self.pending[:at])
                del self.pending[:at]
                self.accept(unique_json(line), len(line))
        except Exception:
            self.invalid = True
            self.pending.clear()

    def finish(self):
        if self.pending or self.inner is None:
            self.invalid = True
        return None if self.invalid else self.inner

    def observation(self):
        return {"schema": 1, "protocol": "fixed-enclosure-progress@2", "validatedFrameCount": len(self.frames),
                "protocolStatus": "INVALID_OR_INCOMPLETE" if self.invalid else "PREFIX_ONLY" if self.inner is None else "FINAL_VALIDATED",
                "endedPhases": self.phases, "inProgressPhase": self.active,
                "ownedRootNames": self.roots, "builds": self.builds, "buildAttemptCountLowerBound": self.attempts,
                "buildResultCountLowerBound": len(self.builds), "activeDispatchCount": "UNKNOWN",
                "compilerBuildOutcome": "EXIT_NONZERO" if any(row["pidObserved"] and row["status"] is not None and row["status"] > 0 and row["signal"] is None and row["spawnError"] == "NONE" for row in self.builds) else "UNKNOWN",
                "authority": "NONE"}


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


class OwnedChildExitMonitor:
    """Darwin NOTE_EXIT observes this unreaped owned child; it never reaps it."""
    def __init__(self, pid):
        require(type(pid) is int and 0 < pid <= 2147483647)
        self.pid, self.seen, self.queue = pid, False, None
        try:
            self.queue = select.kqueue()
            changes = [select.kevent(pid, filter=select.KQ_FILTER_PROC,
                                    flags=select.KQ_EV_ADD | select.KQ_EV_ENABLE | select.KQ_EV_CLEAR,
                                    fflags=select.KQ_NOTE_EXIT)]
            self._accept(self.queue.control(changes, 1, 0))
        except Exception:
            self.close()
            raise

    def _accept(self, events):
        require(type(events) is list and len(events) <= 1)
        for event in events:
            require(event.ident == self.pid and event.filter == select.KQ_FILTER_PROC
                    and not event.flags & select.KQ_EV_ERROR and event.fflags == select.KQ_NOTE_EXIT)
            self.seen = True

    def exited(self, timeout=0):
        require(self.queue is not None and type(timeout) in (int, float) and 0 <= timeout <= 0.1)
        self._accept(self.queue.control([], 1, timeout))
        return self.seen

    def close(self):
        queue, self.queue = self.queue, None
        if queue is not None:
            queue.close()


def open_owned_exit_monitor(child):
    try:
        return OwnedChildExitMonitor(child.pid)
    except Exception:
        return None  # Missing/raced/unsupported monitor retains old cleanup.


class PreparationMonotonicClock:
    """One parent last-seen value and irreversible failure latch, not a timer."""
    def __init__(self, source, started):
        self.source, self.started, self.last, self.valid = source, started, started, True
        try:
            if started is None:
                self.started = self.last = source()
            require(type(self.started) in (int, float) and math.isfinite(self.started))
        except Exception:
            self.valid = False

    def __call__(self):
        try:
            require(self.valid)
            value = self.source()
            require(type(value) in (int, float) and math.isfinite(value) and value >= self.last)
            self.last = value
            return value
        except Exception:
            self.valid = False
            raise ValueError("PREPARATION_CLOCK_UNAVAILABLE") from None



class NativeCancellation:
    """Native-only process-local signal latch; never raises inside Popen/cleanup."""
    def __init__(self):
        self.requested = False
        self.previous = []

    def latch(self, signum, frame):
        self.requested = True

    def install(self):
        require(not self.previous)
        for selected in (signal.SIGTERM, signal.SIGHUP, signal.SIGINT):
            old = signal.getsignal(selected)
            self.previous.append((selected, old))
            signal.signal(selected, self.latch)

    def restore(self):
        restored = True
        for selected, old in reversed(self.previous):
            try:
                signal.signal(selected, old)
            except KeyboardInterrupt:
                # INT may already have its original handler while later
                # restoration calls are still pending. Continue every attempt.
                self.requested = True
                restored = False
            except Exception:
                restored = False
        self.previous.clear()
        return restored


def collect(child, clock=time.monotonic, selector_factory=selectors.DefaultSelector,
            read=os.read, killpg=os.killpg, started=None, exit_monitor=None, _native_deadline=None, _native_cancellation=None):
    """Fixed process envelope; injection is for source/mock tests only.

    Never poll/wait/communicate before the cleanup decision. The Popen PID
    stays reserved through NOTE_EXIT and the optional ONE killpg attempt until
    wait/reap. No destructive group operation is allowed after reap.
    """
    timing = clock if type(clock) is PreparationMonotonicClock else PreparationMonotonicClock(clock, started)
    began = timing.started
    native = _native_deadline is not None
    require(_native_cancellation is None or native and type(_native_cancellation) is NativeCancellation)
    require(not native or type(_native_deadline) in (int, float) and math.isfinite(_native_deadline)
            and type(began) in (int, float) and began + 5 < _native_deadline <= began + 120)
    work_end, total_end = (_native_deadline - 5, _native_deadline) if native else (began + 60, began + 65)
    output, error = bytearray(), bytearray()
    selector = None
    owned_pid = None
    reaped = False
    kill_attempted = False
    exited_skip = False
    exit_monitor_state = "NO_MONITOR" if exit_monitor is None else "NOT_QUERIED"
    prewait_probe, prewait_family, prewait_errno = "NOT_ATTEMPTED", "NONE", "NONE"
    postreap_probe, postreap_family, postreap_errno = "NOT_ATTEMPTED", "NONE", "NONE"
    cleanup_signal = "NOT_ATTEMPTED"
    cleanup_exception_family, cleanup_errno = "NONE", "NONE"
    reason = "UNKNOWN"
    code = None
    inner = None
    protocol = ProgressProtocol()
    def inner_report():
        if not native:
            return protocol.finish()
        try:
            return parse_native_final(output)
        except Exception:
            return None
    body_end = None
    cleanup_deadline = None
    def cleanup_remaining():
        nonlocal reason
        try:
            require(timing.valid)
            now = timing()
            require(type(now) in (int, float) and math.isfinite(now)
                    and type(body_end) in (int, float) and math.isfinite(body_end) and now >= body_end
                    and type(cleanup_deadline) in (int, float) and math.isfinite(cleanup_deadline))
            return max(0.0, min(5.0, cleanup_deadline - now))
        except Exception:
            timing.valid = False
            reason = "CLOCK_UNAVAILABLE"
            return 0.0
    try:
        require(type(child.pid) is int and 0 < child.pid <= 2147483647)
        owned_pid = child.pid
        if began is None:
            began = timing()
        require(type(began) in (int, float) and math.isfinite(began) and (started is None or started == began) and timing.valid)
        selector = selector_factory()
        for stream, role in ((child.stdout, "out"), (child.stderr, "err")):
            os.set_blocking(stream.fileno(), False)
            selector.register(stream, selectors.EVENT_READ, role)
        while selector.get_map():
            if native and _native_cancellation is not None and _native_cancellation.requested:
                reason = "CANCELLED"
                break
            now = timing()
            require(type(now) in (int, float) and math.isfinite(now) and type(began) in (int, float) and math.isfinite(began))
            if now >= work_end:
                reason = "BODY_DEADLINE"
                break
            for key, _ in selector.select(min(0.1, max(0, work_end - now))):
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
                if key.data == "out" and not native:
                    protocol.feed(block)
        else:
            reason = "BOTH_EOF"
    except (Exception, KeyboardInterrupt) as interruption:
        if isinstance(interruption, KeyboardInterrupt):
            if not native:
                raise
            if _native_cancellation is not None:
                _native_cancellation.requested = True
            reason = "CANCELLED"
        elif reason == "UNKNOWN":
            reason = "COLLECTION_UNAVAILABLE"
    finally:
        try:
            body_end = timing()
            require(type(body_end) in (int, float) and math.isfinite(body_end) and type(began) in (int, float) and math.isfinite(began))
            cleanup_deadline = min(total_end, body_end + 5) if native else min(began + 65, body_end + 5)
            if body_end >= work_end:
                reason = "BODY_DEADLINE"
        except Exception:
            reason = "CLOCK_UNAVAILABLE"
            timing.valid = False
            cleanup_deadline = total_end if type(began) in (int, float) and math.isfinite(began) else None
        # A strict complete FINAL plus exact kernel NOTE_EXIT can avoid a
        # useless destructive signal to an exited child. Neither EPERM nor
        # NOTE_EXIT proves descendant closure: post-reap ESRCH remains required.
        inner = inner_report()
        returned = [] if native or inner is None else inner["builds"]
        exited_gate = (reason == "BOTH_EOF" and len(error) == 0 and inner is not None
                       and not native and protocol.active is None and 1 <= inner["buildAttemptCount"]
                       == inner["buildResultCount"] == inner["observedProcessCount"]
                       and all(row["pidObserved"] and row["completed"] and type(row["status"]) is int
                               and row["signal"] is None and row["spawnError"] == "NONE" for row in returned))
        if native:
            exited_gate = (reason == "BOTH_EOF" and not error and inner is not None
                           and inner["reportStatus"] == "CONTROLLER_RETURNED" and inner["preparationProcessesComplete"]
                           and (inner["nativeSpawnAttempts"] == 0 or inner["nativeSpawnAttempts"] == 1
                                and inner["nativeCloseObserved"] is True and inner["nativeReaped"] is True
                                and inner["nativeExit"] == 0 and inner["nativeSignal"] is None and inner["timedOut"] is False))
        if exited_gate and owned_pid is not None and exit_monitor is not None:
            try:
                grace = min(0.1, cleanup_remaining())
                require(timing.valid)
                observed = exit_monitor.exited(timeout=grace)
                require(type(observed) is bool)
                exit_monitor_state = "EXIT_OBSERVED" if observed else "EXIT_NOT_OBSERVED"
                if observed:
                    try:
                        killpg(owned_pid, 0)
                        prewait_probe = "LIVE_MEMBERS"
                    except Exception as probe_error:
                        prewait_family, prewait_errno = cleanup_error_classification(probe_error)
                        if type(probe_error) is ProcessLookupError and probe_error.errno == errno.ESRCH:
                            prewait_probe, exited_skip = "GROUP_ABSENT", True
                        elif type(probe_error) is PermissionError and probe_error.errno == errno.EPERM:
                            prewait_probe, exited_skip = "PERMISSION_DENIED", True
                        else:
                            prewait_probe = "UNKNOWN"
            except Exception:
                exit_monitor_state = "UNKNOWN"
        # No wait/poll/communicate has occurred: PID still reserves the group.
        if exited_skip:
            cleanup_signal = "NOT_ATTEMPTED_CHILD_EXIT_OBSERVED"
        else:
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
            require(owned_pid is not None and (kill_attempted or exited_skip))
            remaining = cleanup_remaining()
            code = child.wait(timeout=remaining)
            reaped = True
        except Exception:
            _UNREAPED.append(child)
        for stream in (child.stdout, child.stderr):
            try:
                stream.close()
            except Exception:
                reason = "STREAM_CLOSE_UNAVAILABLE"
        if exit_monitor is not None:
            try:
                exit_monitor.close()
            except Exception:
                reason = "EXIT_MONITOR_CLOSE_UNAVAILABLE"
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
            postreap_probe = "LIVE_MEMBERS"
        except ProcessLookupError as probe_error:
            absent = type(probe_error) is ProcessLookupError and probe_error.errno == errno.ESRCH
            postreap_probe = "GROUP_ABSENT" if absent else "UNKNOWN"
            postreap_family, postreap_errno = cleanup_error_classification(probe_error)
        except Exception as probe_error:
            postreap_probe = "UNKNOWN"
            postreap_family, postreap_errno = cleanup_error_classification(probe_error)
    completed_at = None
    try:
        completed_at = timing()
        require(type(completed_at) in (int, float) and math.isfinite(completed_at)
                and type(body_end) in (int, float) and math.isfinite(body_end) and completed_at >= body_end)
        elapsed = completed_at - began
        require(type(elapsed) in (int, float) and math.isfinite(elapsed) and elapsed >= 0)
    except Exception:
        elapsed = None
        reason = "CLOCK_UNAVAILABLE"
    if not timing.valid:
        reason = "CLOCK_UNAVAILABLE"
    inner = inner_report()
    if native and _native_cancellation is not None and _native_cancellation.requested:
        reason = "CANCELLED"
    normal = (reason == "BOTH_EOF" and (kill_attempted or exited_skip)
              and cleanup_signal in ("SENT", "GROUP_ALREADY_ABSENT", "NOT_ATTEMPTED_CHILD_EXIT_OBSERVED") and reaped
              and absent and code in (0, 74) and len(error) == 0 and (completed_at < total_end if native else elapsed < 65)
              and type(cleanup_deadline) in (int, float) and completed_at < cleanup_deadline)
    success = not native and normal and code == 0 and inner is not None and inner["outcome"] == "BUILT_NOT_EXECUTED"
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
        elif completed_at is not None and cleanup_deadline is not None and completed_at >= cleanup_deadline:
            reason = "CLEANUP_DEADLINE"
        else:
            reason = "INNER_PREPARATION_UNKNOWN"
    if native:
        failed = inner is not None and inner["reportedAssertionOutcome"] == "FAIL"
        complete = normal and code == 0 and inner is not None and inner["reportStatus"] == "CONTROLLER_RETURNED"
        return {"schema": 1, "scope": NATIVE_SCOPE, "outcome": "FAIL" if failed else "UNKNOWN", "reportedAssertionOutcome": "FAIL" if failed else "UNKNOWN", "reason_code": "NATIVE_DATA_REPORT_OBSERVED" if complete else reason, "collectionStatus": "COMPLETE_DATA_REPORT" if complete else "UNKNOWN",
                "childReaped": reaped, "childExitCode": code if type(code) is int and code >= 0 else None, "childSignal": -code if type(code) is int and code < 0 else None, "cleanupSignal": cleanup_signal, "cleanupExceptionFamily": cleanup_exception_family, "cleanupErrno": cleanup_errno, "groupAbsentAfterReap": absent, "exitMonitorState": exit_monitor_state,
                "stdoutBytes": len(output), "stderrBytes": len(error), "elapsedMs": elapsed * 1000 if elapsed is not None else None, "bodyElapsedMs": (body_end - began) * 1000 if timing.valid and body_end is not None else None, "nativeSummary": inner,
                "models": inner["models"] if inner else None, "helperExecutions": inner["helperExecutions"] if inner else None, "nativeAgentLaunches": inner["nativeLaunches"] if inner else None, **_NATIVE_FALSE}
    return {"schema": 1, "scope": SCOPE, "outcome": "BUILT_NOT_EXECUTED" if success else "UNKNOWN",
            "reason_code": "PREPARATION_OBSERVED" if success else reason,
            "childReaped": reaped, "childExitCode": code if isinstance(code, int) and code >= 0 else None,
            "childSignal": -code if isinstance(code, int) and code < 0 else None,
            "cleanupSignal": cleanup_signal, "cleanupExceptionFamily": cleanup_exception_family,
            "cleanupErrno": cleanup_errno, "groupAbsentAfterReap": absent,
            "exitMonitorState": exit_monitor_state,
            "prewaitGroupProbe": prewait_probe, "prewaitProbeExceptionFamily": prewait_family, "prewaitProbeErrno": prewait_errno,
            "postreapGroupProbe": postreap_probe, "postreapProbeExceptionFamily": postreap_family, "postreapProbeErrno": postreap_errno,
            "stdoutBytes": len(output), "stderrBytes": len(error), "elapsedMs": elapsed * 1000 if elapsed is not None else None,
            "bodyElapsedMs": (body_end - began) * 1000 if type(body_end) in (int, float) and type(began) in (int, float) and math.isfinite(body_end) and math.isfinite(began) and body_end >= began else None,
            "innerReport": inner, "progressFrames": protocol.frames, "progressObservation": protocol.observation(), **_FALSE}


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


def save_record(repo, report, rows, directory_snapshot, _native=False):
    uid = os.getuid()
    record_directory_current(directory_snapshot)
    file = repo / ".local" / "portable-evidence" / (("enclosure-native-diagnostic-" if _native else "enclosure-preparation-") + str(uuid.uuid4()) + ".json")
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


def emit_final(value, deadline=None, not_before=None, parent_clock=None, _native_cancellation=None):
    body = json.dumps(value, separators=(",", ":"), allow_nan=False)
    require(len(body.encode()) <= 65536)
    if deadline is not None:
        value_now = parent_clock() if parent_clock is not None else time.monotonic()
        require(type(deadline) in (int, float) and math.isfinite(deadline)
                and type(value_now) in (int, float) and math.isfinite(value_now) and value_now < deadline
                and (not_before is None or type(not_before) in (int, float) and math.isfinite(not_before) and value_now >= not_before))
    if _native_cancellation is not None:
        require(type(_native_cancellation) is NativeCancellation and not _native_cancellation.requested)
    print(body)
    if _native_cancellation is not None:
        # Delivery is not atomic with signal handling. A late latch causes the
        # caller to emit a final UNKNOWN record; already-written data cannot
        # be retracted and never grants completion or evidence authority.
        require(not _native_cancellation.requested)


def unknown_with_observations(report, reason):
    observed = {}
    for key in ("childReaped", "childExitCode", "childSignal", "cleanupSignal",
                "cleanupExceptionFamily", "cleanupErrno", "groupAbsentAfterReap", "stdoutBytes", "stderrBytes", "elapsedMs", "bodyElapsedMs",
                "finalSourceCurrentness", "exitMonitorState", "prewaitGroupProbe", "prewaitProbeExceptionFamily", "prewaitProbeErrno",
                "postreapGroupProbe", "postreapProbeExceptionFamily", "postreapProbeErrno"):
        if key in report:
            observed[key] = report[key]
    # Only the already validated, fixed redacted schema is retained. No captured
    # byte stream/error text/source/environment/credential is serialized here.
    if "progressFrames" in report:
        protocol = ProgressProtocol()
        try:
            for frame in report["progressFrames"]:
                body = (json.dumps(frame, separators=(",", ":"), allow_nan=False) + "\n").encode()
                protocol.feed(body)
            require(not protocol.invalid)
            protocol.finish()
            observed["progressFrames"] = protocol.frames
            observed["progressObservation"] = protocol.observation()
        except Exception:
            pass
    inner = report.get("innerReport")
    if inner is not None:
        try:
            observed["innerReport"] = parse_inner((json.dumps(inner, allow_nan=False) + "\n").encode())
        except Exception:
            pass
    return {"schema": 1, "scope": SCOPE, "outcome": "UNKNOWN", "reason_code": reason,
            "recordPersistence": "UNKNOWN", "savedRecord": "NOT_ESTABLISHED",
            "finalParentCompletion": "NOT_ESTABLISHED", "observed": observed, **_FALSE}


def native_main():
    timing = PreparationMonotonicClock(time.monotonic, _PROCESS_STARTED)
    report = native_unknown({}, "PRECONDITION_UNAVAILABLE")
    phase = "PRECONDITIONS"
    cancellation = NativeCancellation()
    status = 74
    try:
        cancellation.install()
        deadline = native_deadline(timing)
        repo, entry, node, rows = prerequisites(_native=True)
        directory_snapshot = prepare_record_directory(repo)
        require(not cancellation.requested and timing() < deadline - 5)
        # Recheck every pinned source/binary at the last prelaunch boundary.
        for row in rows:
            file_current(row)
        require(not cancellation.requested and timing() < deadline - 5)
        child = subprocess.Popen([str(node), str(entry)], cwd=repo,
                                 env=os.environ.copy(), stdin=subprocess.DEVNULL,
                                 stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                 start_new_session=True, close_fds=True)
        monitor = open_owned_exit_monitor(child)
        report = collect(child, clock=timing, started=timing.started, exit_monitor=monitor, _native_deadline=deadline, _native_cancellation=cancellation)
        phase = "POST_COLLECTION"
        require(type(report.get("bodyElapsedMs")) in (int, float) and math.isfinite(report["bodyElapsedMs"]) and report["bodyElapsedMs"] >= 0)
        require(type(report.get("elapsedMs")) in (int, float) and math.isfinite(report["elapsedMs"]) and report["elapsedMs"] >= report["bodyElapsedMs"])
        cleanup_end = min(deadline, timing.started + report["bodyElapsedMs"] / 1000 + 5)
        completion = timing.started + report["elapsedMs"] / 1000
        def current_time():
            require(not cancellation.requested and completion <= timing() < cleanup_end)
        current_time()
        for row in rows:
            file_current(row)
        current_time()
        phase = "PERSISTENCE"
        file, digest = save_record(repo, report, rows, directory_snapshot, _native=True)
        current_time()
        emit_final({"scope": NATIVE_SCOPE, "outcome": report["outcome"], "reportedAssertionOutcome": report["reportedAssertionOutcome"], "collectionStatus": report["collectionStatus"], "reason_code": report["reason_code"], "record": file, "sha256": digest, "models": report["models"], "helperExecutions": report["helperExecutions"], "nativeAgentLaunches": report["nativeAgentLaunches"], **_NATIVE_FALSE}, deadline=cleanup_end, not_before=completion, parent_clock=timing, _native_cancellation=cancellation)
        status = 1 if report["outcome"] == "FAIL" else 0 if report["collectionStatus"] == "COMPLETE_DATA_REPORT" else 74
    except (Exception, KeyboardInterrupt) as interruption:
        if isinstance(interruption, KeyboardInterrupt):
            cancellation.requested = True
        reason = "CANCELLED" if cancellation.requested else "CLOCK_UNAVAILABLE" if not timing.valid else "PRECONDITION_UNAVAILABLE" if phase == "PRECONDITIONS" else "PERSISTENCE_UNAVAILABLE" if phase == "PERSISTENCE" else "POST_COLLECTION_UNAVAILABLE"
        emit_final(native_unknown(report, reason))
    finally:
        restored = cancellation.restore()
        if cancellation.requested and status != 74:
            emit_final(native_unknown(report, "CANCELLED"))
            status = 74
        if not restored:
            emit_final(native_unknown(report, "CANCELLATION_HANDLER_RESTORE_UNAVAILABLE"))
            status = 74
    return status


def main():
    if sys.argv[1:] == ["--native-run"]:
        return native_main()
    if sys.argv[1:] != ["--run"]:
        print(json.dumps({"scope": SCOPE, "outcome": "NOT_SELECTED", **_FALSE}))
        return 0
    begun = _PROCESS_STARTED
    timing = PreparationMonotonicClock(time.monotonic, begun)
    report = {"schema": 1, "scope": SCOPE, "outcome": "UNKNOWN", "reason_code": "PRECONDITION_UNAVAILABLE", **_FALSE}
    phase = "PRECONDITIONS"
    try:
        repo, entry, node, rows = prerequisites()
        directory_snapshot = prepare_record_directory(repo)
        prelaunch = timing()
        require(type(begun) in (int, float) and math.isfinite(begun)
                and type(prelaunch) in (int, float) and math.isfinite(prelaunch) and begun <= prelaunch < begun + 60)
        # No shell, credentials, settings or environment rewriting. The child
        # receives the existing safe environment unchanged, including proxies.
        child = subprocess.Popen([str(node), str(entry), "--fixed-preparation-child"], cwd=repo,
                                 env=os.environ.copy(), stdin=subprocess.DEVNULL,
                                 stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                 start_new_session=True, close_fds=True)
        # Include parent preflight/import/startup work in the original budget.
        exit_monitor = open_owned_exit_monitor(child)
        report = collect(child, clock=timing, started=begun, exit_monitor=exit_monitor)
        phase = "POST_COLLECTION"
        require(type(report.get("bodyElapsedMs")) in (int, float) and math.isfinite(report["bodyElapsedMs"]) and report["bodyElapsedMs"] >= 0)
        require(type(report.get("elapsedMs")) in (int, float) and math.isfinite(report["elapsedMs"]) and report["elapsedMs"] >= report["bodyElapsedMs"])
        cleanup_deadline = min(begun + 65, begun + report["bodyElapsedMs"] / 1000 + 5)
        parent_completion = begun + report["elapsedMs"] / 1000
        def post_current():
            value = timing()
            require(parent_completion <= value < cleanup_deadline)
        post_current()
        try:
            for row in rows:
                file_current(row)
            report["finalSourceCurrentness"] = "ENDPOINTS_OBSERVED"
        except Exception:
            report.update(outcome="UNKNOWN", reason_code="SOURCE_CURRENTNESS_UNAVAILABLE", finalSourceCurrentness="UNKNOWN")
        post_current()
        phase = "PERSISTENCE"
        file, digest = save_record(repo, report, rows, directory_snapshot)
        post_current()
        emit_final({"scope": SCOPE, "outcome": report["outcome"], "reason_code": report["reason_code"],
                    "record": file, "sha256": digest, **_FALSE}, deadline=cleanup_deadline, not_before=parent_completion, parent_clock=timing)
        return 0 if report["outcome"] == "BUILT_NOT_EXECUTED" else 74
    except Exception:
        reason = "CLOCK_UNAVAILABLE" if not timing.valid else "PRECONDITION_UNAVAILABLE" if phase == "PRECONDITIONS" else "PERSISTENCE_UNAVAILABLE" if phase == "PERSISTENCE" else "POST_COLLECTION_UNAVAILABLE"
        emit_final(unknown_with_observations(report, reason))
        return 74


if __name__ == "__main__":
    sys.exit(main())
