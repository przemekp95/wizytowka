import { Test } from '@nestjs/testing';
import { OpsTokenGuard } from '../common/guards/ops-token.guard';
import { ContactAdminController } from './contact.admin.controller';
import {
  ContactAdminService,
  type ListContactMessagesResult,
} from './contact-admin.service';

describe('ContactAdminController', () => {
  let controller: ContactAdminController;
  const contactAdminService = {
    listMessages: jest.fn<Promise<ListContactMessagesResult>, []>(),
  };

  beforeEach(async () => {
    contactAdminService.listMessages.mockReset();
    contactAdminService.listMessages.mockResolvedValue({
      items: [],
      nextCursor: undefined,
    });

    const moduleRef = await Test.createTestingModule({
      controllers: [ContactAdminController],
      providers: [
        {
          provide: ContactAdminService,
          useValue: contactAdminService,
        },
      ],
    })
      .overrideGuard(OpsTokenGuard)
      .useValue({
        canActivate: jest.fn().mockReturnValue(true),
      })
      .compile();

    controller = moduleRef.get(ContactAdminController);
  });

  it('delegates list queries to the admin read service', async () => {
    await expect(controller.list('25', 'cursor-123')).resolves.toEqual({
      items: [],
      nextCursor: undefined,
    });

    expect(contactAdminService.listMessages).toHaveBeenCalledWith({
      limit: 25,
      cursor: 'cursor-123',
    });
  });
});
