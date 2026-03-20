import { registerAs } from '@nestjs/config';
import { readEnvString } from './config.helpers';

export default registerAs('mongo', () => ({
  uri: readEnvString(process.env.MONGODB_URI),
  dbName: readEnvString(process.env.MONGODB_DB) ?? 'wizytowka',
}));
