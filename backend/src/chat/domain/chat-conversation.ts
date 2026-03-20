export type ChatRole = 'system' | 'user' | 'assistant';

export type ChatPromptMessage = {
  role: ChatRole;
  content: string;
};

export class ChatConversation {
  private constructor(
    private readonly sessionIdValue: string,
    private readonly messages: ChatPromptMessage[],
  ) {}

  static start(sessionId: string, systemPrompt: string): ChatConversation {
    return new ChatConversation(sessionId, [
      {
        role: 'system',
        content: systemPrompt.trim(),
      },
    ]);
  }

  static restore(
    sessionId: string,
    messages: ReadonlyArray<ChatPromptMessage>,
  ): ChatConversation {
    return new ChatConversation(
      sessionId,
      messages.map((message) => ({ ...message })),
    );
  }

  get sessionId(): string {
    return this.sessionIdValue;
  }

  addUserMessage(message: string): void {
    this.messages.push({
      role: 'user',
      content: message.trim(),
    });
  }

  addAssistantMessage(message: string): void {
    this.messages.push({
      role: 'assistant',
      content: message.trim(),
    });
  }

  toMessages(): ChatPromptMessage[] {
    return this.messages.map((message) => ({ ...message }));
  }
}
