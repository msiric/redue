# Fixed native base trace — independent source/mock review

Bounded GO for corrected root-authored diagnostic interpretation only:

- `test/acceptance/sealed-typescript-native-base-trace.mjs` SHA-256
  `3d685ba7833eaed49b391e13d20d5bdac140faf846493b237a66c4fd4208376e`.
- Authored test SHA-256
  `592f8ef79df4d03ee3893f883a3d36477892f60b3ff2bc17422af6bcee4a62cc`.

This reviewer did not author the parser. Eleven authored mocks passed (50.37 ms);
seven independent controls passed (52.19 ms). No native, model, helper, compiler,
bootstrap, credential or hosted job was launched.

The initial `d8317e90...` source accepted three contradictory controlled sequences:
terminal success before later tool evidence, an explicit conflicting session ID,
and successful final before initialized context. All three refusal assertions
failed (46.08 ms). The intermediate `96ed3111...` lifecycle counter also failed
(45.82 ms): collectionComplete plus UNKNOWN lifecycle and the reason requiring an
observed exit74 were inconsistent but accepted. These failures remain historical;
no actual native failure or affected-user conclusion is inferred.

The corrected source makes final terminal, checks provided session identities,
requires init/tool/matched result before successful final, and checks the finite
collection lifecycle/reason combinations. It accepts one whole restricted I-JSON
collector document; arbitrary extra lines, extra JSON, and guessed exit-code
wrappers are refused. This can make a real unreviewed native wrapper UNKNOWN and
must not be loosened to obtain an attractive result. Independent successor tests
also preserve previously reported FAIL through a later terminal contradiction and
refuse unknown events without retaining their raw fields.

The six expected rows still include a missing assertion; nominal outcome remains
UNKNOWN. Model narrative cannot replace the matching tool result. Raw native
events must come from the enclosing strict parsed/bounded stream, and this helper
is not an arbitrary JavaScript-object execution boundary. The enclosing parent
still establishes actual native close, private source/copy/build identity,
effective policy, account/capacity and approved scope. Parser output alone proves
none of those facts, no seal, no reuse and no public release gate.

## Pinned nonzero formatter successor

Source/mock GO for `3f16f39a44b3c05ca2ad689fa94754e9a9a3db916fb96749090277a49364670c`
(test `82cc3305b412837ebca8e5fdf85dcd1fc6b97085986082442ae328f418c5029e`).
The exact selected public native187 source has JL at byte193678755 (second argument
becomes stderr), qye/d_o at 203431991/203432345 (filtered fields joined with newline
and trimmed, bounded truncation), Bash throw near 204059364 (annotated stdout passed
as JL's second argument) and d3p/qye near 203727572. These selected fragments were
independently read, never executed. They support only the fixed nonzero prefix
`Exit code 1\n` for collector FAIL or `Exit code 74\n` for UNKNOWN, with tool is_error
true. Other prefixes, stderr, truncation and extra documents remain refused.

The intermediate `4eb5cf67...` source dropped a fully valid inner FAIL when wrapper
code74 contradicted it (independent assertion failed, 44.85 ms). The successor first
validates the entire inner document, preserves validated FAIL separately, then
refuses contradictory wrapper lifecycle without creating a successful result.
Malformed or partial FAIL is not latched. Fourteen authored controls passed
(62.04 ms); ten independent controls passed (48.25 ms), including retained ordering,
session/lifecycle, extra-output and FAIL-preservation cases. No actual native or
model run occurred. The earlier seven-control script remains historical: its old
negative prefix74 case was replaced only in a new successor script after this exact
formatter source review, rather than rewriting the retained old result.

## Retained engineering copy observation

Independent bounded readonly inspection matched the retained TAP SHA-256
`a257f572cd3aad45fdfedaeb5961c1b1dc7981f3e291ba48b7adf8a304b3430b` and private
record SHA-256 `f85adb5416ec655c4324c2bcb242a5ecfa7e92ca1596a12f7a70cacb7b275d37`.
Both are single-link owned0600 regular files; exact descriptor/metadata checks held.
The record reports three attempted/returned/observed clang processes, all status0,
no signal or spawn error; four H copies and three exclusive directories; a same-
process copy-currency observation; helper/native-agent/verification/model counts0;
and sealed/reuse false. It establishes engineering build/copy data only. Those
private mints died with the parent, and the saved report cannot adopt a capability
or establish present protected copies, native denial, code execution or a seal.
