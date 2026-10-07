import test from 'node:test';
import assert from 'node:assert/strict';
import {npmTypecheckEnvironmentIssue as issue} from '../src/npm-typecheck-environment.mjs';
const options={npmVersion:'10.9.2',platform:'darwin'};
test('npm proxy admission is narrow, versioned and independent of casing',()=>{
  for(const key of ['proxy','https_proxy','http_proxy','noproxy']){
    const value=key==='noproxy'?'localhost,127.0.0.1':'http://127.0.0.1:3128';
    for(const name of ['npm_config_'+key,('npm_config_'+key).toUpperCase()]){
      assert.equal(issue({[name]:value},options),null);
      assert.equal(issue({[name]:''},options),null);
      assert.equal(issue({[name]:value},{...options,npmVersion:'11.0.0'}),'npm-proxy-version-unsupported');
    }
  }
  assert.equal(issue({},options),null);
  assert.equal(issue({}, {npmVersion:'11.0.0'}),null);
});
test('conflicting duplicate proxy keys are rejected regardless of enumeration/platform',()=>{
  const a=['npm_config_proxy','http://localhost:3128'],b=['NPM_CONFIG_PROXY','http://localhost:3129'];
  for(const platform of ['darwin','linux','win32'])for(const rows of [[a,b],[b,a]])
    assert.equal(issue(Object.fromEntries(rows),{...options,platform}),'npm-proxy-context-ambiguous');
  assert.equal(issue({[a[0]]:a[1],[b[0]]:a[1]},options),null);
  assert.equal(issue({[a[0]]:'',[b[0]]:a[1]},options),'npm-proxy-context-ambiguous');
});
test('invalid proxy values and execution-altering or unknown overrides stay unsupported',()=>{
  for(const value of ['not a URL','file:///tmp/proxy','http://','http://host\n'])
    assert.equal(issue({npm_config_proxy:value},options),'npm-proxy-value-unsupported');
  for(const key of ['npm_config_http_proxys','npm_config_script_shell','npm_config_node_options',
    'npm_config_userconfig','npm_config_globalconfig','npm_config_workspace','npm_config_ignore_scripts',
    'npm_config_registry','npm_config_prefix','DYLD_INSERT_LIBRARIES','TSGO_FOO'])
    assert.equal(issue({[key]:'arbitrary'},options),'execution-environment-unsupported');
  for(const key of ['NODE_OPTIONS','NODE_PATH','BASH_ENV','ENV'])
    assert.equal(issue({[key]:'arbitrary'},options),'execution-environment-unsupported');
  assert.equal(issue({npm_config_proxy:'false'},options),null);
  assert.equal(issue({npm_config_https_proxy:'false'},options),'npm-proxy-value-unsupported');
  assert.equal(issue({npm_config_prefix:'C:\\owned'}, {...options,platform:'win32'}),null);
});
