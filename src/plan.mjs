import {createHash} from 'node:crypto';
import {discoverDeclared} from './declared-plan.mjs';

export const sha = value => createHash('sha256').update(value).digest('hex');

export function discover(config) {
  if (config.provider !== 'declared-project@1')
    throw Error(`unsupported input-plan provider: ${config.provider}`);
  return discoverDeclared(config);
}
