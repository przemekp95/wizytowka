import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

function normalizeStringArray(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        return normalizeStringArray(parsed);
      } catch {
        return trimmed
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }

    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return value;
}

function normalizeBoolean(value: unknown): unknown {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }

    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }

  return value;
}

function normalizeInteger(value: unknown): unknown {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : value;
  }

  return value;
}

export class CreatePortfolioItemDto {
  @ApiProperty({ example: 'Project One' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'Project One EN' })
  @IsOptional()
  @ApiProperty({ example: 'project-one' })
  @IsString()
  @MaxLength(200)
  title_en?: string;

  @ApiProperty({ example: '/portfolio/project-one' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  slug!: string;

  @ApiProperty({ example: 'To jest poprawny opis projektu portfolio.' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  href!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  desc!: string;

  @ApiPropertyOptional({ example: 'Project description in English.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  desc_en?: string;

  @ApiProperty({ type: [String], example: ['NestJS', 'MongoDB'] })
  @Transform(({ value }) => normalizeStringArray(value))
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags!: string[];

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  img?: string;

  @ApiPropertyOptional({ example: false })
  @Transform(({ value }) => normalizeBoolean(value))
  @IsOptional()
  @IsBoolean()
  isLogo?: boolean;

  @ApiPropertyOptional({ example: true })
  @Transform(({ value }) => normalizeBoolean(value))
  @IsOptional()
  @IsBoolean()
  newTech?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @Transform(({ value }) => normalizeInteger(value))
  @ApiPropertyOptional({ enum: ['draft', 'published'], example: 'published' })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ example: 'https://github.com/user/project-one' })
  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: 'draft' | 'published';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  repoUrl?: string;
}

export class UpdatePortfolioItemDto {
  @ApiPropertyOptional({ example: 'Updated title' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'Updated title EN' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title_en?: string;

  @ApiPropertyOptional({ example: 'project-one' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  slug?: string;

  @ApiPropertyOptional({ example: '/portfolio/project-one' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  href?: string;

  @ApiPropertyOptional({ example: 'Updated project description.' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  desc?: string;

  @ApiPropertyOptional({ example: 'Updated project description in English.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  desc_en?: string;

  @ApiPropertyOptional({ type: [String], example: ['React', 'TypeScript'] })
  @Transform(({ value }) => normalizeStringArray(value))
  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  img?: string;

  @ApiPropertyOptional({ example: false })
  @Transform(({ value }) => normalizeBoolean(value))
  @IsOptional()
  @IsBoolean()
  isLogo?: boolean;

  @ApiPropertyOptional({ example: true })
  @Transform(({ value }) => normalizeBoolean(value))
  @IsOptional()
  @IsBoolean()
  newTech?: boolean;

  @ApiPropertyOptional({ example: 2 })
  @Transform(({ value }) => normalizeInteger(value))
  @ApiPropertyOptional({ enum: ['draft', 'published'], example: 'draft' })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: 'draft' | 'published';

  @ApiPropertyOptional({ example: 'https://github.com/user/project-one' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  repoUrl?: string;
}

export class PortfolioItemDto {
  @ApiProperty({ example: 'item-1' })
  _id!: string;

  @ApiProperty({ example: 'Project One' })
  title!: string;

  @ApiPropertyOptional({ example: 'Project One EN' })
  title_en?: string;

  @ApiProperty({ example: 'project-one' })
  slug!: string;

  @ApiProperty({ example: '/portfolio/project-one' })
  href!: string;

  @ApiProperty({ example: 'To jest poprawny opis projektu portfolio.' })
  desc!: string;

  @ApiPropertyOptional({ example: 'Project description in English.' })
  desc_en?: string;

  @ApiProperty({ type: [String], example: ['NestJS', 'MongoDB'] })
  tags!: string[];

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  img!: string;

  @ApiPropertyOptional({ example: false })
  isLogo?: boolean;

  @ApiPropertyOptional({ example: true })
  newTech?: boolean;

  @ApiPropertyOptional({ example: 1 })
  order?: number;

  @ApiPropertyOptional({ enum: ['draft', 'published'], example: 'published' })
  status?: 'draft' | 'published';

  @ApiPropertyOptional({ example: '2026-03-20T10:00:00.000Z' })
  createdAt?: Date;

  @ApiPropertyOptional({ example: '2026-03-20T10:00:00.000Z' })
  updatedAt?: Date;

  @ApiPropertyOptional({ example: 'https://github.com/user/project-one' })
  repoUrl?: string;
}

export class PortfolioListResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ type: () => [PortfolioItemDto] })
  items!: PortfolioItemDto[];
}

export class PortfolioMutationResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ type: () => PortfolioItemDto })
  item!: PortfolioItemDto;
}

export class PortfolioDeleteResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ example: true })
  deleted!: true;
}
