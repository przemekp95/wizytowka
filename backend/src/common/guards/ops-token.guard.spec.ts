import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { OpsTokenGuard } from './ops-token.guard';

describe('OpsTokenGuard', () => {
  const guard = new OpsTokenGuard();

  afterEach(() => {
    delete process.env.ADMIN_TOKEN;
  });

  it('accepts the configured bearer token', () => {
    process.env.ADMIN_TOKEN = 'secret-token';

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

  it('rejects missing or invalid bearer tokens', () => {
    process.env.ADMIN_TOKEN = 'secret-token';

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
