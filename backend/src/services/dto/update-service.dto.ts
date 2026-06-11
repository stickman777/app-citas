import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateServiceDto {
  @ApiPropertyOptional({
    description: 'Nombre del servicio.',
    example: 'Consulta de seguimiento',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_NAME_LENGTH)
  name?: string;

  @ApiPropertyOptional({
    description: 'Descripción del servicio.',
    example: 'Revisión posterior a la primera consulta.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_LONG_TEXT_LENGTH)
  description?: string;

  @ApiPropertyOptional({
    description: 'Duración del servicio en minutos.',
    example: 45,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  durationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Precio del servicio. Puede ser null.',
    example: 30,
    minimum: 0,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number | null;

  @ApiPropertyOptional({
    description: 'Centro en el que se ofrece el servicio.',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  centerId?: number;

  @ApiPropertyOptional({
    description: 'Especialista que realiza el servicio.',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  specialistId?: number;
}
