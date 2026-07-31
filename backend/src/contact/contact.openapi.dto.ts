import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContactHttpResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiPropertyOptional({
    example: 'Nie udalo sie zapisac wiadomosci. Sprobuj ponownie pozniej.',
  })
  error?: string;
}

export class ContactMessageListItemDto {
  @ApiProperty({ example: 'cm_123' })
  id!: string;

  @ApiProperty({ example: 'Jan Testowy' })
  name!: string;

  @ApiProperty({ example: 'jan@example.com' })
  email!: string;

  @ApiProperty({ example: 'To jest poprawna wiadomosc testowa.' })
  message!: string;

  @ApiPropertyOptional({ example: '203.0.113.7', nullable: true })
  ip!: string | null;

  @ApiProperty({ example: '2026-03-20T10:00:00.000Z' })
  createdAt!: Date;
}

export class ContactMessageListResponseDto {
  @ApiProperty({ type: () => [ContactMessageListItemDto] })
  items!: ContactMessageListItemDto[];

  @ApiPropertyOptional({ example: 'cm_456' })
  nextCursor?: string;
}
