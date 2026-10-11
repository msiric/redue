import path from 'node:path';

const HASH = /^[0-9a-f]{64}$/;
const BASE = /^\/private\/tmp\/redue-ci-recipient-[A-Za-z0-9]{8}$/;

function fail() {
  const error = new Error('Native Claude receiver proposal is incomplete or unsupported.');
  error.code = 'CLAUDE_RECEIVER_PROPOSAL_INVALID';
  throw error;
}

function shellData(value) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

// Proposal construction only. This module never starts a process, reads credentials,
// writes settings or converts help/static-key presence into host-boundary authority.
export function prepareClaudeReceiverInvocation(options) {
  if (!options || Object.keys(options).some(key => !['base', 'claudeExecutable', 'claudeSha256', 'claudeVersion', 'maxTurns', 'timeoutMs'].includes(key))) fail();
  const { base, claudeExecutable, claudeSha256, claudeVersion, maxTurns = 8, timeoutMs = 300000 } = options;
  if (typeof base !== 'string' || !BASE.test(base) || path.normalize(base) !== base ||
      typeof claudeExecutable !== 'string' || !path.isAbsolute(claudeExecutable) ||
      /[\0\r\n]/.test(claudeExecutable) || path.normalize(claudeExecutable) !== claudeExecutable ||
      !HASH.test(claudeSha256 ?? '') || claudeVersion !== '2.1.146' ||
      !Number.isInteger(maxTurns) || maxTurns < 1 || maxTurns > 8 ||
      !Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 300000) fail();
  const root = path.join(base, 'Checkout 空间');
  const state = path.join(base, 'redue-state');
  const config = path.join(root, 'redue.config.json');
  const socket = path.join(state, 'observer.sock');
  const prefix = path.join(base, 'prefix');
  const hostConfig = path.join(base, 'claude-host');
  const settingsFile = path.join(hostConfig, 'settings.json');
  const command = `redue --config ${shellData(config)} --state-dir ${shellData(state)}`;
  const settings = {
    disableAllHooks: true,
    enabledPlugins: {},
    permissions: {
      allow: ['Bash(pwd)', 'Bash(ls)', 'Bash(cat package.json)', 'Bash(cat tsconfig.json)', 'Bash(cat src/a.ts)', 'Bash(cat src/globals.d.ts)',
        `Bash(${command} status --sync --json)`, `Bash(${command} run typecheck)`],
      deny: ['WebFetch', 'WebSearch', 'Agent', 'Task', 'LSP', 'Read', 'Edit', 'Write', 'Glob', 'Grep'],
    },
    sandbox: {
      enabled: true,
      failIfUnavailable: true,
      allowUnsandboxedCommands: false,
      autoAllowBashIfSandboxed: false,
      excludedCommands: [],
      filesystem: {
        allowWrite: [root, state],
        denyRead: [hostConfig, '~/.ssh', '~/.aws', '~/.npmrc', '~/.claude', '~/.config', '~/.git-credentials'],
        denyWrite: [hostConfig, prefix, path.join(state, 'portable-producers-v1.json')],
      },
      network: {
        allowedDomains: [], deniedDomains: ['*'], strictAllowlist: true,
        allowUnixSockets: [socket], allowAllUnixSockets: false, allowLocalBinding: false,
      },
      credentials: {
        envVars: ['CLAUDE_CODE_OAUTH_TOKEN', 'ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'GITHUB_TOKEN', 'GH_TOKEN', 'NPM_TOKEN']
          .map(name => ({ name, mode: 'deny' })),
      },
    },
  };
  return {
    schema: 1, status: 'PROPOSAL_ONLY', disabled: true, model_launches: 0,
    blockers: ['OWNER_EXACT_WORKFLOW_REVIEW_REQUIRED', 'NATIVE_CREDENTIAL_DENIAL_NOT_VERIFIED',
      'NATIVE_SANDBOX_AND_PERMISSION_ENFORCEMENT_NOT_VERIFIED', 'CURRENT_PRODUCER_POLICY_APPROVAL_REQUIRED',
      'MATCHED_RECIPIENT_AND_EXPECTED_EVIDENCE_PREFLIGHT_REQUIRED'],
    actual_local_version: claudeVersion, max_turns_proposed: maxTurns, parent_timeout_ms_proposed: timeoutMs,
    executable: claudeExecutable, executable_sha256_proposed: claudeSha256,
    cwd: root, settings_file_proposed: settingsFile,
    argv_proposed: ['--print', '--verbose', '--output-format', 'stream-json', '--max-turns', String(maxTurns),
      '--permission-mode', 'dontAsk', '--tools', 'Bash', '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}',
      '--setting-sources', 'project,local', '--settings', settingsFile, '--no-session-persistence'],
    prompt_source: 'owner-reviewed ordinary task supplied only after all gates; no REDUE reminder',
    auth_environment_key_only: 'CLAUDE_CODE_OAUTH_TOKEN', host_config_directory_proposed: hostConfig,
    settings_proposed: settings,
    origin: 'caller-selected owned recipient base only; no artifact-selected paths or approval',
  };
}

export function requireClaudeReceiverActivation() {
  const error = new Error('Native Claude receiver remains disabled pending independently verified host controls and owner approval.');
  error.code = 'CLAUDE_RECEIVER_ACTIVATION_NOT_APPROVED';
  throw error;
}
