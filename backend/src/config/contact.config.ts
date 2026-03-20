import { registerAs } from '@nestjs/config';
import { readEnvBoolean, readEnvNumber, readEnvString } from './config.helpers';

export default registerAs('contact', () => ({
  smtpHost: readEnvString(process.env.SMTP_HOST),
  smtpPort: readEnvNumber(process.env.SMTP_PORT, 465),
  smtpSecure: readEnvBoolean(process.env.SMTP_SECURE, true),
  smtpFrom: readEnvString(process.env.SMTP_FROM),
  smtpTo: readEnvString(process.env.SMTP_TO),
  smtpUser: readEnvString(process.env.SMTP_USER),
  smtpPass: readEnvString(process.env.SMTP_PASS),
  smtpDebug: readEnvBoolean(process.env.SMTP_DEBUG, false),
}));
