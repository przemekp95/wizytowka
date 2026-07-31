import { registerAs } from '@nestjs/config';
import { readEnvBoolean, readEnvNumber, readEnvString } from './config.helpers';

export type ThrottleDriver = 'memory' | 'mongo';

function resolveDriver(): ThrottleDriver {
  const configuredDriver = readEnvString(process.env.THROTTLE_STORAGE);

  if (configuredDriver === 'memory') {
    return 'memory';
  }

  if (configuredDriver === 'mongo') {
    return 'mongo';
  }

  return process.env.NODE_ENV === 'test' ? 'memory' : 'mongo';
}

export default registerAs('throttle', () => ({
  driver: resolveDriver(),
  disabled: readEnvBoolean(process.env.THROTTLE_DISABLE, false),
  limit: 30,
  ttlMs: 60_000,
  publicHttpLimit: readEnvNumber(process.env.PUBLIC_HTTP_THROTTLE_LIMIT, 30),
  publicHttpTtlMs: readEnvNumber(
    process.env.PUBLIC_HTTP_THROTTLE_TTL_MS,
    60_000,
  ),
  chatHttpLimit: readEnvNumber(process.env.CHAT_HTTP_THROTTLE_LIMIT, 20),
  chatHttpTtlMs: readEnvNumber(process.env.CHAT_HTTP_THROTTLE_TTL_MS, 60_000),
  chatHttpGlobalLimit: readEnvNumber(
    process.env.CHAT_HTTP_GLOBAL_THROTTLE_LIMIT,
    100,
  ),
  chatHttpGlobalTtlMs: readEnvNumber(
    process.env.CHAT_HTTP_GLOBAL_THROTTLE_TTL_MS,
    60_000,
  ),
}));
