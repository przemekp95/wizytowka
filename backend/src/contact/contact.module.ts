import { Module } from '@nestjs/common';
import { GqlThrottleStorageService } from '../common/guards/gql-throttle-storage.service';
import { GqlThrottlerGuard } from '../common/guards/gql-throttler.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { OpsTokenGuard } from '../common/guards/ops-token.guard';
import { CONTACT_MESSAGE_REPOSITORY } from './application/ports/contact-message-repository.port';
import { CONTACT_NOTIFICATION_PORT } from './application/ports/contact-notification.port';
import { ContactAdminController } from './contact.admin.controller';
import { ContactController } from './contact.controller';
import { ContactAdminService } from './contact-admin.service';
import { ContactService } from './contact.service';
import { ContactResolver } from './contact.resolver';
import { PrismaContactMessageRepository } from './infrastructure/prisma-contact-message.repository';
import { SmtpContactNotificationAdapter } from './infrastructure/smtp-contact-notification.adapter';
import { ContactHttpThrottlerGuard } from '../common/guards/public-http-throttler.guard';

@Module({
  imports: [PrismaModule],
  controllers: [ContactAdminController, ContactController],
  providers: [
    GqlThrottleStorageService,
    ContactAdminService,
    ContactService,
    ContactResolver,
    PrismaContactMessageRepository,
    SmtpContactNotificationAdapter,
    {
      provide: CONTACT_MESSAGE_REPOSITORY,
      useExisting: PrismaContactMessageRepository,
    },
    {
      provide: CONTACT_NOTIFICATION_PORT,
      useExisting: SmtpContactNotificationAdapter,
    },
    GqlThrottlerGuard,
    ContactHttpThrottlerGuard,
    OpsTokenGuard,
  ],
})
export class ContactModule {}
