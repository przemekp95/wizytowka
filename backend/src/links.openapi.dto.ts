import { ApiProperty } from '@nestjs/swagger';

export class LinkDto {
  @ApiProperty({ example: 'github' })
  slug!: string;

  @ApiProperty({ example: 'GitHub' })
  title!: string;

  @ApiProperty({ example: 'https://github.com/przemekp95' })
  url!: string;
}
