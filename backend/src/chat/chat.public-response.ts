import type { SendChatMessageResult } from './chat.service';

export type PublicChatResponse = {
  response: string;
  sessionId: string;
};

const CHAT_PROVIDER_FAILURE_MESSAGE =
  'Przepraszam, wystąpił błąd podczas przetwarzania Twojej wiadomości.';

export function toPublicChatResponse(
  result: SendChatMessageResult,
): PublicChatResponse {
  if (result.kind === 'completed') {
    return {
      response: result.content,
      sessionId: result.sessionId,
    };
  }

  return {
    response: CHAT_PROVIDER_FAILURE_MESSAGE,
    sessionId: result.sessionId,
  };
}
