import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PortfolioGQL {
  @Field(() => ID)
  id!: string; // mapowane z Mongo _id

  @Field()
  title!: string;

  @Field()
  slug!: string;

  @Field()
  href!: string;

  @Field()
  desc!: string;

  @Field(() => [String])
  tags!: string[];

  @Field()
  img!: string;

  @Field({ nullable: true })
  isLogo?: boolean;

  @Field({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  repoUrl?: string;

  @Field(() => Date, { nullable: true })
  dateFrom?: Date;

  @Field(() => Date, { nullable: true })
  dateTo?: Date;

  @Field({ nullable: true })
  order?: number;

  @Field({ nullable: true })
  status?: 'draft' | 'published';

  @Field(() => Date, { nullable: true })
  createdAt?: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date;
}
