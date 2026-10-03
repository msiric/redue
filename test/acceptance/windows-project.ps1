param([ValidateSet('npm','yarn','pnpm')][string]$Project)
$ErrorActionPreference = 'Stop'
$product = (Get-Location).Path
$cli = Join-Path $product 'bin/redue.mjs'
$cases = @{
  npm = @{repo='zerostorypoints/symblon'; revision='0d6fd27b81f83bfa9e383d69b78c878822965b11'; check='typecheck'}
  yarn = @{repo='streamich/memfs'; revision='adae41a54ff34c89db4e0d0708ec7c166e8998c6'; check='@jsonjoy.com/fs-node-utils:typecheck'; workspace='@jsonjoy.com/fs-node-utils'}
  pnpm = @{repo='BerriAI/litellm-bench'; revision='642704a95555bc0fc25dd73017584345c8eedb3b'; check='@litellm-bench/result-store:typecheck'; workspace='@litellm-bench/result-store'}
}
$case = $cases[$Project]
$root = Join-Path $env:RUNNER_TEMP "redue-public-$Project"
$state = Join-Path $env:RUNNER_TEMP "redue-owned-state-$Project"
$tools = Join-Path $env:RUNNER_TEMP 'redue-corepack'
$shims = Join-Path $env:RUNNER_TEMP 'redue-manager-shims'
$store = Join-Path $env:RUNNER_TEMP 'redue-pnpm-store'

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
  $row = (State).checks | Where-Object name -eq $case.check
  if(!$row -or $row.freshness -ne $Expected -or $row.result -ne 'PASS'){
    throw "Expected $($case.check) $Expected/PASS; got $($row.freshness)/$($row.result): $($row.reason)"
  }
  if($Receipt -and $row.invocation.runId -ne $Receipt){throw 'historical run ID changed'}
  return $row
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
  npm { Native 'npm' @('ci','--no-audit','--no-fund') }
  yarn {
    $yarn = Join-Path $shims 'yarn.cmd'
    Native $yarn @('install','--immutable','--mode=skip-build')
    Native $yarn @('workspace','@jsonjoy.com/fs-node-builtins','run','build')
  }
  pnpm {
    $pnpm = Join-Path $shims 'pnpm.cmd'
    Native $pnpm @('install','--frozen-lockfile','--store-dir',$store)
    Native $pnpm @('--filter','@litellm-bench/contracts','build')
  }
}
$init = @('init')
if($case.workspace){$init += @('--workspace',$case.workspace,'--check','typecheck')}
Redue $init
Redue @('start')
try {
  Redue @('run',$case.check)
  $first = CheckState 'CURRENT'
  $receipt = $first.invocation.runId
  Set-Content -LiteralPath (Join-Path $root 'redue-unrelated-note.md') -Value 'disposable acceptance note'
  CheckState 'CURRENT' $receipt | Out-Null
  $sourcePath = switch($Project){
    npm { Join-Path $root 'index.ts' }
    yarn { Join-Path $root 'packages/fs-node-utils/src/index.ts' }
    pnpm { Join-Path $root 'packages/result-store/src/index.ts' }
  }
  if(!(Test-Path -LiteralPath $sourcePath)){throw "No selected source file at $sourcePath"}
  Add-Content -LiteralPath $sourcePath -Value "`n// disposable REDUE freshness acceptance"
  CheckState 'STALE' $receipt | Out-Null
  Redue @('run',$case.check)
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
}
