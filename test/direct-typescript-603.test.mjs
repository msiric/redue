// The shared direct-recipe contract suite against reviewed TypeScript 6.0.3.
// One version per file, so the versions run in parallel.
import test from 'node:test';
import {runFixtureSuite} from './helpers/direct-typescript-fixture-suite.mjs';
test('TypeScript 6.0.3 obeys the existing direct and guarded-discovery contract',()=>runFixtureSuite('6.0.3'));
