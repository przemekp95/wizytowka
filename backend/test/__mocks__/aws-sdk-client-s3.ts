// @ts-ignore
const jest = require('jest');

// @ts-ignore
export class S3Client {
  constructor() {
    return {
      send: jest.fn(),
    };
  }
}

// @ts-ignore
export class DeleteObjectCommand {
  constructor() {
    // Mock implementation
  }
}
