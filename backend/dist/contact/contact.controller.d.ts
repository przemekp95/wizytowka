import { ContactService } from './contact.service';
import { ContactDto } from './contact.dto';
import type { Request } from 'express';
export declare class ContactController {
    private readonly contact;
    constructor(contact: ContactService);
    send(dto: ContactDto, req: Request): Promise<{
        ok: boolean;
        messageId: any;
    }>;
}
