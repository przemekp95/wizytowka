import { registerAs } from '@nestjs/config';
import { readEnvString } from './config.helpers';

export default registerAs('aws', () => ({
  region: readEnvString(process.env.AWS_REGION) ?? 'us-east-1',
  accessKeyId: readEnvString(process.env.AWS_ACCESS_KEY_ID),
  secretAccessKey: readEnvString(process.env.AWS_SECRET_ACCESS_KEY),
  s3: {
    bucketName:
      readEnvString(process.env.AWS_S3_BUCKET_NAME) ?? 'wizytowka-portfolio',
  },
}));
