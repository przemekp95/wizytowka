import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { ContactResolver } from './contact.resolver';

@Module({
  controllers: [ContactController],
  providers: [ContactService, ContactResolver],
})
export class ContactModule {}
