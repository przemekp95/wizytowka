import { IsString, IsOptional } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class ChatResponseDto {
  @IsString()
  response: string;

  @IsString()
  sessionId: string;
}
