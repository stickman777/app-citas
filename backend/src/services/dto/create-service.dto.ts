import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  MAX_LONG_TEXT_LENGTH,
  MAX_NAME_LENGTH,
} from '../../common/validation.constants';

export class CreateServiceDto {
  @ApiProperty({
    description: 'Nombre del servicio.',
    example: 'Consulta inicial',
  })
  @IsString()
  @MaxLength(MAX_NAME_LENGTH)
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción del servicio.',
    example: 'Primera valoración del cliente.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_LONG_TEXT_LENGTH)
  description?: string;

  @ApiProperty({
    description: 'Duración del servicio en minutos.',
    example: 30,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  durationMinutes: number;

  @ApiPropertyOptional({
    description: 'Precio del servicio. Puede ser null.',
    example: 25,
    minimum: 0,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number | null;

  @ApiProperty({
    description: 'Centro en el que se ofrece el servicio.',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  centerId: number;

  @ApiProperty({
    description: 'Especialista que realiza el servicio.',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  specialistId: number;
}
