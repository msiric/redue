// Run the same positive/adversarial contract suite against the newly reviewed
// official implementation. This is test selection, never product auto-selection.
import test from 'node:test';
import {runFixtureSuite} from './helpers/direct-typescript-fixture-suite.mjs';
test('TypeScript 5.5.2 obeys the existing direct and guarded-discovery contract',()=>runFixtureSuite('5.5.2'));
