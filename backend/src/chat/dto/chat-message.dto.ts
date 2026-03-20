import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ChatMessageDto {
  @ApiProperty({ example: 'Opowiedz o portfolio.' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message: string;

  @ApiPropertyOptional({ example: 'session-123' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sessionId?: string;
}

export class ChatResponseDto {
  @ApiProperty({
    example: 'Przemyslaw tworzy aplikacje full-stack w React i NestJS.',
  })
  @IsString()
  response: string;

  @ApiProperty({ example: 'session-123' })
  @IsString()
  sessionId: string;
}
