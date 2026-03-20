export const CHAT_SESSION_ID_PORT = Symbol('CHAT_SESSION_ID_PORT');

export type ChatSessionIdPort = {
  next(): string;
};
