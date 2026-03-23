import { registerAs } from '@nestjs/config';
import {
  readEnvString,
  readFirstEnvString,
  readMongoDbNameFromUri,
} from './config.helpers';

export default registerAs('mongo', () => {
  const uri = readFirstEnvString(
    process.env.MONGODB_URI,
    process.env.MONGODB_URL,
    process.env.MONGO_URL,
  );

  return {
    uri,
    dbName:
      readEnvString(process.env.MONGODB_DB) ??
      readMongoDbNameFromUri(uri) ??
      'wizytowka',
  };
});
