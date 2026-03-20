import { ApiProperty } from '@nestjs/swagger';

export class ChatUnavailableResponseDto {
  @ApiProperty({
    example: 'Chat is unavailable because OPENAI_API_KEY is not configured.',
  })
  error!: string;

  @ApiProperty({ example: 'CHAT_UNAVAILABLE' })
  code!: string;
}
