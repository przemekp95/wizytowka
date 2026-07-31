import {
  Inject,
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { resolveRequestTracker } from '../common/security/trusted-client-ip';
import { appConfig } from '../config';
import { ContactHttpResponseDto } from './contact.openapi.dto';
import { ContactService } from './contact.service';
import { ContactHttpThrottlerGuard } from '../common/guards/public-http-throttler.guard';
import { ContactDto } from './dto/contact.dto';
import {
  toPublicContactResponse,
  type PublicContactResponse,
} from './contact.public-response';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(
    private readonly contactService: ContactService,
    @Inject(appConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,
  ) {}

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
  ): Promise<PublicContactResponse> {
    const result = await this.contactService.createAndQueueNotification({
      name: contactDto.name,
      email: contactDto.email,
      message: contactDto.message,
      ip: resolveRequestTracker(
        req,
        this.appConfiguration.internalProxySharedSecret,
      ),
      requestId: req.requestId,
    });

    return toPublicContactResponse(result);
  }
}
