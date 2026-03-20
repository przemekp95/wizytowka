import { Injectable } from '@nestjs/common';
import {
  ChatSessionSnapshot,
  type ChatSessionStorePort,
} from '../application/ports/chat-session-store.port';

@Injectable()
export class InMemoryChatSessionStore implements ChatSessionStorePort {
  private readonly sessions = new Map<string, ChatSessionSnapshot>();

  async load(sessionId: string): Promise<ChatSessionSnapshot | null> {
    const snapshot = this.sessions.get(sessionId);

    if (!snapshot) {
      return null;
    }

    return {
      messages: snapshot.messages.map((message) => ({ ...message })),
      lastActivity: new Date(snapshot.lastActivity),
    };
  }

  async save(sessionId: string, snapshot: ChatSessionSnapshot): Promise<void> {
    this.sessions.set(sessionId, {
      messages: snapshot.messages.map((message) => ({ ...message })),
      lastActivity: new Date(snapshot.lastActivity),
    });
  }

  async deleteExpired(before: Date): Promise<void> {
    for (const [sessionId, snapshot] of this.sessions.entries()) {
      if (snapshot.lastActivity.getTime() < before.getTime()) {
        this.sessions.delete(sessionId);
      }
    }
  }
}
