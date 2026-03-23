import {
  Inject,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { ConfigType } from '@nestjs/config';
import type { Request } from 'express';
import { opsConfig } from '../../config';

function isMatchingBearerToken(
  authorizationHeader: string | undefined,
  expectedTokens: readonly string[],
): boolean {
  const providedToken = authorizationHeader?.startsWith('Bearer ')
    ? authorizationHeader.slice('Bearer '.length)
    : undefined;

  if (!providedToken || expectedTokens.length === 0) {
    return false;
  }

  return expectedTokens.some((expectedToken) => {
    const providedBuffer = Buffer.from(providedToken);
    const expectedBuffer = Buffer.from(expectedToken);

    if (providedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(providedBuffer, expectedBuffer);
  });
}

@Injectable()
export class OpsTokenGuard implements CanActivate {
  constructor(
    @Inject(opsConfig.KEY)
    private readonly opsConfiguration: ConfigType<typeof opsConfig>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const expectedTokens = this.opsConfiguration.adminTokens ?? [];

    if (!isMatchingBearerToken(req.headers.authorization, expectedTokens)) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
