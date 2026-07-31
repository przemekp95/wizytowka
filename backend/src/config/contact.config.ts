import { registerAs } from '@nestjs/config';
import { readEnvBoolean, readEnvNumber, readEnvString } from './config.helpers';

export default registerAs('contact', () => ({
  notificationProvider:
    readEnvString(process.env.CONTACT_NOTIFICATION_PROVIDER)?.toLowerCase() ===
    'resend'
      ? 'resend'
      : 'smtp',
  smtpHost: readEnvString(process.env.SMTP_HOST),
  smtpPort: readEnvNumber(process.env.SMTP_PORT, 465),
  smtpSecure: readEnvBoolean(process.env.SMTP_SECURE, true),
  smtpFrom: readEnvString(process.env.SMTP_FROM),
  smtpTo: readEnvString(process.env.SMTP_TO),
  smtpUser: readEnvString(process.env.SMTP_USER),
  smtpPass: readEnvString(process.env.SMTP_PASS),
  smtpDebug: readEnvBoolean(process.env.SMTP_DEBUG, false),
  resendApiKey: readEnvString(process.env.RESEND_API_KEY),
  resendWebhookSecret: readEnvString(process.env.RESEND_WEBHOOK_SECRET),
  notificationDispatchEnabled: readEnvBoolean(
    process.env.CONTACT_NOTIFICATION_DISPATCH_ENABLED,
    process.env.NODE_ENV !== 'test' && process.env.JEST_WORKER_ID === undefined,
  ),
  notificationDispatchIntervalMs: readEnvNumber(
    process.env.CONTACT_NOTIFICATION_DISPATCH_INTERVAL_MS,
    1_000,
  ),
  notificationDispatchBatchSize: readEnvNumber(
    process.env.CONTACT_NOTIFICATION_DISPATCH_BATCH_SIZE,
    10,
  ),
  notificationLeaseMs: readEnvNumber(
    process.env.CONTACT_NOTIFICATION_LEASE_MS,
    30_000,
  ),
  notificationMaxAttempts: readEnvNumber(
    process.env.CONTACT_NOTIFICATION_MAX_ATTEMPTS,
    5,
  ),
  notificationBaseDelayMs: readEnvNumber(
    process.env.CONTACT_NOTIFICATION_BASE_DELAY_MS,
    30_000,
  ),
  notificationMaxDelayMs: readEnvNumber(
    process.env.CONTACT_NOTIFICATION_MAX_DELAY_MS,
    15 * 60_000,
  ),
  notificationSubmittedRecheckMs: readEnvNumber(
    process.env.CONTACT_NOTIFICATION_SUBMITTED_RECHECK_MS,
    5 * 60_000,
  ),
  notificationSubmittedTimeoutMs: readEnvNumber(
    process.env.CONTACT_NOTIFICATION_SUBMITTED_TIMEOUT_MS,
    24 * 60 * 60_000,
  ),
  dataRetentionEnabled: readEnvBoolean(
    process.env.CONTACT_DATA_RETENTION_ENABLED,
    process.env.NODE_ENV !== 'test' && process.env.JEST_WORKER_ID === undefined,
  ),
  dataRetentionMs:
    readEnvNumber(process.env.CONTACT_DATA_RETENTION_DAYS, 90) *
    24 *
    60 *
    60_000,
  retentionSweepIntervalMs: readEnvNumber(
    process.env.CONTACT_RETENTION_SWEEP_INTERVAL_MS,
    60 * 60_000,
  ),
}));
