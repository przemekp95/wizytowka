import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PortfolioGQL {
  @Field(() => ID)
  id!: string; // mapujemy z _id (ObjectId → string)

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
  newTech?: boolean;

  @Field({ nullable: true })
  repoUrl?: string; // <— kluczowe pole

  @Field({ nullable: true })
  order?: number;

  @Field({ nullable: true })
  status?: 'draft' | 'published';

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}
