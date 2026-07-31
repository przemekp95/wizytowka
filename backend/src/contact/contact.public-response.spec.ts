import { toPublicContactResponse } from './contact.public-response';

describe('toPublicContactResponse', () => {
  it('maps successful application results to ok=true', () => {
    expect(
      toPublicContactResponse({
        ok: true,
        savedId: 'saved-123',
      }),
    ).toEqual({ ok: true });
  });

  it('maps persistence failures to the public error message', () => {
    expect(
      toPublicContactResponse({
        ok: false,
        failureCode: 'contact_persistence_failed',
      }),
    ).toEqual({
      ok: false,
      error: 'Nie udalo sie zapisac wiadomosci. Sprobuj ponownie pozniej.',
    });
  });
});
