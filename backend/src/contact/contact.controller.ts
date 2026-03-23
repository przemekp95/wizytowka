import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ContactDto } from './contact.dto';
import { ContactHttpResponseDto } from './contact.openapi.dto';
import { ContactService } from './contact.service';
import { ContactHttpThrottlerGuard } from '../common/guards/public-http-throttler.guard';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(200)
  @UseGuards(ContactHttpThrottlerGuard)
  @ApiOperation({
    summary: 'Submit a public contact message',
  })
  @ApiBody({ type: ContactDto })
  @ApiOkResponse({ type: ContactHttpResponseDto })
  async create(
    @Body() contactDto: ContactDto,
    @Req() req: Request,
  ): Promise<{ ok: boolean; error?: string }> {
    const result = await this.contactService.createAndNotify({
      name: contactDto.name,
      email: contactDto.email,
      message: contactDto.message,
      ip: req.ip,
      requestId: req.requestId,
    });

    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
      };
    }

    return {
      ok: true,
    };
  }
}
