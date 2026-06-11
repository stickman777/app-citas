import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  MAX_EMAIL_LENGTH,
  MAX_LONG_TEXT_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PHONE_LENGTH,
} from '../../common/validation.constants';

export class CreateClientDto {
  @ApiProperty({
    description: 'Nombre del cliente.',
    example: 'Ana Martínez',
  })
  @IsString()
  @MaxLength(MAX_NAME_LENGTH)
  name: string;

  @ApiProperty({
    description: 'Teléfono de contacto del cliente.',
    example: '600123456',
  })
  @IsString()
  @MaxLength(MAX_PHONE_LENGTH)
  phone: string;

  @ApiPropertyOptional({
    description: 'Email de contacto del cliente.',
    example: 'ana.martinez@example.com',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(MAX_EMAIL_LENGTH)
  email?: string;

  @ApiPropertyOptional({
    description: 'Notas internas sobre el cliente.',
    example: 'Prefiere citas por la mañana.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_LONG_TEXT_LENGTH)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Prioridad interna del cliente.',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiProperty({
    description: 'Centro al que pertenece el cliente.',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  centerId: number;
}
