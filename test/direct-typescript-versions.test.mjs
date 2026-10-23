// The shared direct-recipe contract suite against one TypeScript outside the
// reviewed list, checked by lockfile integrity (CI's typescript-versions job:
// node test/helpers/install-typescript-fixture.mjs X.Y.Z first).
import test from 'node:test';
import {runFixtureSuite} from './helpers/direct-typescript-fixture-suite.mjs';
const version=process.env.REDUE_TEST_TYPESCRIPT;
test(`TypeScript ${version||'(set REDUE_TEST_TYPESCRIPT)'} obeys the direct contract through lockfile integrity`,
  {skip:version?false:'set by the typescript-versions CI job'},()=>runFixtureSuite(version));
