import { UseGuards } from '@nestjs/common';
import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { ContactResult } from './dto/contact-result.type';
import { ContactMessageInput } from './dto/contact-message.input';
import { ContactService } from './contact.service';
import type { Request } from 'express';
import { GqlThrottlerGuard } from '../common/guards/gql-throttler.guard';

@Resolver()
@UseGuards(GqlThrottlerGuard)
export class ContactResolver {
  constructor(private readonly contactService: ContactService) {}

  @Mutation(() => ContactResult)
  async sendContact(
    @Args('input') input: ContactMessageInput,
    @Context('req') req: Request,
  ): Promise<ContactResult> {
    const requestId = req.requestId;

    const result = await this.contactService.createAndNotify({
      name: input.name,
      email: input.email,
      message: input.message,
      ip: req.ip,
      requestId,
    });

    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
      };
    }

    return {
      ok: true,
      error: undefined,
    };
  }
}
