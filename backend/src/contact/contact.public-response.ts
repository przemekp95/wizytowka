import type {
  ContactSubmissionFailureCode,
  CreateContactResult,
} from './contact.service';

export type PublicContactResponse =
  | {
      ok: true;
      error?: undefined;
    }
  | {
      ok: false;
      error: string;
    };

const PUBLIC_CONTACT_ERROR_MESSAGES: Record<
  ContactSubmissionFailureCode,
  string
> = {
  contact_persistence_failed:
    'Nie udalo sie zapisac wiadomosci. Sprobuj ponownie pozniej.',
};

export function toPublicContactResponse(
  result: CreateContactResult,
): PublicContactResponse {
  if (result.ok) {
    return { ok: true };
  }

  return {
    ok: false,
    error: PUBLIC_CONTACT_ERROR_MESSAGES[result.failureCode],
  };
}
