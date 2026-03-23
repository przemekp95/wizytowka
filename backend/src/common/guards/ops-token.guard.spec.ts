import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { opsConfig } from '../../config';
import { OpsTokenGuard } from './ops-token.guard';

describe('OpsTokenGuard', () => {
  const opsConfiguration: ConfigType<typeof opsConfig> = {
    adminToken: 'secret-token',
    adminTokens: ['secret-token', 'rotating-token'],
  };
  const guard = new OpsTokenGuard(opsConfiguration);

  it('accepts the configured bearer token', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'Bearer secret-token',
          },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('accepts rotated bearer tokens from the configured allowlist', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'Bearer rotating-token',
          },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects missing or invalid bearer tokens', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'Bearer wrong-token',
          },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
