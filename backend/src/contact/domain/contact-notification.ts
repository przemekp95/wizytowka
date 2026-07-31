export type ContactNotificationDispatchDecision =
  | {
      outcome: 'submitted';
      messageId: string;
      submittedAt: Date;
      nextCheckAt: Date;
    }
  | {
      outcome: 'delivered';
      messageId: string;
      deliveredAt: Date;
    };

export type ContactNotificationReconciliationDecision =
  | {
      outcome: 'delivered';
      messageId: string;
      deliveredAt: Date;
    }
  | {
      outcome: 'failed';
      messageId: string;
      reason: string;
    }
  | {
      outcome: 'timed_out';
      messageId: string;
      reason: string;
    }
  | {
      outcome: 'rescheduled';
      nextCheckAt: Date;
      reason?: string;
    };

export type ContactNotificationWebhookDecision =
  | {
      outcome: 'delivered';
      messageId: string;
      deliveredAt: Date;
    }
  | {
      outcome: 'failed';
      messageId?: string;
      reason: string;
    }
  | {
      outcome: 'missing_message_id';
    }
  | {
      outcome: 'ignored';
    };

type SubmittedNotificationStatus = {
  deliveryState: 'submitted' | 'delivered' | 'failed';
  failureReason?: string;
};

type PendingContactNotificationProps = {
  id: string;
};

type SubmittedContactNotificationProps = {
  id: string;
  messageId: string;
  submittedAt: Date;
};

export class ContactNotification {
  private constructor(
    private readonly props:
      | PendingContactNotificationProps
      | SubmittedContactNotificationProps,
  ) {}

  static pending(id: string): ContactNotification {
    return new ContactNotification({
      id,
    });
  }

  static submitted(
    props: SubmittedContactNotificationProps,
  ): ContactNotification {
    return new ContactNotification({
      id: props.id,
      messageId: props.messageId,
      submittedAt: new Date(props.submittedAt),
    });
  }

  recordDispatchOutcome(params: {
    messageId: string;
    deliveryState: 'submitted' | 'delivered';
    observedAt: Date;
    submittedRecheckMs: number;
  }): ContactNotificationDispatchDecision {
    if (params.deliveryState === 'submitted') {
      return {
        outcome: 'submitted',
        messageId: params.messageId,
        submittedAt: params.observedAt,
        nextCheckAt: this.computeNextCheckAt(
          params.observedAt,
          params.submittedRecheckMs,
        ),
      };
    }

    return {
      outcome: 'delivered',
      messageId: params.messageId,
      deliveredAt: params.observedAt,
    };
  }

  reconcileSubmittedDelivery(params: {
    observedAt: Date;
    submittedTimeoutMs: number;
    submittedRecheckMs: number;
    status?: SubmittedNotificationStatus;
    lookupError?: Error;
  }): ContactNotificationReconciliationDecision {
    const submittedNotification = this.asSubmitted();
    const isExpired = this.hasConfirmationTimedOut(
      submittedNotification.submittedAt,
      params.observedAt,
      params.submittedTimeoutMs,
    );

    if (params.lookupError) {
      if (isExpired) {
        return {
          outcome: 'timed_out',
          messageId: submittedNotification.messageId,
          reason: `Provider confirmation timed out after lookup errors: ${params.lookupError.message}`,
        };
      }

      return {
        outcome: 'rescheduled',
        nextCheckAt: this.computeNextCheckAt(
          params.observedAt,
          params.submittedRecheckMs,
        ),
        reason: `Confirmation lookup failed: ${params.lookupError.message}`,
      };
    }

    if (!params.status) {
      throw new Error(
        'Submitted notification reconciliation requires a provider status or lookup error',
      );
    }

    switch (params.status.deliveryState) {
      case 'delivered':
        return {
          outcome: 'delivered',
          messageId: submittedNotification.messageId,
          deliveredAt: params.observedAt,
        };

      case 'failed':
        return {
          outcome: 'failed',
          messageId: submittedNotification.messageId,
          reason:
            params.status.failureReason ?? 'Provider reported delivery failure',
        };

      default:
        if (isExpired) {
          return {
            outcome: 'timed_out',
            messageId: submittedNotification.messageId,
            reason: 'Provider confirmation timed out',
          };
        }

        return {
          outcome: 'rescheduled',
          nextCheckAt: this.computeNextCheckAt(
            params.observedAt,
            params.submittedRecheckMs,
          ),
        };
    }
  }

  applyWebhook(params: {
    eventType: string;
    messageId?: string;
    deliveredAt: Date;
    failureReason?: string;
  }): ContactNotificationWebhookDecision {
    switch (params.eventType) {
      case 'email.delivered':
        if (!params.messageId) {
          return {
            outcome: 'missing_message_id',
          };
        }

        return {
          outcome: 'delivered',
          messageId: params.messageId,
          deliveredAt: params.deliveredAt,
        };

      case 'email.failed':
      case 'email.bounced':
      case 'email.suppressed':
        return {
          outcome: 'failed',
          ...(params.messageId ? { messageId: params.messageId } : {}),
          reason: params.failureReason ?? params.eventType,
        };

      default:
        return {
          outcome: 'ignored',
        };
    }
  }

  private asSubmitted(): SubmittedContactNotificationProps {
    if (!('messageId' in this.props) || !('submittedAt' in this.props)) {
      throw new Error(
        'Submitted contact notification rules require messageId and submittedAt',
      );
    }

    return {
      id: this.props.id,
      messageId: this.props.messageId,
      submittedAt: this.props.submittedAt,
    };
  }

  private computeNextCheckAt(
    observedAt: Date,
    submittedRecheckMs: number,
  ): Date {
    return new Date(observedAt.getTime() + submittedRecheckMs);
  }

  private hasConfirmationTimedOut(
    submittedAt: Date,
    observedAt: Date,
    submittedTimeoutMs: number,
  ): boolean {
    return observedAt.getTime() - submittedAt.getTime() >= submittedTimeoutMs;
  }
}
