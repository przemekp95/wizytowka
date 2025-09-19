import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactAdminController } from './contact.admin.controller';
import { ContactService } from './contact.service';
import { ContactResolver } from './contact.resolver';

@Module({
  controllers: [ContactController, ContactAdminController],
  providers: [ContactService, ContactResolver],
})
export class ContactModule {}
