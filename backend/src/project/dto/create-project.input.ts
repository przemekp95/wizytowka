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
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  link?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  repo?: string;

  @Field(() => [String], { nullable: 'itemsAndList' })
  @IsOptional()
  tags?: string[];
}
