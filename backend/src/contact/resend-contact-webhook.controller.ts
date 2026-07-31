import {
  BadRequestException,
  Controller,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';
import { ResendContactWebhookService } from './infrastructure/resend-contact-webhook.service';

type RawBodyRequest = Request & {
  rawBody?: Buffer;
};

@ApiExcludeController()
@Controller('contact/webhooks/resend')
export class ResendContactWebhookController {
  constructor(
    private readonly resendWebhookService: ResendContactWebhookService,
  ) {}

  @Post()
  @HttpCode(200)
  async handle(@Req() req: RawBodyRequest): Promise<{ received: true }> {
    const payload = req.rawBody?.toString('utf8');

    if (!payload) {
      throw new BadRequestException(
        'Missing raw request body for Resend webhook',
      );
    }

    await this.resendWebhookService.handleWebhook({
      payload,
      headers: {
        id: req.header('svix-id') ?? undefined,
        timestamp: req.header('svix-timestamp') ?? undefined,
        signature: req.header('svix-signature') ?? undefined,
      },
    });

    return { received: true };
  }
}
