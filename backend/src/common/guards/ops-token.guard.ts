import {
  Inject,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { Request } from 'express';
import { opsConfig } from '../../config';

@Injectable()
export class OpsTokenGuard implements CanActivate {
  constructor(
    @Inject(opsConfig.KEY)
    private readonly opsConfiguration: ConfigType<typeof opsConfig>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const expected = `Bearer ${this.opsConfiguration.adminToken ?? ''}`;

    if (
      !this.opsConfiguration.adminToken ||
      req.headers.authorization !== expected
    ) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
