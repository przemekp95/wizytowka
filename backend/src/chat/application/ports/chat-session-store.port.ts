import { ChatPromptMessage } from '../../domain/chat-conversation';

export const CHAT_SESSION_STORE_PORT = Symbol('CHAT_SESSION_STORE_PORT');

export type ChatSessionSnapshot = {
  messages: ChatPromptMessage[];
  lastActivity: Date;
};

export type ChatSessionStorePort = {
  load(sessionId: string): Promise<ChatSessionSnapshot | null>;
  save(sessionId: string, snapshot: ChatSessionSnapshot): Promise<void>;
  deleteExpired(before: Date): Promise<void>;
};
