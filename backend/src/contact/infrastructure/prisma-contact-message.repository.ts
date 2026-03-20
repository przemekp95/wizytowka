import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContactSubmission } from '../domain/contact-submission';
import type {
  ContactMessageRepositoryPort,
  PersistedContactMessage,
} from '../application/ports/contact-message-repository.port';

@Injectable()
export class PrismaContactMessageRepository implements ContactMessageRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(submission: ContactSubmission): Promise<PersistedContactMessage> {
    const saved = await this.prisma.contactMessage.create({
      data: {
        name: submission.name,
        email: submission.email,
        message: submission.message,
        ip: submission.ip ?? null,
      },
      select: { id: true },
    });

    return { id: saved.id };
  }
}
