import { Module } from '@nestjs/common';
import { GqlThrottleStorageService } from '../common/guards/gql-throttle-storage.service';
import { GqlThrottlerGuard } from '../common/guards/gql-throttler.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { OpsTokenGuard } from '../common/guards/ops-token.guard';
import { ContactAdminController } from './contact.admin.controller';
import { ContactService } from './contact.service';
import { ContactResolver } from './contact.resolver';

@Module({
  imports: [PrismaModule],
  controllers: [ContactAdminController],
  providers: [
    GqlThrottleStorageService,
    ContactService,
    ContactResolver,
    GqlThrottlerGuard,
    OpsTokenGuard,
  ],
})
export class ContactModule {}
