# Portable Node startup configuration boundary

This prerequisite applies only to the reviewed official Node 22.13.0
darwin-arm64 direct-TypeScript portable profile. It changes neither the process
environment nor local receipt history, and independently checking it does not
establish any producer trust or portable eligibility.

The fixed default is `/System/Library/OpenSSL/openssl.cnf`. The initial reviewed
template is 9,390 bytes, SHA-256
`87d46eaa3376f42435f09976bd866461d4661753470423aa785f0942916db3fa`.
Its sections are `default`, `new_oids`, `ca`, `CA_default`, `policy_match`,
`policy_anything`, `req`, `req_distinguished_name`, `req_attributes`, `usr_cert`,
`v3_req`, `v3_ca`, `crl_ext`, and `proxy_cert_ext`. No active include, pragma,
`nodejs_conf`, `openssl_conf`, provider or engine selection exists. The exact
digest is authoritative; a file that only appears to share these section names
is unsupported. Unknown bytes require source review and an interpretation change.

The template expands `$ENV::HOME` once into an unused `RANDFILE` value and expands
its earlier literal `dir` in ten unused CA values. It already defines literal
`HOME`, which is the fallback when the environment value is absent. An admitted
HOME is a well-formed string without NUL, at most 4,096 UTF-8 bytes. Its contents
are copied as data, not reparsed as configuration directives. The bound is well
below OpenSSL's 65,536-byte expansion limit. The helper never returns or logs
HOME. This narrowly justified parse-equivalence is not a general environment
ignore rule: it depends on these exact bytes and the exact reviewed invocation.

`OPENSSL_CONF`, `OPENSSL_MODULES` and `OPENSSL_CONF_INCLUDE` presence, including
empty values and case aliases, is refused conservatively. This does not assert
that every alias is interpreted by POSIX OpenSSL. Node flags, preloads, dynamic
loader behavior and compiler restrictions remain independently enforced.

The reader checks root-owned, non-symlink, non-writable canonical ancestors and
a root-owned, regular, single-link, bounded leaf. It uses no-follow/nonblocking
open and verifies descriptor, leaf and parents after reading. Verified absence
means repeated ENOENT beneath unchanged validated parents; EACCES or another
failure is not absence. Absence receives a distinct versioned sentinel digest,
not the empty-file digest. Revalidate at each origin/recipient boundary; do not
cache a permission or validity claim. This still trusts the OS and does not
promise atomic protection against arbitrary privileged concurrent mutations.

## Source rationale and counterexample

Pinned [Node startup](https://github.com/nodejs/node/blob/v22.13.0/src/node.cc)
sets appname `NODE_OPENSSL_CONF_NAME`, overridden only by the excluded shared
configuration flag, and explicitly sets only `CONF_MFLAGS_IGNORE_MISSING_FILE`.
The [configuration default](https://github.com/nodejs/node/blob/v22.13.0/configure.py)
is `nodejs_conf`. Command-line configuration would outrank OPENSSL_CONF, but the
reviewed invocation supplies no such flags; the portable guard refuses the
environment override.

[OpenSSL settings forwarding](https://github.com/nodejs/node/blob/v22.13.0/deps/openssl/openssl/crypto/conf/conf_sap.c)
uses the supplied flags without adding `CONF_MFLAGS_DEFAULT_SECTION`.
[Module selection and default filename](https://github.com/nodejs/node/blob/v22.13.0/deps/openssl/openssl/crypto/conf/conf_mod.c)
therefore do not fall back to `openssl_conf` when `nodejs_conf` is absent; the
missing file flag admits true absence. No module/CA/request operation runs from
this template under that selection.

However, [configuration parsing](https://github.com/nodejs/node/blob/v22.13.0/deps/openssl/openssl/crypto/conf/conf_def.c)
processes every section, include and variable expansion before module selection.
Missing references or oversized expansion can fail startup. Expansion inserts
the resolved bytes without rescanning them.
[ENV lookup](https://github.com/nodejs/node/blob/v22.13.0/deps/openssl/openssl/crypto/conf/conf_api.c)
uses the environment then the default-section fallback.

Controlled, owned temporary-file experiments with actual Node 22.13.0 retained
the same OPENSSL_CONF pathname: a neutral file executed main with exit 0, while
a malformed file exited 100 before main. An inert-section HOME expansion above
the limit also failed before main; a bounded value succeeded. These establish
startup dependencies. They are not a REDUE false-CURRENT reproduction or a claim
about a released-version defect. No system configuration was mutated.

The official Node archive and leaf provenance are separate from this source
review: independent review verified official HTTPS release archive SHA-256
`bc1e374e7393e2f4b20e5bbc157d02e9b1fb2c634b2f992136b38fb8ca2023b7` against
SHASUMS256.txt, and its regular bin/node leaf SHA-256
`5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc`.
That did not include independent PGP signature verification and does not by
itself certify execution-context completeness.
