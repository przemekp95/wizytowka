import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { OpenAI } from 'openai';
import { chatConfig } from '../../config';
import { ChatUnavailableException } from '../chat.errors';
import {
  ChatCompletionCommand,
  type ChatCompletionPort,
} from '../application/ports/chat-completion.port';

@Injectable()
export class OpenAiChatCompletionAdapter implements ChatCompletionPort {
  private readonly logger = new Logger(OpenAiChatCompletionAdapter.name);
  private client: OpenAI | null = null;

  constructor(
    @Inject(chatConfig.KEY)
    private readonly chatConfiguration: ConfigType<typeof chatConfig>,
  ) {}

  async complete(command: ChatCompletionCommand): Promise<{ content: string }> {
    const completion = await this.getClient().chat.completions.create({
      model: command.model,
      messages: command.messages,
      max_tokens: command.maxTokens,
      temperature: command.temperature,
    });

    return {
      content:
        completion.choices[0]?.message?.content ||
        'Przepraszam, nie mogę odpowiedzieć w tej chwili.',
    };
  }

  private getClient(): OpenAI {
    if (!this.chatConfiguration.enabled || !this.chatConfiguration.apiKey) {
      throw new ChatUnavailableException();
    }

    if (!this.client) {
      this.client = new OpenAI({
        apiKey: this.chatConfiguration.apiKey,
      });
      this.logger.log('OpenAI client initialized successfully');
    }

    return this.client;
  }
}
