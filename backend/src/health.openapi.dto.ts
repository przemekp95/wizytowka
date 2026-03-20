import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ example: 'healthy' })
  status!: string;

  @ApiProperty({ example: '2026-03-20T10:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: 123.45 })
  uptime!: number;

  @ApiProperty({
    example: {
      rss: 123456789,
      heapTotal: 45678901,
      heapUsed: 23456789,
      external: 1234567,
      arrayBuffers: 123456,
    },
  })
  memory!: Record<string, number>;

  @ApiProperty({ example: '1.0.0' })
  version!: string;
}

export class DependencyStatusDto {
  @ApiProperty({ example: 'mongo' })
  name!: string;

  @ApiProperty({ example: true })
  ready!: boolean;

  @ApiPropertyOptional({ example: 'Connection refused' })
  error?: string;
}

export class HealthReadyResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ example: true })
  ready!: boolean;

  @ApiProperty({
    example: {
      prisma: { name: 'prisma', ready: true },
      mongo: { name: 'mongo', ready: true },
    },
  })
  dependencies!: {
    prisma: DependencyStatusDto;
    mongo: DependencyStatusDto;
  };

  @ApiProperty({ example: '2026-03-20T10:00:00.000Z' })
  timestamp!: string;
}

export class HealthLiveResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ example: true })
  live!: boolean;

  @ApiProperty({ example: '2026-03-20T10:00:00.000Z' })
  timestamp!: string;
}
