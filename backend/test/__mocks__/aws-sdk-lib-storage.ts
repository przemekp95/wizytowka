// @ts-ignore
const jest = require('jest');

// @ts-ignore
export class Upload {
  constructor() {
    return {
      done: jest.fn().mockResolvedValue({ Location: 'mocked-s3-url' }),
    };
  }
}
