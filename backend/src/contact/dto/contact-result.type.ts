import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({
  description:
    'Result returned after attempting to process a public contact submission and queue async delivery.',
})
export class ContactResult {
  @Field({
    description:
      'Indicates whether the message was persisted and accepted for async delivery.',
  })
  ok!: boolean;

  @Field({
    nullable: true,
    description:
      'Human-readable error returned when the contact submission fails.',
  })
  error?: string;
}
