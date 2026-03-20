import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class ContactDto {
  @ApiProperty({ example: 'Jan Testowy' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'jan@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'To jest poprawna wiadomosc testowa.' })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message!: string;
}
