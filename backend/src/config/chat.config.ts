import { registerAs } from '@nestjs/config';
import { readEnvString } from './config.helpers';

export default registerAs('chat', () => {
  const apiKey = readEnvString(process.env.OPENAI_API_KEY);

  return {
    apiKey,
    enabled: Boolean(apiKey),
    model: 'gpt-3.5-turbo',
    maxTokens: 500,
    temperature: 0.7,
    sessionMaxAgeMs: 24 * 60 * 60 * 1000,
  };
});
