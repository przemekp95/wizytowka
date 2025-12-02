import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { ContactResult } from './dto/contact-result.type';
import { ContactMessageInput } from './dto/contact-message.input';
import { ContactService } from './contact.service';
import { Throttle } from '@nestjs/throttler';
import { checkBotId } from 'botid/server';
import type { Request } from 'express';

@Resolver()
export class ContactResolver {
  constructor(private readonly contactService: ContactService) {}

  @Throttle({ default: { limit: 5, ttl: 60 } })
  @Mutation(() => ContactResult)
  async sendContact(
    @Args('input') input: ContactMessageInput,
    @Context('req') req: Request,
  ): Promise<ContactResult> {
    try {
      // Check if the request is from a bot
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const verification = await checkBotId();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (verification.isBot) {
        return { ok: false, error: 'Bot detected. Access denied.' };
      }

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
