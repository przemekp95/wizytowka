import type { ConfigType } from '@nestjs/config';
import { chatConfig } from '../../config';
import { InMemoryChatSessionStore } from './in-memory-chat-session.store';

describe('InMemoryChatSessionStore retention', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(Date.parse('2026-03-23T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('removes a session when its configured retention period expires without new traffic', async () => {
    const store = new InMemoryChatSessionStore({
      apiKey: 'test-key',
      enabled: true,
      model: 'gpt-3.5-turbo',
      maxTokens: 500,
      temperature: 0.7,
      sessionMaxAgeMs: 1_000,
    } satisfies ConfigType<typeof chatConfig>);

    await store.save('session-1', {
      messages: [{ role: 'system', content: 'System prompt' }],
      lastActivity: new Date(),
    });

    await jest.advanceTimersByTimeAsync(1_001);

    await expect(store.load('session-1')).resolves.toBeNull();
    store.onModuleDestroy();
  });
});
