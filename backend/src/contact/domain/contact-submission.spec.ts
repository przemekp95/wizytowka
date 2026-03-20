import { ContactSubmission } from './contact-submission';

describe('ContactSubmission', () => {
  it('normalizes whitespace and casing for the bounded context input', () => {
    const submission = ContactSubmission.create({
      name: '  Jan Testowy  ',
      email: '  JAN@Example.COM  ',
      message: '  To jest poprawna wiadomosc testowa.  ',
      ip: ' 203.0.113.7 ',
      requestId: ' req-123 ',
    });

    expect(submission.toObject()).toEqual({
      name: 'Jan Testowy',
      email: 'jan@example.com',
      message: 'To jest poprawna wiadomosc testowa.',
      ip: '203.0.113.7',
      requestId: 'req-123',
    });
  });

  it('drops blank optional infrastructure metadata', () => {
    const submission = ContactSubmission.create({
      name: 'Jan Testowy',
      email: 'jan@example.com',
      message: 'To jest poprawna wiadomosc testowa.',
      ip: '   ',
      requestId: '',
    });

    expect(submission.toObject()).toEqual({
      name: 'Jan Testowy',
      email: 'jan@example.com',
      message: 'To jest poprawna wiadomosc testowa.',
    });
  });
});
