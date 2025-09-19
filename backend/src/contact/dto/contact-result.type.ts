import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ContactResult {
  @Field() ok!: boolean;
  @Field({ nullable: true }) error?: string;
}
