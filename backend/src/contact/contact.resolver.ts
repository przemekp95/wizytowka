import { Inject, UseGuards } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { ContactResult } from './dto/contact-result.type';
import { ContactMessageInput } from './dto/contact-message.input';
import { ContactService } from './contact.service';
import type { Request } from 'express';
import { GqlThrottlerGuard } from '../common/guards/gql-throttler.guard';
import { resolveRequestTracker } from '../common/security/trusted-client-ip';
import { appConfig } from '../config';
import { toPublicContactResponse } from './contact.public-response';

@Resolver()
@UseGuards(GqlThrottlerGuard)
export class ContactResolver {
  constructor(
    private readonly contactService: ContactService,
    @Inject(appConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,
  ) {}

  @Mutation(() => ContactResult, {
    description:
      'Submit a public contact message. This mutation is rate-limited and returns ok=true once the message is persisted and queued for async delivery.',
  })
  async sendContact(
    @Args('input') input: ContactMessageInput,
    @Context('req') req: Request,
  ): Promise<ContactResult> {
    const requestId = req.requestId;

    const result = await this.contactService.createAndQueueNotification({
      name: input.name,
      email: input.email,
      message: input.message,
      ip: resolveRequestTracker(
        req,
        this.appConfiguration.internalProxySharedSecret,
      ),
      requestId,
    });

    return toPublicContactResponse(result);
  }
}
