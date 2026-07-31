import { Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { GqlThrottleStorageService } from '../common/guards/gql-throttle-storage.service';
import { GqlThrottlerGuard } from '../common/guards/gql-throttler.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { OpsTokenGuard } from '../common/guards/ops-token.guard';
import { contactConfig } from '../config';
import { CONTACT_MESSAGE_REPOSITORY } from './application/ports/contact-message-repository.port';
import { CONTACT_MESSAGE_READ_PORT } from './application/ports/contact-message-read.port';
import { CONTACT_NOTIFICATION_DISPATCH_PORT } from './application/ports/contact-notification-dispatch.port';
import {
  CONTACT_NOTIFICATION_SENDER_PORT,
  CONTACT_NOTIFICATION_STATUS_PORT,
} from './application/ports/contact-notification.port';
import { ContactAdminController } from './contact.admin.controller';
import { ContactController } from './contact.controller';
import { ContactAdminService } from './contact-admin.service';
import { ContactDataRetentionService } from './contact-data-retention.service';
import { ContactNotificationConfirmationService } from './contact-notification-confirmation.service';
import { ContactNotificationProcessor } from './contact-notification.processor';
import { ContactService } from './contact.service';
import { ContactResolver } from './contact.resolver';
import { ResendContactWebhookController } from './resend-contact-webhook.controller';
import { ContactNotificationDispatcher } from './infrastructure/contact-notification-dispatcher.service';
import { PrismaContactMessageRepository } from './infrastructure/prisma-contact-message.repository';
import { ResendContactNotificationAdapter } from './infrastructure/resend-contact-notification.adapter';
import { ResendContactWebhookService } from './infrastructure/resend-contact-webhook.service';
import { SmtpContactNotificationAdapter } from './infrastructure/smtp-contact-notification.adapter';
import { ContactHttpThrottlerGuard } from '../common/guards/public-http-throttler.guard';

@Module({
  imports: [PrismaModule],
  controllers: [
    ContactAdminController,
    ContactController,
    ResendContactWebhookController,
  ],
  providers: [
    GqlThrottleStorageService,
    ContactAdminService,
    ContactDataRetentionService,
    ContactNotificationConfirmationService,
    ContactNotificationProcessor,
    ContactNotificationDispatcher,
    ContactService,
    ContactResolver,
    PrismaContactMessageRepository,
    ResendContactNotificationAdapter,
    ResendContactWebhookService,
    SmtpContactNotificationAdapter,
    {
      provide: CONTACT_MESSAGE_REPOSITORY,
      useExisting: PrismaContactMessageRepository,
    },
    {
      provide: CONTACT_MESSAGE_READ_PORT,
      useExisting: PrismaContactMessageRepository,
    },
    {
      provide: CONTACT_NOTIFICATION_SENDER_PORT,
      inject: [
        contactConfig.KEY,
        SmtpContactNotificationAdapter,
        ResendContactNotificationAdapter,
      ],
      useFactory: (
        contactConfiguration: ConfigType<typeof contactConfig>,
        smtpAdapter: SmtpContactNotificationAdapter,
        resendAdapter: ResendContactNotificationAdapter,
      ) =>
        contactConfiguration.notificationProvider === 'resend'
          ? resendAdapter
          : smtpAdapter,
    },
    {
      provide: CONTACT_NOTIFICATION_STATUS_PORT,
      inject: [contactConfig.KEY, ResendContactNotificationAdapter],
      useFactory: (
        contactConfiguration: ConfigType<typeof contactConfig>,
        resendAdapter: ResendContactNotificationAdapter,
      ) =>
        contactConfiguration.notificationProvider === 'resend'
          ? resendAdapter
          : undefined,
    },
    {
      provide: CONTACT_NOTIFICATION_DISPATCH_PORT,
      useExisting: ContactNotificationDispatcher,
    },
    GqlThrottlerGuard,
    ContactHttpThrottlerGuard,
    OpsTokenGuard,
  ],
})
export class ContactModule {}
