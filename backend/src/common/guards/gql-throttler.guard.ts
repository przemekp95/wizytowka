import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Request } from 'express';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequest(context: ExecutionContext): Request | undefined {
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest<Request>();
    }
    try {
      const gql = GqlExecutionContext.create(context);
      const ctx = gql.getContext<{ req?: Request; request?: Request }>();
      return ctx?.req ?? ctx?.request;
    } catch {
      return undefined;
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return true; // pomiń global throttling dla GraphQL
    }
    return super.canActivate(context);
  }

  protected async getTracker(req: Request): Promise<string> {
    return req.ip ?? 'unknown';
  }
}
