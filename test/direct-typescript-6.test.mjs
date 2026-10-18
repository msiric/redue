// The shared direct-recipe contract suite against each reviewed TypeScript 6.
import test from 'node:test';
import {runFixtureSuite} from './helpers/direct-typescript-fixture-suite.mjs';
for(const version of ['6.0.2','6.0.3'])
  test(`TypeScript ${version} obeys the existing direct and guarded-discovery contract`,()=>runFixtureSuite(version));
