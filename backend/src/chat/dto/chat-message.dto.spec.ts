import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ChatMessageDto } from './chat-message.dto';

describe('ChatMessageDto', () => {
  it('accepts a bounded message payload', async () => {
    const payload = plainToInstance(ChatMessageDto, {
      message: 'Jakie technologie znasz?',
      sessionId: 'session-123',
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

  it('rejects an overlong session id', async () => {
    const payload = plainToInstance(ChatMessageDto, {
      message: 'test',
      sessionId: 's'.repeat(101),
    });

    const errors = await validate(payload);

    expect(errors.some((error) => error.property === 'sessionId')).toBe(true);
  });
});
