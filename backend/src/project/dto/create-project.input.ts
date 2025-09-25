import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

@InputType()
export class CreateProjectInput {
  @Field()
  @IsString()
  @MaxLength(100)
  title!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  desc?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  href?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  repoUrl?: string;

  @Field(() => [String], { nullable: 'itemsAndList' })
  @IsOptional()
  tags?: string[];
}
