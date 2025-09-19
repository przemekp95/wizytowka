import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { CreateProjectInput } from './create-project.input';
import { IsString } from 'class-validator';

@InputType()
export class UpdateProjectInput extends PartialType(CreateProjectInput) {
  @Field(() => ID)
  @IsString()
  id!: string;
}
