import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { chatConfig } from '../config';
import {
  CHAT_COMPLETION_PORT,
  type ChatCompletionPort,
} from './application/ports/chat-completion.port';
import {
  CHAT_CONTEXT_PORT,
  type ChatContextPort,
} from './application/ports/chat-context.port';
import {
  CHAT_SESSION_ID_PORT,
  type ChatSessionIdPort,
} from './application/ports/chat-session-id.port';
import {
  CHAT_SESSION_STORE_PORT,
  type ChatSessionStorePort,
} from './application/ports/chat-session-store.port';
import { ChatConversation } from './domain/chat-conversation';
import { ChatUnavailableException } from './chat.errors';

export type SendChatMessageResult =
  | {
      kind: 'completed';
      content: string;
      sessionId: string;
    }
  | {
      kind: 'completion_failed';
      sessionId: string;
    };

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Inject(CHAT_COMPLETION_PORT)
    private readonly completionPort: ChatCompletionPort,
    @Inject(CHAT_CONTEXT_PORT)
    private readonly contextPort: ChatContextPort,
    @Inject(CHAT_SESSION_STORE_PORT)
    private readonly sessionStore: ChatSessionStorePort,
    @Inject(CHAT_SESSION_ID_PORT)
    private readonly sessionIdPort: ChatSessionIdPort,
    @Inject(chatConfig.KEY)
    private readonly chatConfiguration: ConfigType<typeof chatConfig>,
  ) {}

  async sendMessage(
    message: string,
    sessionId?: string,
  ): Promise<SendChatMessageResult> {
    this.ensureChatAvailable();
    const currentSessionId = sessionId?.trim() || this.sessionIdPort.next();
    const lastActivity = new Date();

    await this.sessionStore.deleteExpired(
      new Date(lastActivity.getTime() - this.chatConfiguration.sessionMaxAgeMs),
    );

    const existingSession = await this.sessionStore.load(currentSessionId);
    const conversation = existingSession
      ? ChatConversation.restore(currentSessionId, existingSession.messages)
      : ChatConversation.start(
          currentSessionId,
          await this.contextPort.buildSystemPrompt(),
        );

    conversation.addUserMessage(message);

    try {
      const completion = await this.completionPort.complete({
        messages: conversation.toMessages(),
        model: this.chatConfiguration.model,
        maxTokens: this.chatConfiguration.maxTokens,
        temperature: this.chatConfiguration.temperature,
      });
      const response = completion.content;
      conversation.addAssistantMessage(response);

      await this.sessionStore.save(currentSessionId, {
        messages: conversation.toMessages(),
        lastActivity,
      });

      return {
        kind: 'completed',
        content: response,
        sessionId: currentSessionId,
      };
    } catch (error) {
      if (error instanceof ChatUnavailableException) {
        throw error;
      }

      this.logger.error('Error communicating with OpenAI:', error);
      return {
        kind: 'completion_failed',
        sessionId: currentSessionId,
      };
    }
  }

  private ensureChatAvailable(): void {
    if (!this.chatConfiguration.enabled || !this.chatConfiguration.apiKey) {
      throw new ChatUnavailableException();
    }
  }
}
