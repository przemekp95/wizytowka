import { registerAs } from '@nestjs/config';
import { readEnvBoolean, readEnvString } from './config.helpers';

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
}));
