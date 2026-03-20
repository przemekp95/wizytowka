export const CHAT_CONTEXT_PORT = Symbol('CHAT_CONTEXT_PORT');

export type ChatContextPort = {
  buildSystemPrompt(): Promise<string>;
};
