export const CONTACT_NOTIFICATION_DISPATCH_PORT = Symbol(
  'CONTACT_NOTIFICATION_DISPATCH_PORT',
);

export interface ContactNotificationDispatchPort {
  kick(): void;
}
