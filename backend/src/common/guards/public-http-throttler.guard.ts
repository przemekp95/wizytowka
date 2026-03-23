import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { appConfig, throttleConfig } from '../../config';
import type { Request, Response } from 'express';
import { GqlThrottleStorageService } from './gql-throttle-storage.service';
import { resolveRequestTracker } from '../security/trusted-client-ip';

type PublicHttpThrottlePolicy = {
  key: string;
  limit: number;
  ttlMs: number;
};

export abstract class PublicHttpThrottlerGuard implements CanActivate {
  constructor(
    protected readonly storage: GqlThrottleStorageService,
    protected readonly appConfiguration: ConfigType<typeof appConfig>,
  ) {}

  protected abstract getPolicy(
    req: Request,
  ): PublicHttpThrottlePolicy | undefined;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();

    return this.canActivateHttp(
      http.getRequest<Request>(),
      http.getResponse<Response>(),
    );
  }

  async canActivateHttp(req: Request, res: Response): Promise<boolean> {
    const policy = this.getPolicy(req);

    if (!policy) {
      return true;
    }

    const tracker = resolveRequestTracker(
      req,
      this.appConfiguration.internalProxySharedSecret,
    );
    const key = `${policy.key}:${tracker}`;
    const now = Date.now();
    const { activeHits, blocked } = await this.storage
      .increment(key, policy.ttlMs, policy.limit, now)
      .catch((error) => {
        throw new ServiceUnavailableException({
          message: 'Rate limit storage unavailable',
          code: 'SERVICE_UNAVAILABLE',
          error: error instanceof Error ? error.message : String(error),
        });
      });
    const resetSeconds = Math.max(
      1,
      Math.ceil((activeHits[0] + policy.ttlMs - now) / 1000),
    );

    res.setHeader('X-RateLimit-Limit', policy.limit.toString());
    res.setHeader(
      'X-RateLimit-Remaining',
      Math.max(0, policy.limit - activeHits.length).toString(),
    );
    res.setHeader('X-RateLimit-Reset', resetSeconds.toString());

    if (!blocked) {
      return true;
    }

    res.setHeader('Retry-After', resetSeconds.toString());
    throw new HttpException(
      {
        message: 'Too Many Requests',
        code: 'TOO_MANY_REQUESTS',
        retryAfterSeconds: resetSeconds,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

@Injectable()
export class ContactHttpThrottlerGuard extends PublicHttpThrottlerGuard {
  constructor(
    storage: GqlThrottleStorageService,
    @Inject(appConfig.KEY)
    appConfiguration: ConfigType<typeof appConfig>,
    @Inject(throttleConfig.KEY)
    private readonly throttleConfiguration: ConfigType<typeof throttleConfig>,
  ) {
    super(storage, appConfiguration);
  }

  protected getPolicy(req: Request): PublicHttpThrottlePolicy | undefined {
    if (req.method !== 'POST') {
      return undefined;
    }

    return {
      key: 'contact-http',
      limit: this.throttleConfiguration.publicHttpLimit,
      ttlMs: this.throttleConfiguration.publicHttpTtlMs,
    };
  }
}

@Injectable()
export class ChatHttpThrottlerGuard extends PublicHttpThrottlerGuard {
  constructor(
    storage: GqlThrottleStorageService,
    @Inject(appConfig.KEY)
    appConfiguration: ConfigType<typeof appConfig>,
    @Inject(throttleConfig.KEY)
    private readonly throttleConfiguration: ConfigType<typeof throttleConfig>,
  ) {
    super(storage, appConfiguration);
  }

  protected getPolicy(req: Request): PublicHttpThrottlePolicy | undefined {
    if (req.method !== 'POST') {
      return undefined;
    }

    return {
      key: 'chat-http',
      limit: this.throttleConfiguration.chatHttpLimit,
      ttlMs: this.throttleConfiguration.chatHttpTtlMs,
    };
  }
}
