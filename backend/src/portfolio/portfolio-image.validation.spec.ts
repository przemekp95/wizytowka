import { BadRequestException } from '@nestjs/common';
import { validatePortfolioImageContent } from './portfolio-image.validation';

describe('validatePortfolioImageContent', () => {
  it.each([
    ['image/jpeg', Buffer.from([0xff, 0xd8, 0xff, 0xe0])],
    [
      'image/png',
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ],
    [
      'image/webp',
      Buffer.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]),
    ],
  ])('accepts real %s content', (mimetype, buffer) => {
    expect(() => validatePortfolioImageContent({ mimetype, buffer })).not.toThrow();
  });

  it('rejects content whose signature does not match the declared image type', () => {
    expect(() =>
      validatePortfolioImageContent({
        mimetype: 'image/png',
        buffer: Buffer.from('<script>alert(1)</script>'),
      }),
    ).toThrow(BadRequestException);
  });
});
