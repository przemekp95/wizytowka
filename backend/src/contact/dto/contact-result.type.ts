import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({
  description:
    'Result returned after attempting to process a public contact submission.',
})
export class ContactResult {
  @Field({
    description:
      'Indicates whether the message was persisted and delivered successfully.',
  })
  ok!: boolean;

  @Field({
    nullable: true,
    description:
      'Human-readable error returned when the contact submission fails.',
  })
  error?: string;
}
