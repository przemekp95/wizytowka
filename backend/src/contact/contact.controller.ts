import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactDto } from './contact.dto';
import type { Request } from 'express';

@Controller('contact')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async send(@Body() dto: ContactDto, @Req() req: Request) {
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim() || req.ip;
    const requestId = req.requestId;

    const { messageId } = await this.contact.sendMail({
      ...dto,
      ip,
      requestId,
    });
    return { ok: true, messageId };
  }
}
