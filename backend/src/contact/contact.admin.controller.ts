import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { OpsTokenGuard } from '../common/guards/ops-token.guard';
import { ContactMessageListResponseDto } from './contact.openapi.dto';
import { ContactAdminService } from './contact-admin.service';

@ApiTags('contact')
@ApiBearerAuth('admin-token')
@Controller('contact')
@UseGuards(OpsTokenGuard)
export class ContactAdminController {
  constructor(private readonly contactAdminService: ContactAdminService) {}

  @Get('messages')
  @ApiOperation({
    summary: 'List stored contact messages',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 20,
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    example: 'cm_456',
  })
  @ApiOkResponse({ type: ContactMessageListResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid admin bearer token',
  })
  async list(@Query('limit') limit = '20', @Query('cursor') cursor?: string) {
    return this.contactAdminService.listMessages({
      limit: Number(limit) || 20,
      cursor,
    });
  }
}
