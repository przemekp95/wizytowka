import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

@InputType({
  description:
    'Public contact form input accepted by the sendContact mutation.',
})
export class ContactMessageInput {
  @Field({ description: 'Full name of the person sending the message.' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @Field({ description: 'Reply-to email address for the contact message.' })
  @IsEmail()
  email!: string;

  @Field({
    description: 'Message body submitted through the public contact form.',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message!: string;
}
