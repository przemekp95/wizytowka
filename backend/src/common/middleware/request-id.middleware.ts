import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const existing = req.header('X-Request-Id');
    const id = existing || randomUUID();
    (req as any).requestId = id;
    res.setHeader('X-Request-Id', id);
    next();
  }
}
