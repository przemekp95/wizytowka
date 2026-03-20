import { Test } from '@nestjs/testing';
import { ContactService } from './contact.service';
import {
  CONTACT_MESSAGE_REPOSITORY,
  type ContactMessageRepositoryPort,
} from './application/ports/contact-message-repository.port';
import {
  CONTACT_NOTIFICATION_PORT,
  type ContactNotificationPort,
} from './application/ports/contact-notification.port';

describe('ContactService', () => {
  let service: ContactService;
  let repositoryMock: jest.Mocked<ContactMessageRepositoryPort>;
  let notificationMock: jest.Mocked<ContactNotificationPort>;

  beforeEach(async () => {
    jest.clearAllMocks();

    repositoryMock = {
      save: jest.fn().mockResolvedValue({ id: 'saved-123' }),
    };

    notificationMock = {
      send: jest.fn().mockResolvedValue({
        messageId: 'test-id',
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ContactService,
        {
          provide: CONTACT_MESSAGE_REPOSITORY,
          useValue: repositoryMock,
        },
        {
          provide: CONTACT_NOTIFICATION_PORT,
          useValue: notificationMock,
        },
      ],
    }).compile();

    service = moduleRef.get(ContactService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('delegates sendMail to the notification port with normalized domain input', async () => {
    const result = await service.sendMail({
      name: ' Jan ',
      email: 'JAN@test.local',
      message: ' Treść wiadomości ',
      ip: '203.0.113.7',
      requestId: 'req-123',
    });

    expect(result).toEqual({ messageId: 'test-id' });
    expect(notificationMock.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Jan',
        email: 'jan@test.local',
        message: 'Treść wiadomości',
        ip: '203.0.113.7',
        requestId: 'req-123',
      }),
    );
  });

  it('saves through the repository port and notifies successfully', async () => {
    const result = await service.createAndNotify({
      name: 'Ala',
      email: 'ala@test.local',
      message: 'Hej',
      ip: '127.0.0.1',
      requestId: 'db-email-test',
    });

    expect(result).toEqual({
      ok: true,
      messageId: 'test-id',
      savedId: 'saved-123',
    });

    expect(repositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ala',
        email: 'ala@test.local',
        message: 'Hej',
        ip: '127.0.0.1',
      }),
    );
    expect(notificationMock.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ala',
        email: 'ala@test.local',
        message: 'Hej',
        ip: '127.0.0.1',
        requestId: 'db-email-test',
      }),
    );
  });

  it('stops when persistence fails', async () => {
    repositoryMock.save.mockRejectedValue(new Error('Database connection failed'));

    const result = await service.createAndNotify({
      name: 'Test',
      email: 'test@test.local',
      message: 'Test message',
    });

    expect(result).toEqual({
      ok: false,
      error: 'Nie udalo sie zapisac wiadomosci. Sprobuj ponownie pozniej.',
    });
    expect(notificationMock.send).not.toHaveBeenCalled();
  });

  it('keeps savedId when delivery fails after persistence', async () => {
    notificationMock.send.mockRejectedValue(new Error('SMTP failure'));

    const result = await service.createAndNotify({
      name: 'Test',
      email: 'test@test.local',
      message: 'Test message',
    });

    expect(result).toEqual({
      ok: false,
      error: 'Nie udalo sie dostarczyc wiadomosci. Sprobuj ponownie pozniej.',
      savedId: 'saved-123',
    });
    expect(repositoryMock.save).toHaveBeenCalled();
  });

  it('surfaces notifier errors from sendMail', async () => {
    notificationMock.send.mockRejectedValue(new Error('SMTP failure'));

    await expect(
      service.sendMail({
        name: 'Test',
        email: 'test@test.local',
        message: 'Test message',
      }),
    ).rejects.toThrow('SMTP failure');
  });
});
