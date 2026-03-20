import { ChatConversation } from './chat-conversation';

describe('ChatConversation', () => {
  it('starts a new conversation with a normalized system prompt', () => {
    const conversation = ChatConversation.start('session-1', '  System prompt  ');

    expect(conversation.sessionId).toBe('session-1');
    expect(conversation.toMessages()).toEqual([
      {
        role: 'system',
        content: 'System prompt',
      },
    ]);
  });

  it('restores a conversation and appends normalized user and assistant turns', () => {
    const conversation = ChatConversation.restore('session-2', [
      {
        role: 'system',
        content: 'Prompt',
      },
      {
        role: 'assistant',
        content: 'Poprzednia odpowiedz',
      },
    ]);

    conversation.addUserMessage('  Co dalej? ');
    conversation.addAssistantMessage('  Dzialamy dalej.  ');

    expect(conversation.toMessages()).toEqual([
      {
        role: 'system',
        content: 'Prompt',
      },
      {
        role: 'assistant',
        content: 'Poprzednia odpowiedz',
      },
      {
        role: 'user',
        content: 'Co dalej?',
      },
      {
        role: 'assistant',
        content: 'Dzialamy dalej.',
      },
    ]);
  });
});
