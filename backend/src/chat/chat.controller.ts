import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatMessageDto } from './dto/chat-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async sendMessage(@Body() chatMessage: ChatMessageDto) {
    return this.chatService.sendMessage(
      chatMessage.message,
      chatMessage.sessionId,
    );
  }
}
