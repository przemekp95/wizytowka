import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Project {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  link?: string;

  @Field({ nullable: true })
  repo?: string;

  @Field(() => [String], { nullable: 'itemsAndList' })
  tags?: string[];
}
