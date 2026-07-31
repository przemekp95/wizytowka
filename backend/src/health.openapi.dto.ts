import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ example: 'healthy' })
  status!: string;

  @ApiProperty({ example: '2026-03-20T10:00:00.000Z' })
  timestamp!: string;
}

export class DependencyStatusDto {
  @ApiProperty({ example: 'mongo' })
  name!: string;

  @ApiProperty({ example: true })
  ready!: boolean;
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
