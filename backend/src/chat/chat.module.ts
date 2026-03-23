import { Module } from '@nestjs/common';
import { GqlThrottleStorageService } from '../common/guards/gql-throttle-storage.service';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { ChatController } from './chat.controller';
import { CHAT_COMPLETION_PORT } from './application/ports/chat-completion.port';
import { CHAT_CONTEXT_PORT } from './application/ports/chat-context.port';
import { CHAT_SESSION_ID_PORT } from './application/ports/chat-session-id.port';
import { CHAT_SESSION_STORE_PORT } from './application/ports/chat-session-store.port';
import { ChatService } from './chat.service';
import { InMemoryChatSessionStore } from './infrastructure/in-memory-chat-session.store';
import { OpenAiChatCompletionAdapter } from './infrastructure/openai-chat-completion.adapter';
import { PortfolioChatContextAdapter } from './infrastructure/portfolio-chat-context.adapter';
import { UuidChatSessionIdAdapter } from './infrastructure/uuid-chat-session-id.adapter';
import { ChatHttpThrottlerGuard } from '../common/guards/public-http-throttler.guard';

@Module({
  imports: [PortfolioModule],
  controllers: [ChatController],
  providers: [
    GqlThrottleStorageService,
    ChatService,
    InMemoryChatSessionStore,
    OpenAiChatCompletionAdapter,
    PortfolioChatContextAdapter,
    UuidChatSessionIdAdapter,
    {
      provide: CHAT_COMPLETION_PORT,
      useExisting: OpenAiChatCompletionAdapter,
    },
    {
      provide: CHAT_CONTEXT_PORT,
      useExisting: PortfolioChatContextAdapter,
    },
    {
      provide: CHAT_SESSION_STORE_PORT,
      useExisting: InMemoryChatSessionStore,
    },
    {
      provide: CHAT_SESSION_ID_PORT,
      useExisting: UuidChatSessionIdAdapter,
    },
    ChatHttpThrottlerGuard,
  ],
  exports: [ChatService],
})
export class ChatModule {}
