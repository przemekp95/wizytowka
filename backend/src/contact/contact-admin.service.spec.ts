import { Test } from '@nestjs/testing';
import { ContactAdminService } from './contact-admin.service';
import {
  CONTACT_MESSAGE_READ_PORT,
  type ContactMessageReadPort,
} from './application/ports/contact-message-read.port';

describe('ContactAdminService', () => {
  let service: ContactAdminService;
  let readPortMock: jest.Mocked<ContactMessageReadPort>;

  beforeEach(async () => {
    readPortMock = {
      listMessages: jest.fn().mockResolvedValue({
        items: [],
        nextCursor: undefined,
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ContactAdminService,
        {
          provide: CONTACT_MESSAGE_READ_PORT,
          useValue: readPortMock,
        },
      ],
    }).compile();

    service = moduleRef.get(ContactAdminService);
  });

  it('delegates bounded read queries through the contact read port', async () => {
    await expect(
      service.listMessages({
        limit: 999,
        cursor: 'cursor-123',
      }),
    ).resolves.toEqual({
      items: [],
      nextCursor: undefined,
    });

    expect(readPortMock.listMessages).toHaveBeenCalledWith({
      limit: 100,
      cursor: 'cursor-123',
    });
  });
});
