import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiCreatedResponse,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { OpsTokenGuard } from '../common/guards/ops-token.guard';
import { validatePortfolioImageContent } from './portfolio-image.validation';
import { PortfolioService } from './portfolio.service';
import {
  CreatePortfolioItemDto,
  PortfolioDeleteResponseDto,
  PortfolioListResponseDto,
  PortfolioMutationResponseDto,
  UpdatePortfolioItemDto,
} from './dto/portfolio-rest.dto';
import {
  toPublicPortfolioDeleteResponse,
  toPublicPortfolioListResponse,
  toPublicPortfolioMutationResponse,
} from './portfolio.public-response';

type UploadedImageFile = {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
};

const PORTFOLIO_UPLOAD_FILE_SIZE_LIMIT = 5 * 1024 * 1024;
const ALLOWED_PORTFOLIO_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

function validatePortfolioImageFile(
  _req: unknown,
  file: UploadedImageFile,
  callback: (error: Error | null, acceptFile: boolean) => void,
): void {
  if (!ALLOWED_PORTFOLIO_IMAGE_MIME_TYPES.has(file.mimetype)) {
    callback(
      new BadRequestException('Only JPEG, PNG, and WebP images are allowed.'),
      false,
    );
    return;
  }

  callback(null, true);
}

@ApiTags('portfolio')
@ApiExtraModels(
  CreatePortfolioItemDto,
  UpdatePortfolioItemDto,
  PortfolioListResponseDto,
  PortfolioMutationResponseDto,
  PortfolioDeleteResponseDto,
)
@Controller('portfolio')
export class PortfolioApiController {
  constructor(private readonly service: PortfolioService) {}

  @Get()
  @ApiOperation({
    summary: 'List published portfolio items',
  })
  @ApiOkResponse({ type: PortfolioListResponseDto })
  async list(): Promise<PortfolioListResponseDto> {
    const items = await this.service.listPublished();
    return toPublicPortfolioListResponse(items);
  }

  @Post()
  @ApiBearerAuth('admin-token')
  @UseGuards(OpsTokenGuard)
  @ApiOperation({
    summary: 'Create a portfolio item',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(CreatePortfolioItemDto) },
        {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      ],
    },
  })
  @ApiCreatedResponse({ type: PortfolioMutationResponseDto })
  @ApiBadRequestResponse({
    description: 'Missing img/image or invalid payload',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid admin bearer token',
  })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: {
        fileSize: PORTFOLIO_UPLOAD_FILE_SIZE_LIMIT,
        files: 1,
      },
      fileFilter: validatePortfolioImageFile,
    }),
  )
  async create(
    @Body() body: CreatePortfolioItemDto,
    @UploadedFile() imageFile?: UploadedImageFile,
  ): Promise<PortfolioMutationResponseDto> {
    if (imageFile) {
      validatePortfolioImageContent(imageFile);
    }

    if (!imageFile && !body.img) {
      throw new BadRequestException(
        'Provide either img or an uploaded image file.',
      );
    }

    const item = await this.service.createPortfolioItem(
      {
        title: body.title,
        title_en: body.title_en,
        slug: body.slug,
        href: body.href,
        desc: body.desc,
        desc_en: body.desc_en,
        tags: body.tags,
        img: body.img ?? '',
        isLogo: body.isLogo,
        newTech: body.newTech,
        order: body.order,
        status: body.status,
        repoUrl: body.repoUrl,
      },
      imageFile,
    );

    return toPublicPortfolioMutationResponse(item);
  }

  @Patch(':id')
  @ApiBearerAuth('admin-token')
  @UseGuards(OpsTokenGuard)
  @ApiOperation({
    summary: 'Partially update a portfolio item',
  })
  @ApiParam({
    name: 'id',
    example: 'item-1',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(UpdatePortfolioItemDto) },
        {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      ],
    },
  })
  @ApiOkResponse({ type: PortfolioMutationResponseDto })
  @ApiBadRequestResponse({
    description: 'Missing update fields/image or invalid payload',
  })
  @ApiNotFoundResponse({
    description: 'Portfolio item not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid admin bearer token',
  })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: {
        fileSize: PORTFOLIO_UPLOAD_FILE_SIZE_LIMIT,
        files: 1,
      },
      fileFilter: validatePortfolioImageFile,
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() body: UpdatePortfolioItemDto,
    @UploadedFile() imageFile?: UploadedImageFile,
  ): Promise<PortfolioMutationResponseDto> {
    if (imageFile) {
      validatePortfolioImageContent(imageFile);
    }

    if (!imageFile && Object.keys(body).length === 0) {
      throw new BadRequestException(
        'Provide at least one field or an uploaded image file.',
      );
    }

    const item = await this.service.updatePortfolioItem(id, body, imageFile);

    if (!item) {
      throw new NotFoundException(`Portfolio item ${id} not found`);
    }

    return toPublicPortfolioMutationResponse(item);
  }

  @Delete(':id')
  @ApiBearerAuth('admin-token')
  @UseGuards(OpsTokenGuard)
  @ApiOperation({
    summary: 'Delete a portfolio item',
  })
  @ApiParam({
    name: 'id',
    example: 'item-1',
  })
  @ApiOkResponse({ type: PortfolioDeleteResponseDto })
  @ApiNotFoundResponse({
    description: 'Portfolio item not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid admin bearer token',
  })
  async remove(@Param('id') id: string): Promise<PortfolioDeleteResponseDto> {
    const deleted = await this.service.deletePortfolioItem(id);

    if (!deleted) {
      throw new NotFoundException(`Portfolio item ${id} not found`);
    }

    return toPublicPortfolioDeleteResponse();
  }
}
