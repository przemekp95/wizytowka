import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sessionId?: string;
}

export class ChatResponseDto {
  @IsString()
  response: string;

  @IsString()
  sessionId: string;
}
