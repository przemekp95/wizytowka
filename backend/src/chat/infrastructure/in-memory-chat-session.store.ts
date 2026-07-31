import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { chatConfig } from '../../config';
import {
  ChatSessionSnapshot,
  type ChatSessionStorePort,
} from '../application/ports/chat-session-store.port';

@Injectable()
export class InMemoryChatSessionStore
  implements ChatSessionStorePort, OnModuleDestroy
{
  private readonly sessions = new Map<string, ChatSessionSnapshot>();
  private readonly expiryTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    @Inject(chatConfig.KEY)
    private readonly chatConfiguration: ConfigType<typeof chatConfig>,
  ) {}

  async load(sessionId: string): Promise<ChatSessionSnapshot | null> {
    const snapshot = this.sessions.get(sessionId);

    if (!snapshot) {
      return null;
    }

    if (this.isExpired(snapshot, new Date())) {
      this.remove(sessionId);
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
    this.scheduleExpiry(sessionId);
  }

  async deleteExpired(before: Date): Promise<void> {
    for (const [sessionId, snapshot] of this.sessions.entries()) {
      if (snapshot.lastActivity.getTime() < before.getTime()) {
        this.remove(sessionId);
      }
    }
  }

  onModuleDestroy(): void {
    for (const timer of this.expiryTimers.values()) {
      clearTimeout(timer);
    }
    this.expiryTimers.clear();
    this.sessions.clear();
  }

  private scheduleExpiry(sessionId: string): void {
    const existingTimer = this.expiryTimers.get(sessionId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const snapshot = this.sessions.get(sessionId);
    if (!snapshot) {
      return;
    }

    const expiresAt =
      snapshot.lastActivity.getTime() + this.chatConfiguration.sessionMaxAgeMs;
    const delayMs = Math.max(0, expiresAt - Date.now());
    const timer = setTimeout(() => {
      const current = this.sessions.get(sessionId);
      if (current && this.isExpired(current, new Date())) {
        this.remove(sessionId);
        return;
      }
      this.scheduleExpiry(sessionId);
    }, delayMs);
    timer.unref?.();
    this.expiryTimers.set(sessionId, timer);
  }

  private isExpired(snapshot: ChatSessionSnapshot, now: Date): boolean {
    return (
      snapshot.lastActivity.getTime() +
        this.chatConfiguration.sessionMaxAgeMs <=
      now.getTime()
    );
  }

  private remove(sessionId: string): void {
    this.sessions.delete(sessionId);
    const timer = this.expiryTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.expiryTimers.delete(sessionId);
    }
  }
}
