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
