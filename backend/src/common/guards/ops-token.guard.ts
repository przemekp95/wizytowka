import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class OpsTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const expected = `Bearer ${process.env.ADMIN_TOKEN ?? ''}`;

    if (!process.env.ADMIN_TOKEN || req.headers.authorization !== expected) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
