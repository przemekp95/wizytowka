import { BadRequestException } from '@nestjs/common';

type PortfolioImageContent = {
  buffer: Buffer;
  mimetype: string;
};

function startsWith(buffer: Buffer, signature: readonly number[]): boolean {
  return signature.every((byte, index) => buffer[index] === byte);
}

function isWebp(buffer: Buffer): boolean {
  return (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  );
}

export function validatePortfolioImageContent(
  file: PortfolioImageContent,
): void {
  const valid =
    (file.mimetype === 'image/jpeg' &&
      startsWith(file.buffer, [0xff, 0xd8, 0xff])) ||
    (file.mimetype === 'image/png' &&
      startsWith(
        file.buffer,
        [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      )) ||
    (file.mimetype === 'image/webp' && isWebp(file.buffer));

  if (!valid) {
    throw new BadRequestException(
      'Uploaded image content does not match an allowed JPEG, PNG, or WebP type.',
    );
  }
}
