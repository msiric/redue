import test from 'node:test';import assert from 'node:assert/strict';
import {publicDeveloperPath} from './acceptance/sealed-typescript-host-tool-inventory.mjs';
test('public tool inventory path classifier never authorizes arbitrary, normalized-away or credential paths',()=>{
 for(const [file,kind] of [['/Applications/Xcode_26.0.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clang','CLANG'],['/Library/Developer/CommandLineTools/usr/bin/ld','LD'],['/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX26.0.sdk','SDK']])assert(publicDeveloperPath(file,kind));
 for(const file of ['/private/credential/usr/bin/clang','/Applications/Xcode.app/Contents/Developer/../secret/usr/bin/clang','/Applications/Xcode.app/Contents/Developer/A\nB/usr/bin/clang','/Applications/Xcode.app/Contents/Developer/SDKs/MacOSX.sdk/extra','/Library/Developer/CommandLineTools/usr/bin/clang;evil'])for(const kind of ['CLANG','LD','SDK','OTHER'])assert.equal(publicDeveloperPath(file,kind),false);
});
