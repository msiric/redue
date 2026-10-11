#!/usr/bin/env python3
"""Disabled native auth-route data proposal: no native process or secret access.

This helper cannot activate authenticated startup, tools or inference. Its
allowlisted sanitizer accepts synthetic controls only until the exact native
startup boundary has independent review and empirical proof.
"""
import argparse
import json
import os
import re

VERSION = "2.1.187"
BINARY_SHA = "a59a16ba4922adab7a145728f215d042184d349f5f7e72cddb7fc114250a4ce3"
BINARY_SIZE = 215994048
REF = "refs/heads/dev/portable-evidence"
FORBIDDEN_KEYS = (
    "ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_BASE_URL", "ANTHROPIC_CUSTOM_HEADERS", "ANTHROPIC_PROFILE", "CLAUDE_BG_AUTH_SNAPSHOT_PATH",
    "CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR", "CLAUDE_CODE_API_KEY_FILE_DESCRIPTOR",
    "CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST", "CLAUDE_CODE_API_BASE_URL", "_CLAUDE_CODE_ASSUME_FIRST_PARTY_BASE_URL",
    "CLAUDE_CODE_USE_BEDROCK", "CLAUDE_CODE_USE_VERTEX", "CLAUDE_CODE_USE_FOUNDRY",
    "CLAUDE_CODE_USE_ANTHROPIC_AWS", "CLAUDE_CODE_USE_GATEWAY", "CLAUDE_CODE_USE_MANTLE",
    "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN",
    "GOOGLE_APPLICATION_CREDENTIALS", "AZURE_OPENAI_API_KEY", "AZURE_API_KEY", "FOUNDRY_API_KEY",
    "GITHUB_TOKEN", "GH_TOKEN", "GH_ENTERPRISE_TOKEN", "GITHUB_ENTERPRISE_TOKEN", "NPM_TOKEN",
    "CLAUDE_SECURESTORAGE_CONFIG_DIR", "IS_DEMO", "CLAUDE_BRIDGE_REATTACH_SESSION", "CLAUBBIT",
    "CLAUDE_CODE_SESSION_KIND", "CLAUDE_CODE_POWERUP_ONBOARDING", "FORCE_AUTOUPDATE_PLUGINS", "DEBUG",
)


class GateError(Exception):
    def __init__(self, code):
        self.code = code


def require_ci(env, source):
    if not re.fullmatch(r"[0-9a-f]{40}", source or ""):
        raise GateError("EXACT_REVIEWED_SOURCE_REQUIRED")
    if (env.get("GITHUB_ACTIONS") != "true" or env.get("GITHUB_EVENT_NAME") != "workflow_dispatch"
            or env.get("GITHUB_REPOSITORY") != "msiric/redue" or env.get("GITHUB_REF") != REF
            or not re.fullmatch(r"[0-9a-f]{40}", env.get("GITHUB_SHA", ""))
            or env.get("REDUE_CHECKED_SOURCE") != source):
        raise GateError("MANUAL_FIXED_SOURCE_ROUTE_REQUIRED")
    # This DATA-ONLY route receives no secret, including the approved future
    # subscription route. Presence (even empty) is rejected, not its value read.
    if any(k in env for k in (*FORBIDDEN_KEYS, "CLAUDE_CODE_OAUTH_TOKEN")):
        raise GateError("AUTH_OR_STARTUP_CONTEXT_NOT_ALLOWED_IN_DATA_ROUTE")


def public_auth_status(payload):
    if not isinstance(payload, (str, bytes)) or len(payload) > 65536:
        raise GateError("NATIVE_AUTH_STATUS_MALFORMED")
    try:
        value = json.loads(payload)
    except (TypeError, ValueError, UnicodeError):
        raise GateError("NATIVE_AUTH_STATUS_MALFORMED") from None
    if not isinstance(value, dict):
        raise GateError("NATIVE_AUTH_STATUS_MALFORMED")
    # Exact187 Ak -> bEp maps the environment token to oauth_token. Its loggedIn
    # field is token presence, NOT token validity or subscription capacity.
    if value.get("loggedIn") is not True or value.get("authMethod") != "oauth_token" or value.get("apiProvider") != "firstParty":
        raise GateError("NATIVE_ENV_OAUTH_ROUTE_NOT_SELECTED")
    return {"loggedIn": True, "authMethod": "oauth_token", "apiProvider": "firstParty",
            "subscription_type_present": isinstance(value.get("subscriptionType"), str)}


def public_failure(error):
    return {"schema": 1, "status": "PRECONDITION_UNAVAILABLE",
            "reason_code": error.code if isinstance(error, GateError) else "PROPOSAL_CONTROL_UNAVAILABLE",
            "native_processes_launched": 0, "models_launched": 0, "bash_actions": 0,
            "can_infer": False}


def main(args):
    require_ci(os.environ, args.source)
    return {"schema": 1, "scope": "AUTH_STATUS_ONLY_DATA_PROPOSAL",
            "status": "BLOCKED_NATIVE_STARTUP_BOUNDARY",
            "reason_code": "AUTHENTICATED_STARTUP_SIDE_EFFECTS_NOT_ESTABLISHED",
            "native_version": VERSION, "native_sha256": BINARY_SHA,
            "native_size": BINARY_SIZE, "source": args.source,
            "workflow_head": os.environ["GITHUB_SHA"],
            "proposed_native_argv": ["VERIFIED_NATIVE_BINARY", "auth", "status", "--json"],
            "future_subscription_key_name": "CLAUDE_CODE_OAUTH_TOKEN",
            "future_startup_only_guard": {"DISABLE_UPDATES": "1"},
            "native_processes_launched": 0, "models_launched": 0, "bash_actions": 0,
            "can_infer": False, "credential_enforcement": "NOT_TESTED",
            "sandbox_enforcement": "NOT_TESTED", "oauth_token_validity": "NOT_ESTABLISHED",
            "subscription_capacity": "NOT_ESTABLISHED", "portable_applicability": "NOT_TESTED",
            "artifact_uploads": 0, "raw_auth_or_ui_published": False}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True)
    args = parser.parse_args()
    try:
        print(json.dumps(main(args)))
    except Exception as error:
        print(json.dumps(public_failure(error)))
        raise SystemExit(1)
