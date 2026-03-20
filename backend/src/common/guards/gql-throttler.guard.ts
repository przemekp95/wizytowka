import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Request, Response } from 'express';
import { GraphQLError } from 'graphql';
import { throttleConfig } from '../../config';
import { GqlThrottleStorageService } from './gql-throttle-storage.service';

@Injectable()
export class GqlThrottlerGuard implements CanActivate {
  constructor(
    private readonly storage: GqlThrottleStorageService,
    @Inject(throttleConfig.KEY)
    private readonly throttleConfiguration: ConfigType<typeof throttleConfig>,
  ) {}

  reset(): void {
    this.storage.reset();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.throttleConfiguration.disabled) {
      return true;
    }

    const contextType = context.getType<'graphql' | 'http'>();

    if (contextType !== 'graphql') {
      return true;
    }

    const { req, res } = this.getRequestResponse(context);
    const tracker = this.getTracker(req);
    const key = `${context.getClass().name}:${context.getHandler().name}:${tracker}`;
    const now = Date.now();
    const { activeHits, blocked } = await this.storage
      .increment(
        key,
        this.throttleConfiguration.ttlMs,
        this.throttleConfiguration.limit,
        now,
      )
      .catch((error) => this.throwStorageUnavailable(res, error));

    if (blocked) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil(
          (activeHits[0] + this.throttleConfiguration.ttlMs - now) / 1000,
        ),
      );

      this.setRateLimitHeaders(res, activeHits.length, retryAfterSeconds);
      this.throwThrottlingException(res, retryAfterSeconds, activeHits.length);
    }

    this.setRateLimitHeaders(
      res,
      activeHits.length,
      Math.max(
        1,
        Math.ceil(
          (activeHits[0] + this.throttleConfiguration.ttlMs - now) / 1000,
        ),
      ),
    );

    return true;
  }

  protected getRequestResponse(context: ExecutionContext): {
    req: Request;
    res: Response;
  } {
    const contextType = context.getType<'graphql' | 'http'>();

    if (contextType === 'http') {
      const http = context.switchToHttp();
      return {
        req: http.getRequest<Request>(),
        res: http.getResponse<Response>(),
      };
    }

    const gql = GqlExecutionContext.create(context);
    const ctx = gql.getContext<{
      req?: Request;
      request?: Request;
      res?: Response;
      response?: Response;
    }>();

    const req = ctx?.req ?? ctx?.request;
    const res = ctx?.res ?? ctx?.response;

    if (req && res) {
      return { req, res };
    }

    const http = context.switchToHttp();
    return {
      req: http.getRequest<Request>(),
      res: http.getResponse<Response>(),
    };
  }

  protected getTracker(req: Request): string {
    return req.ip ?? 'unknown';
  }

  protected throwThrottlingException(
    res: Response,
    retryAfterSeconds: number,
    activeHits: number,
  ): never {
    res.status(429);
    res.setHeader('Retry-After', retryAfterSeconds.toString());

    throw new GraphQLError('Too Many Requests', {
      extensions: {
        code: 'TOO_MANY_REQUESTS',
        http: {
          status: 429,
          headers: new Map<string, string>([
            ['Retry-After', retryAfterSeconds.toString()],
            ['X-RateLimit-Limit', this.throttleConfiguration.limit.toString()],
            [
              'X-RateLimit-Remaining',
              Math.max(
                0,
                this.throttleConfiguration.limit - activeHits,
              ).toString(),
            ],
            ['X-RateLimit-Reset', retryAfterSeconds.toString()],
          ]),
        },
      },
    });
  }

  protected throwStorageUnavailable(res: Response, error: unknown): never {
    res.status(503);

    throw new GraphQLError('Rate limit storage unavailable', {
      extensions: {
        code: 'SERVICE_UNAVAILABLE',
        http: {
          status: 503,
        },
        originalError: error instanceof Error ? error.message : String(error),
      },
    });
  }

  private setRateLimitHeaders(
    res: Response,
    activeHits: number,
    resetSeconds: number,
  ): void {
    res.setHeader(
      'X-RateLimit-Limit',
      this.throttleConfiguration.limit.toString(),
    );
    res.setHeader(
      'X-RateLimit-Remaining',
      Math.max(0, this.throttleConfiguration.limit - activeHits).toString(),
    );
    res.setHeader('X-RateLimit-Reset', resetSeconds.toString());
  }
}
