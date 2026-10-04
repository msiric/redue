param([ValidateSet('npm','yarn','pnpm')][string]$Project)
$ErrorActionPreference = 'Stop'
$product = (Get-Location).Path
$cli = Join-Path $product 'bin/redue.mjs'
$cases = @{
  npm = @{repo='renzojohnson/google-workspace-mcp'; revision='33e05a4dc5365d8b135da25a6193d85d92a35205'; check='typecheck'}
  yarn = @{repo='streamich/memfs'; revision='adae41a54ff34c89db4e0d0708ec7c166e8998c6'; check='@jsonjoy.com/fs-node-utils:typecheck'; workspace='@jsonjoy.com/fs-node-utils'}
  pnpm = @{repo='BerriAI/litellm-bench'; revision='642704a95555bc0fc25dd73017584345c8eedb3b'; check='@litellm-bench/result-store:typecheck'; workspace='@litellm-bench/result-store'}
}
$case = $cases[$Project]
$root = Join-Path $env:RUNNER_TEMP "redue-public-$Project"
$state = Join-Path $env:RUNNER_TEMP "vstate-owned-state-$Project"
$tools = Join-Path $env:RUNNER_TEMP 'redue-corepack'
$shims = Join-Path $env:RUNNER_TEMP 'redue-manager-shims'
$store = Join-Path $env:RUNNER_TEMP 'redue-pnpm-store'
$env:REDUE_DECISION_PROFILE_FILE = Join-Path $env:RUNNER_TEMP "redue-timing-$Project.jsonl"
function Native([string]$File,[string[]]$Arguments) {
  & $File @Arguments
  if($LASTEXITCODE -ne 0){throw "$File exited $LASTEXITCODE"}
}
function Redue([string[]]$Arguments) { Native 'node' (@($cli,'--state-dir',$state)+$Arguments) }
function State {
  $output = & node $cli --state-dir $state status --sync --json
  if($LASTEXITCODE -ne 0){throw 'synchronized status failed'}
  return ($output | ConvertFrom-Json)
}
function CheckState([string]$Expected,[string]$Receipt='') {
  $row = $null
  for($attempt=0;$attempt -lt 120;$attempt++){
    $observed = State
    $row = $observed.checks | Where-Object name -eq $case.check
    if(!$row -and $observed.observation.phase -ne 'ready'){
      Start-Sleep -Seconds 1
      continue
    }
    if($row.freshness -ne 'UNVERIFIED' -or
      $row.reason -notmatch '^(input plan rebuilding|input plan indexing|observer initialization pending)'){
      break
    }
    Start-Sleep -Seconds 1
  }
  if(!$row -or $row.freshness -ne $Expected -or $row.result -ne 'PASS'){
    throw "Expected $($case.check) $Expected/PASS; got $($row.freshness)/$($row.result): $($row.reason)"
  }
  if($Receipt -and $row.invocation.runId -ne $Receipt){throw 'historical run ID changed'}
  return $row
}
function ReceiptCheckpoint {
  $receipt = (Get-Content -LiteralPath (Join-Path $state 'receipts-v1.json') -Raw |
    ConvertFrom-Json -AsHashtable).checks[$case.check]
  Write-Host "Run checkpoint issue codes: $($receipt.checkpoint.issues -join ', ')"
  Write-Host "Run checkpoint revisions: $($receipt.checkpoint.startRevision) -> $($receipt.checkpoint.endRevision)"
  $events = Join-Path $state 'events.jsonl'
  if(Test-Path -LiteralPath $events){
    Get-Content -LiteralPath $events | ForEach-Object { $_ | ConvertFrom-Json } |
      Where-Object kind -eq 'public_input_notification' | Select-Object -Last 12 |
      ForEach-Object { Write-Host "Public input notification: $($_.at) $($_.type) $($_.path) planning=$($_.planning)" }
  }
}

Write-Host "Windows public acceptance: $Project; $($case.repo) at $($case.revision)"
Native 'git' @('init','-q',$root)
Native 'git' @('-C',$root,'remote','add','origin',"https://github.com/$($case.repo).git")
Native 'git' @('-C',$root,'fetch','--depth=1','origin',$case.revision)
Native 'git' @('-C',$root,'checkout','--detach','FETCH_HEAD')
Set-Location $root

