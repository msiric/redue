// Fixed fixture-suite partition, never product command or compiler selection.
const recording='^(?:wrapped |actual compiler interval )';
export const directTypeScriptFixtureGroups=[
 ['test/direct-typescript.test.mjs',[]],
 ['test/run-recording.test.mjs',[]],
 ['test/macos-direct-probe.test.mjs',['--test-skip-pattern',recording]],
 ['test/macos-direct-probe.test.mjs',['--test-name-pattern',recording]],
];
