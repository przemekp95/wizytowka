import { ContactNotification } from './contact-notification';

describe('ContactNotification', () => {
  it('schedules the next confirmation check while a provider delivery is still submitted', () => {
    const notification = ContactNotification.submitted({
      id: 'contact-1',
      messageId: 're_123',
      submittedAt: new Date('2026-03-23T09:30:00.000Z'),
    });

    expect(
      notification.reconcileSubmittedDelivery({
        observedAt: new Date('2026-03-23T10:00:00.000Z'),
        submittedTimeoutMs: 3_600_000,
        submittedRecheckMs: 300_000,
        status: {
          deliveryState: 'submitted',
        },
      }),
    ).toEqual({
      outcome: 'rescheduled',
      nextCheckAt: new Date('2026-03-23T10:05:00.000Z'),
    });
  });

  it('times out lookup failures after the confirmation window expires', () => {
    const notification = ContactNotification.submitted({
      id: 'contact-2',
      messageId: 're_timeout',
      submittedAt: new Date('2026-03-23T08:00:00.000Z'),
    });

    expect(
      notification.reconcileSubmittedDelivery({
        observedAt: new Date('2026-03-23T10:00:00.000Z'),
        submittedTimeoutMs: 3_600_000,
        submittedRecheckMs: 300_000,
        lookupError: new Error('Lookup timeout'),
      }),
    ).toEqual({
      outcome: 'timed_out',
      messageId: 're_timeout',
      reason:
        'Provider confirmation timed out after lookup errors: Lookup timeout',
    });
  });

  it('maps suppressed webhook events to a domain failure', () => {
    const notification = ContactNotification.pending('contact-3');

    expect(
      notification.applyWebhook({
        eventType: 'email.suppressed',
        messageId: 're_456',
        failureReason: 'Mailbox is suppressed',
        deliveredAt: new Date('2026-03-23T10:06:00.000Z'),
      }),
    ).toEqual({
      outcome: 'failed',
      messageId: 're_456',
      reason: 'Mailbox is suppressed',
    });
  });
});
