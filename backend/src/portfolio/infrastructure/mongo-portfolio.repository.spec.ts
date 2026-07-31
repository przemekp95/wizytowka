import { MongoClient } from 'mongodb';
import { MongoPortfolioRepository } from './mongo-portfolio.repository';

jest.mock('mongodb', () => ({
  MongoClient: jest.fn(),
}));

describe('MongoPortfolioRepository', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('clears the connection timeout when MongoDB rejects immediately', async () => {
    jest.useFakeTimers();

    const connect = jest
      .fn()
      .mockRejectedValue(new Error('connection refused'));
    const close = jest.fn().mockResolvedValue(undefined);
    (MongoClient as jest.MockedClass<typeof MongoClient>).mockImplementation(
      () => ({ connect, close }) as never,
    );

    const repository = new MongoPortfolioRepository({
      uri: 'mongodb://localhost:27017',
      dbName: 'wizytowka',
    });

    await repository.onModuleInit();

    expect(connect).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });
});
