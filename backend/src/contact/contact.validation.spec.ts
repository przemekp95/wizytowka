import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ContactDto } from './contact.dto';
import { ContactMessageInput } from './dto/contact-message.input';

describe('Contact validation contracts', () => {
  it.each([
    ['rest dto', ContactDto],
    ['graphql input', ContactMessageInput],
  ])('accepts valid payload for %s', async (_label, Type) => {
    const payload = plainToInstance(Type, {
      name: 'Jan Testowy',
      email: 'jan@example.com',
      message: 'To jest poprawna wiadomosc testowa.',
    });

    await expect(validate(payload)).resolves.toHaveLength(0);
  });

  it.each([
    ['rest dto', ContactDto],
    ['graphql input', ContactMessageInput],
  ])('rejects overlong message for %s', async (_label, Type) => {
    const payload = plainToInstance(Type, {
      name: 'Jan Testowy',
      email: 'jan@example.com',
      message: 'x'.repeat(2001),
    });

    const errors = await validate(payload);

    expect(errors.some((error) => error.property === 'message')).toBe(true);
  });
});
