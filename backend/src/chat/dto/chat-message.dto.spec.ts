import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ChatMessageDto } from './chat-message.dto';

describe('ChatMessageDto', () => {
  it('accepts a bounded message payload with a UUID v4 session id', async () => {
    const payload = plainToInstance(ChatMessageDto, {
      message: 'Jakie technologie znasz?',
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
    });

    await expect(validate(payload)).resolves.toHaveLength(0);
  });

  it('rejects an empty message', async () => {
    const payload = plainToInstance(ChatMessageDto, {
      message: '',
    });

    const errors = await validate(payload);

    expect(errors.some((error) => error.property === 'message')).toBe(true);
  });

  it('rejects a client-chosen non-UUID session id', async () => {
    const payload = plainToInstance(ChatMessageDto, {
      message: 'test',
      sessionId: 'session-123',
    });

    const errors = await validate(payload);

    expect(errors.some((error) => error.property === 'sessionId')).toBe(true);
  });
});
