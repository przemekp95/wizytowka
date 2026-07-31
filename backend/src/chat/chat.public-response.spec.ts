import { toPublicChatResponse } from './chat.public-response';

describe('toPublicChatResponse', () => {
  it('maps completed chat results to the public response payload', () => {
    expect(
      toPublicChatResponse({
        kind: 'completed',
        content: 'Jasne, moge pomoc.',
        sessionId: 'chat-session-1',
      }),
    ).toEqual({
      response: 'Jasne, moge pomoc.',
      sessionId: 'chat-session-1',
    });
  });

  it('maps completion failures to the fallback public response payload', () => {
    expect(
      toPublicChatResponse({
        kind: 'completion_failed',
        sessionId: 'chat-session-1',
      }),
    ).toEqual({
      response:
        'Przepraszam, wystąpił błąd podczas przetwarzania Twojej wiadomości.',
      sessionId: 'chat-session-1',
    });
  });
});
