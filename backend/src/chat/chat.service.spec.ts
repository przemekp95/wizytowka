import { Test } from '@nestjs/testing';
import type { ConfigType } from '@nestjs/config';
import { chatConfig } from '../config';
import {
  CHAT_COMPLETION_PORT,
  type ChatCompletionPort,
} from './application/ports/chat-completion.port';
import {
  CHAT_CONTEXT_PORT,
  type ChatContextPort,
} from './application/ports/chat-context.port';
import {
  CHAT_SESSION_ID_PORT,
  type ChatSessionIdPort,
} from './application/ports/chat-session-id.port';
import {
  CHAT_SESSION_STORE_PORT,
  type ChatSessionStorePort,
} from './application/ports/chat-session-store.port';
import { ChatUnavailableException } from './chat.errors';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  const completionPort: jest.Mocked<ChatCompletionPort> = {
    complete: jest.fn(),
  };
  const contextPort: jest.Mocked<ChatContextPort> = {
    buildSystemPrompt: jest.fn(),
  };
  const sessionStore: jest.Mocked<ChatSessionStorePort> = {
    load: jest.fn(),
    save: jest.fn(),
    deleteExpired: jest.fn(),
  };
  const sessionIdPort: jest.Mocked<ChatSessionIdPort> = {
    next: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    contextPort.buildSystemPrompt.mockResolvedValue('SYSTEM PROMPT');
    completionPort.complete.mockResolvedValue({
      content: 'Hej, moge pomoc.',
    });
    sessionStore.load.mockResolvedValue(null);
    sessionStore.save.mockResolvedValue();
    sessionStore.deleteExpired.mockResolvedValue();
    sessionIdPort.next.mockReturnValue('chat-session-1');
  });

  async function createService(
    overrides?: Partial<ConfigType<typeof chatConfig>>,
  ): Promise<ChatService> {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: CHAT_COMPLETION_PORT,
          useValue: completionPort,
        },
        {
          provide: CHAT_CONTEXT_PORT,
          useValue: contextPort,
        },
        {
          provide: CHAT_SESSION_STORE_PORT,
          useValue: sessionStore,
        },
        {
          provide: CHAT_SESSION_ID_PORT,
          useValue: sessionIdPort,
        },
        {
          provide: chatConfig.KEY,
          useValue: {
            apiKey: 'test-key',
            enabled: true,
            model: 'gpt-3.5-turbo',
            maxTokens: 500,
            temperature: 0.7,
            sessionMaxAgeMs: 24 * 60 * 60 * 1000,
            ...overrides,
          } satisfies ConfigType<typeof chatConfig>,
        },
      ],
    }).compile();

    return moduleRef.get(ChatService);
  }

  it('throws a controlled unavailable error when chat is disabled', async () => {
    const service = await createService({
      apiKey: undefined,
      enabled: false,
    });

    await expect(service.sendMessage('Czesc')).rejects.toBeInstanceOf(
      ChatUnavailableException,
    );
    expect(completionPort.complete).not.toHaveBeenCalled();
  });

  it('starts a new conversation through ports and stores the assistant response', async () => {
    const service = await createService();

    const result = await service.sendMessage('  Opowiedz o portfolio  ');

    expect(result).toEqual({
      kind: 'completed',
      content: 'Hej, moge pomoc.',
      sessionId: 'chat-session-1',
    });
    expect(contextPort.buildSystemPrompt).toHaveBeenCalledTimes(1);
    expect(completionPort.complete).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-3.5-turbo',
        maxTokens: 500,
        messages: [
          {
            role: 'system',
            content: 'SYSTEM PROMPT',
          },
          {
            role: 'user',
            content: 'Opowiedz o portfolio',
          },
        ],
      }),
    );
    expect(sessionStore.save).toHaveBeenCalledWith(
      'chat-session-1',
      expect.objectContaining({
        messages: [
          {
            role: 'system',
            content: 'SYSTEM PROMPT',
          },
          {
            role: 'user',
            content: 'Opowiedz o portfolio',
          },
          {
            role: 'assistant',
            content: 'Hej, moge pomoc.',
          },
        ],
      }),
    );
  });

  it('reuses an existing conversation without rebuilding the system prompt', async () => {
    sessionStore.load.mockResolvedValue({
      messages: [
        {
          role: 'system',
          content: 'SYSTEM PROMPT',
        },
        {
          role: 'assistant',
          content: 'Wczesniejsza odpowiedz',
        },
      ],
      lastActivity: new Date('2026-03-20T12:00:00.000Z'),
    });

    const service = await createService();
    await service.sendMessage('Co dalej?', 'existing-session');

    expect(contextPort.buildSystemPrompt).not.toHaveBeenCalled();
    expect(completionPort.complete).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          {
            role: 'system',
            content: 'SYSTEM PROMPT',
          },
          {
            role: 'assistant',
            content: 'Wczesniejsza odpowiedz',
          },
          {
            role: 'user',
            content: 'Co dalej?',
          },
        ],
      }),
    );
  });

  it('returns a fallback message when the completion provider fails', async () => {
    completionPort.complete.mockRejectedValue(new Error('OpenAI timeout'));

    const service = await createService();
    const result = await service.sendMessage('Pomoz');

    expect(result).toEqual({
      kind: 'completion_failed',
      sessionId: 'chat-session-1',
    });
    expect(sessionStore.save).not.toHaveBeenCalled();
  });
});
