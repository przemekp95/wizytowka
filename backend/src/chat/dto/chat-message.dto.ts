import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ChatMessageDto {
  @ApiProperty({ example: 'Opowiedz o portfolio.' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsString()
  @IsUUID('4')
  sessionId?: string;
}

export class ChatResponseDto {
  @ApiProperty({
    example: 'Przemyslaw tworzy aplikacje full-stack w React i NestJS.',
  })
  @IsString()
  response: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  sessionId: string;
}
