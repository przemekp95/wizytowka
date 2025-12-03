import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { ContactResult } from './dto/contact-result.type';
import { ContactMessageInput } from './dto/contact-message.input';
import { ContactService } from './contact.service';
// TEMP: Bot detection and throttling disabled for testing - full BotId removal
// import { Throttle } from '@nestjs/throttler';
// import { checkBotId } from 'botid/server';
import type { Request } from 'express';

@Resolver()
export class ContactResolver {
  constructor(private readonly contactService: ContactService) {}

  // @Throttle({ default: { limit: 5, ttl: 60 } }) // TEMP: Disabled throttling for testing
  @Mutation(() => ContactResult)
  async sendContact(
    @Args('input') input: ContactMessageInput,
    @Context('req') req: Request,
  ): Promise<ContactResult> {
    try {
      // TEMP: Bot detection disabled for testing - completely removed
      // No bot detection for simple portfolio site

      const ip =
        (req.headers['x-forwarded-for'] as string | undefined)
          ?.split(',')[0]
          ?.trim() || req.ip;
      const requestId = req.requestId;

      const result = await this.contactService.createAndNotify({
        name: input.name,
        email: input.email,
        message: input.message,
        ip,
        requestId,
      });

      return {
        ok: result.ok,
        error: undefined,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      return { ok: false, error: msg };
    }
  }
}
