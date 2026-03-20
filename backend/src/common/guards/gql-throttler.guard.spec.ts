import { ExecutionContext } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { GqlThrottlerGuard } from './gql-throttler.guard';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { GqlThrottleStorageService } from './gql-throttle-storage.service';
import { mongoConfig, throttleConfig } from '../../config';

describe('GqlThrottlerGuard', () => {
  let guard: GqlThrottlerGuard;

  beforeEach(() => {
    const storage = new GqlThrottleStorageService(
      {
        driver: 'memory',
        disabled: false,
        limit: 30,
        ttlMs: 60_000,
      } satisfies ConfigType<typeof throttleConfig>,
      {
        uri: undefined,
        dbName: 'wizytowka',
      } satisfies ConfigType<typeof mongoConfig>,
    );

    guard = new GqlThrottlerGuard(
      storage,
      {
        driver: 'memory',
        disabled: false,
        limit: 30,
        ttlMs: 60_000,
      } satisfies ConfigType<typeof throttleConfig>,
    );
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should be an instance of GqlThrottlerGuard', () => {
    expect(guard).toBeInstanceOf(GqlThrottlerGuard);
  });

  it('returns HTTP request/response for HTTP contexts', () => {
    const req = { ip: '127.0.0.1' };
    const res = { header: jest.fn() };
    const context = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    } as unknown as ExecutionContext;

    expect((guard as any).getRequestResponse(context)).toEqual({ req, res });
  });

  it('returns GraphQL request/response for GraphQL contexts', () => {
    const req = { ip: '198.51.100.20' };
    const res = { header: jest.fn() };
    const context = {
      getType: () => 'graphql',
    } as unknown as ExecutionContext;

    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => ({ req, res }),
    } as unknown as GqlExecutionContext);

    expect((guard as any).getRequestResponse(context)).toEqual({ req, res });
  });

  it('uses req.ip when generating tracker', () => {
    expect(
      (guard as any).getTracker({
        headers: { 'x-forwarded-for': '203.0.113.9, 10.0.0.1' },
        ip: '198.51.100.9',
      }),
    ).toBe('198.51.100.9');
  });

  it('sets HTTP 429 before throwing the throttling GraphQL error', () => {
    const status = jest.fn();
    const setHeader = jest.fn();

    try {
      (guard as any).throwThrottlingException({ status, setHeader }, 60, 30);
      fail('Expected throttling exception');
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError);
      expect((error as GraphQLError).extensions).toMatchObject({
        code: 'TOO_MANY_REQUESTS',
        http: {
          status: 429,
        },
      });
    }

    expect(status).toHaveBeenCalledWith(429);
    expect(setHeader).toHaveBeenCalledWith('Retry-After', '60');
  });
});
