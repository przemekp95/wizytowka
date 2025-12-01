import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { ContactDto } from './contact.dto';
import type { Request } from 'express';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Send contact message',
    description:
      'Submits a contact form message with email notification and database storage',
  })
  @ApiBody({
    type: ContactDto,
    description: 'Contact form data',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Message accepted for processing',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean', example: true },
        messageId: { type: 'string', example: 'abc123@example.com' },
        savedId: { type: 'string', example: 'uuid-string' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data',
  })
  async send(@Body() dto: ContactDto, @Req() req: Request) {
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim() || req.ip;
    const requestId = req.requestId;

    const result = await this.contact.createAndNotify({
      name: dto.name,
      email: dto.email,
      message: dto.message,
      ip,
      requestId,
    });

    return result;
  }
}
