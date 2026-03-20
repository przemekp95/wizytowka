export type ContactSubmissionProps = {
  name: string;
  email: string;
  message: string;
  ip?: string;
  requestId?: string;
};

export class ContactSubmission {
  private constructor(
    private readonly props: Readonly<ContactSubmissionProps>,
  ) {}

  static create(input: ContactSubmissionProps): ContactSubmission {
    return new ContactSubmission({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      message: input.message.trim(),
      ...(input.ip?.trim() ? { ip: input.ip.trim() } : {}),
      ...(input.requestId?.trim() ? { requestId: input.requestId.trim() } : {}),
    });
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get message(): string {
    return this.props.message;
  }

  get ip(): string | undefined {
    return this.props.ip;
  }

  get requestId(): string | undefined {
    return this.props.requestId;
  }

  toObject(): Readonly<ContactSubmissionProps> {
    return { ...this.props };
  }
}
