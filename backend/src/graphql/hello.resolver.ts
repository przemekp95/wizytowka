import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class HelloResolver {
  @Query(() => String, {
    name: 'hello',
    description:
      'Minimal GraphQL hello query exposed for smoke testing and tooling checks.',
  })
  hello(): string {
    return 'world';
  }
}
