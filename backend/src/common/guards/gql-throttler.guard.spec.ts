import { Test, TestingModule } from '@nestjs/testing';
import { GqlThrottlerGuard } from './gql-throttler.guard';
import { ThrottlerModule } from '@nestjs/throttler';

describe('GqlThrottlerGuard', () => {
  let guard: GqlThrottlerGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60, limit: 20 }])],
      providers: [GqlThrottlerGuard],
    }).compile();

    guard = module.get<GqlThrottlerGuard>(GqlThrottlerGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should be an instance of GqlThrottlerGuard', () => {
    expect(guard).toBeInstanceOf(GqlThrottlerGuard);
  });

  it('should have getRequest method', () => {
    expect(guard.getRequest).toBeDefined();
    expect(typeof guard.getRequest).toBe('function');
  });

  it('should have canActivate method', () => {
    expect(guard.canActivate).toBeDefined();
    expect(typeof guard.canActivate).toBe('function');
  });
});
