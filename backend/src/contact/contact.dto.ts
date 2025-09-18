import { IsEmail, IsString, MinLength } from 'class-validator';

export class ContactDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(10)
  message!: string;
}
