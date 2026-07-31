import { Test } from '@nestjs/testing';
import { ContactService } from './contact.service';
import {
  CONTACT_MESSAGE_REPOSITORY,
  type ContactMessageRepositoryPort,
} from './application/ports/contact-message-repository.port';
import {
  CONTACT_NOTIFICATION_DISPATCH_PORT,
  type ContactNotificationDispatchPort,
} from './application/ports/contact-notification-dispatch.port';

describe('ContactService', () => {
  let service: ContactService;
  let repositoryMock: jest.Mocked<ContactMessageRepositoryPort>;
  let dispatchMock: jest.Mocked<ContactNotificationDispatchPort>;

  beforeEach(async () => {
    jest.clearAllMocks();

    repositoryMock = {
      save: jest.fn().mockResolvedValue({ id: 'saved-123' }),
      deleteExpired: jest.fn().mockResolvedValue({ messages: 0, webhookEvents: 0 }),
      claimPendingNotifications: jest.fn().mockResolvedValue([]),
      claimSubmittedNotifications: jest.fn().mockResolvedValue([]),
      markNotificationSubmitted: jest.fn().mockResolvedValue(undefined),
      markNotificationDelivered: jest.fn().mockResolvedValue(undefined),
      rescheduleSubmittedNotificationCheck: jest
        .fn()
        .mockResolvedValue(undefined),
      findNotificationIdByMessageId: jest.fn().mockResolvedValue(null),
      markNotificationFailed: jest.fn().mockResolvedValue(undefined),
      recordWebhookEvent: jest.fn().mockResolvedValue('recorded'),
    };

    dispatchMock = {
      kick: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ContactService,
        {
          provide: CONTACT_MESSAGE_REPOSITORY,
          useValue: repositoryMock,
        },
        {
          provide: CONTACT_NOTIFICATION_DISPATCH_PORT,
          useValue: dispatchMock,
        },
      ],
    }).compile();

    service = moduleRef.get(ContactService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('persists the normalized submission and kicks async dispatch', async () => {
    const result = await service.createAndQueueNotification({
      name: ' Ala ',
      email: 'ALA@test.local',
      message: ' Hej ',
      ip: '127.0.0.1',
      requestId: 'req-123',
    });

    expect(result).toEqual({
      ok: true,
      savedId: 'saved-123',
    });
    expect(repositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ala',
        email: 'ala@test.local',
        message: 'Hej',
        ip: '127.0.0.1',
        requestId: 'req-123',
      }),
    );
    expect(dispatchMock.kick).toHaveBeenCalledTimes(1);
  });

  it('returns a persistence failure when the repository save fails', async () => {
    repositoryMock.save.mockRejectedValue(
      new Error('Database connection failed'),
    );

    const result = await service.createAndQueueNotification({
      name: 'Test',
      email: 'test@test.local',
      message: 'Test message',
    });

    expect(result).toEqual({
      ok: false,
      failureCode: 'contact_persistence_failed',
    });
    expect(dispatchMock.kick).not.toHaveBeenCalled();
  });

  it('keeps the request successful when the dispatch trigger throws', async () => {
    dispatchMock.kick.mockImplementation(() => {
      throw new Error('Dispatch scheduling failed');
    });

    const result = await service.createAndQueueNotification({
      name: 'Test',
      email: 'test@test.local',
      message: 'Test message',
    });

    expect(result).toEqual({
      ok: true,
      savedId: 'saved-123',
    });
    expect(repositoryMock.save).toHaveBeenCalledTimes(1);
    expect(dispatchMock.kick).toHaveBeenCalledTimes(1);
  });
});
