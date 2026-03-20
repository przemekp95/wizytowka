import { ChatPromptMessage } from '../../domain/chat-conversation';

export const CHAT_COMPLETION_PORT = Symbol('CHAT_COMPLETION_PORT');

export type ChatCompletionCommand = {
  messages: ChatPromptMessage[];
  model: string;
  maxTokens: number;
  temperature: number;
};

export type ChatCompletionPort = {
  complete(command: ChatCompletionCommand): Promise<{ content: string }>;
};
