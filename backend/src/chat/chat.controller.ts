import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ChatUnavailableResponseDto } from './chat.openapi.dto';
import { ChatService } from './chat.service';
import { ChatMessageDto, ChatResponseDto } from './dto/chat-message.dto';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  @ApiOperation({
    summary: 'Send a chat message to the AI assistant',
  })
  @ApiBody({ type: ChatMessageDto })
  @ApiOkResponse({ type: ChatResponseDto })
  @ApiServiceUnavailableResponse({ type: ChatUnavailableResponseDto })
  async sendMessage(@Body() chatMessage: ChatMessageDto) {
    return this.chatService.sendMessage(
      chatMessage.message,
      chatMessage.sessionId,
    );
  }
}