if($Project -ne 'npm'){
  Native 'npm' @('install','--prefix',$tools,'--no-audit','--no-fund','corepack@0.34.5')
  $corepack = Join-Path $tools 'node_modules/.bin/corepack.cmd'
  New-Item -ItemType Directory -Force $shims | Out-Null
  Native $corepack @('enable','--install-directory',$shims)
  $env:PATH = "$shims;$env:PATH"
  $pin = if($Project -eq 'yarn'){'yarn@4.12.0'}else{'pnpm@12.4.1'}
  Native $corepack @('prepare',$pin,'--activate')
}
switch($Project){
  npm {
    Native 'npm' @('ci','--no-audit','--no-fund')
    $names = (Get-ChildItem Env: | Where-Object {
      $_.Name -match '^(NODE_OPTIONS|NODE_PATH|BASH_ENV|ENV|npm_config_)'
    } | Select-Object -ExpandProperty Name)
    Write-Host "npm execution environment key names: $($names -join ', ')"
  }
  yarn {
    $yarn = Join-Path $shims 'yarn.cmd'
    Native $yarn @('install','--immutable','--mode=skip-build')
    Native $yarn @('workspace','@jsonjoy.com/fs-node-builtins','run','build')
    $tscShim = Join-Path $root 'node_modules/.bin/tsc.cmd'
    Write-Host "Yarn Windows tsc shim: $(Get-Content -LiteralPath $tscShim -Raw)"
    Write-Host "Corepack Yarn launcher: $(Get-Content -LiteralPath $yarn -Raw)"
    foreach($cacheRoot in @((Join-Path $env:LOCALAPPDATA 'node/corepack'),
      (Join-Path $env:USERPROFILE '.cache/node/corepack'))){
      if(Test-Path $cacheRoot){Get-ChildItem $cacheRoot -Recurse -Filter yarn.js -File |
        Select-Object -First 4 -ExpandProperty FullName | ForEach-Object {Write-Host "Yarn cache file: $_"}}
    }
    $names = (Get-ChildItem Env: | Where-Object {
      $_.Name -match '^(NODE_OPTIONS|NODE_PATH|BASH_ENV|ENV|YARN_|COREPACK_|npm_config_)'
    } | Select-Object -ExpandProperty Name)
    Write-Host "Yarn execution environment key names: $($names -join ', ')"
  }
  pnpm {
    $pnpm = Join-Path $shims 'pnpm.cmd'
    Native $pnpm @('install','--frozen-lockfile','--store-dir',$store)
    Native $pnpm @('--filter','@litellm-bench/contracts','build')
    $modules = Join-Path $root 'node_modules/.modules.yaml'
    Write-Host "pnpm virtualStoreDir: $((Get-Content -LiteralPath $modules | Select-String '^virtualStoreDir:').Line)"
    Write-Host "pnpm local lock present: $(Test-Path (Join-Path $root 'node_modules/.pnpm/lock.yaml'))"
    @'
import fs from 'node:fs';
for(const logical of [
  'packages/result-store/node_modules/@litellm-bench/contracts',
  'node_modules/typescript/bin/tsc']){
  let observed={logical,exists:false};
  try{const link=fs.lstatSync(logical),physical=fs.statSync(logical);
    observed={logical,exists:true,reparse:link.isSymbolicLink(),
      directory:physical.isDirectory(),hardlinks:physical.nlink};}
  catch(error){observed.error=error.code;}
  console.log('pnpm NTFS topology: '+JSON.stringify(observed));
}
'@ | node --input-type=module -
  }
}
$init = @('init')
if($case.workspace){$init += @('--workspace',$case.workspace,'--check','typecheck')}
Redue $init
Redue @('start')
try {
  $ready = $false
  for($attempt=0;$attempt -lt 120;$attempt++){
    $cached = & node $cli --state-dir $state status --json | ConvertFrom-Json
    if($LASTEXITCODE -eq 0 -and $cached.observation.phase -eq 'ready' -and
      $cached.observation.healthy -and $cached.observation.pending -eq 0){$ready=$true;break}
    Start-Sleep -Seconds 1
  }
  if(!$ready){throw 'observer did not establish a ready input plan within 120 seconds'}
  Redue @('run',$case.check)
  ReceiptCheckpoint
  $first = CheckState 'CURRENT'
  $receipt = $first.invocation.runId
  Set-Content -LiteralPath (Join-Path $root 'redue-unrelated-note.md') -Value 'disposable acceptance note'
  CheckState 'CURRENT' $receipt | Out-Null
  $sourcePath = switch($Project){
    npm { Join-Path $root 'src/extension.ts' }
    yarn { Join-Path $root 'packages/fs-node-utils/src/index.ts' }
    pnpm { Join-Path $root 'packages/result-store/src/index.ts' }
  }
  if(!(Test-Path -LiteralPath $sourcePath)){throw "No selected source file at $sourcePath"}
  Add-Content -LiteralPath $sourcePath -Value "`n// disposable REDUE freshness acceptance"
  CheckState 'STALE' $receipt | Out-Null
  Redue @('run',$case.check)
  ReceiptCheckpoint
  $second = CheckState 'CURRENT'
  Redue @('stop')
  Redue @('start')
  CheckState 'CURRENT' $second.invocation.runId | Out-Null
  $fresh = CheckState 'CURRENT' $second.invocation.runId
  "PASS: $Project, inherited CURRENT/PASS run $($fresh.invocation.runId) after restart" |
    Tee-Object -FilePath $env:GITHUB_STEP_SUMMARY -Append
  Redue @('stop')
  Redue @('remove-state')
  if(!(Test-Path -LiteralPath $sourcePath)){throw 'cleanup removed a project input'}
} finally {
  try{Redue @('stop')}catch{Write-Warning "Owned observer stop failed: $_"}
  $log = $env:REDUE_DECISION_PROFILE_FILE
  if(Test-Path -LiteralPath $log){
    Write-Host "Bounded decision-phase timing summary for $Project"
    & node (Join-Path $product 'test/acceptance/timing-summary.mjs') $log
  }
}
