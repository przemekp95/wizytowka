import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Project {
  @Field(() => ID)
  _id!: string;

  @Field()
  title!: string;

  @Field({ nullable: true })
  title_en?: string;

  @Field({ nullable: true })
  slug?: string;

  @Field({ nullable: true })
  href?: string;

  @Field({ nullable: true })
  desc?: string;

  @Field({ nullable: true })
  desc_en?: string;

  @Field(() => [String], { nullable: 'itemsAndList' })
  tags?: string[];

  @Field({ nullable: true })
  img?: string;

  @Field({ nullable: true })
  isLogo?: boolean;

  @Field({ nullable: true })
  newTech?: boolean;

  @Field({ nullable: true })
  repoUrl?: string;

  @Field({ nullable: true })
  order?: number;

  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}
