import { Field, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

@InputType()
export class ContactMessageInput {
  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  message!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  hcaptchaToken?: string;
}

// TEMP: CreateContactInput likely not used, commented out for simplicity
//
// import { Field, InputType } from '@nestjs/graphql';
// import {
//   IsEmail,
//   IsOptional,
//   IsString,
//   MaxLength,
//   MinLength,
// } from 'class-validator';
//
// @InputType()
// export class CreateContactInput {
//   @Field()
//   @IsString()
//   @MinLength(2)
//   @MaxLength(100)
//   name!: string;
//
//   @Field()
//   @IsEmail()
//   email!: string;
//
//   @Field()
//   @IsString()
//   @MinLength(5)
//   @MaxLength(2000)
//   message!: string;
//
//   @Field({ nullable: true })
//   @IsOptional()
//   @IsString()
//   ip?: string;
//
//   @Field({ nullable: true })
//   @IsOptional()
//   @IsString()
//   requestId?: string;
// }
