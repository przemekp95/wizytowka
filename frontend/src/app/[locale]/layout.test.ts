import { describe, expect, it } from 'vitest';
import { generateMetadata } from './layout';

describe('localized metadata', () => {
  it.each(['en', 'pl'])('publishes canonical and language alternates for %s', async (locale) => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale }) });

    expect(metadata.alternates).toEqual({
      canonical: `https://pietrzakprzemyslaw.pl/${locale}`,
      languages: {
        en: 'https://pietrzakprzemyslaw.pl/en',
        pl: 'https://pietrzakprzemyslaw.pl/pl',
        'x-default': 'https://pietrzakprzemyslaw.pl/en',
      },
    });
  });
});
