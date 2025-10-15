  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    options: RetryOptions,
    requestId?: string,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          this.logger.warn(
            `Retry attempt ${attempt}/${options.maxRetries} for requestId=${requestId}`,
          );
        }

        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === options.maxRetries) {
          break; // Ostatnia próba, nie czekamy więcej
        }

        const delay = Math.min(
          options.baseDelay * Math.pow(2, attempt),
          options.maxDelay,
        );

        this.logger.warn(
          `Email send failed (attempt ${attempt + 1}), retrying in ${delay}ms. ` +
            `Error: ${(error as Error).message} requestId=${requestId}`,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  async sendMail(params: CreateContactInput): Promise<{ messageId: string }> {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || '';
    const to = process.env.SMTP_TO || process.env.SMTP_USER || '';

    if (!process.env.SMTP_HOST || !from || !to) {
      throw new Error('Brak konfiguracji SMTP (HOST/FROM/TO)');
    }

    const lines: string[] = [
      `Imię i nazwisko: ${params.name}`,
      `E-mail: ${params.email}`,
      params.ip ? `IP: ${params.ip}` : '',
      params.requestId ? `Request-Id: ${params.requestId}` : '',
      '---',
      params.message,
    ].filter(Boolean);

    const retryOptions: RetryOptions = {
      maxRetries: 3,
      baseDelay: 1000, // 1 sekunda
      maxDelay: 10000, // 10 sekund max
    };

    const result = await this.retryWithBackoff(
      async () => {
        const info = await this.transporter.sendMail({
          from,
          to,
          replyTo: params.email,
          subject: `Wiadomość ze strony – ${params.name}`,
          text: lines.join('\n'),
          headers: { 'X-Request-Id': params.requestId ?? '' },
        });

        this.logger.log(
          `Mail sent successfully: messageId=${info.messageId} ` +
            `accepted=${JSON.stringify(info.accepted)} ` +
            `rejected=${JSON.stringify(info.rejected)} req=${params.requestId}`,
        );

        return { messageId: info.messageId };
      },
      retryOptions,
      params.requestId,
    );

    return result;
  }

  async createAndNotify(params: CreateContactInput): Promise<{
    ok: true;
    messageId?: string;
    savedId?: string;
  }> {
    let savedId: string | undefined;

    try {
      const saved = await this.prisma.contactMessage.create({
        data: {
          name: params.name,
          email: params.email,
          message: params.message,
          ip: params.ip ?? null,
        },
        select: { id: true },
      });
      savedId = saved.id;
    } catch (e) {
      this.logger.warn(
        `DB save failed, continuing. requestId=${params.requestId} reason=${(e as Error).message}`,
      );
    }

    try {
      const { messageId } = await this.sendMail(params);
      return { ok: true, messageId, savedId };
    } catch (e) {
      this.logger.error(
        `Mail send failed. requestId=${params.requestId} reason=${(e as Error).message}`,
      );
      return { ok: true, savedId };
    }
  }
}
