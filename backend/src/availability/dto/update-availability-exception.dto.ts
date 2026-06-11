import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { AvailabilityExceptionType } from '../availability-exception.entity';
import {
  DATE_FORMAT_REGEX,
  TIME_FORMAT_REGEX,
} from './create-availability-exception.dto';

export class UpdateAvailabilityExceptionDto {
  @ApiPropertyOptional({
    description: 'Centro al que pertenece la excepción.',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  centerId?: number;

  @ApiPropertyOptional({
    description: 'Fecha de la excepción.',
    example: '2026-06-15',
    pattern: 'YYYY-MM-DD',
  })
  @IsOptional()
  @IsString()
  @Matches(DATE_FORMAT_REGEX, {
    message: 'La fecha debe tener formato YYYY-MM-DD',
  })
  date?: string;

  @ApiPropertyOptional({
    description: 'Hora de inicio de la excepción.',
    example: '10:00',
    pattern: 'HH:mm',
  })
  @IsOptional()
  @IsString()
  @Matches(TIME_FORMAT_REGEX, {
    message: 'La hora de inicio debe tener formato HH:mm',
  })
  startTime?: string;

  @ApiPropertyOptional({
    description: 'Hora de fin de la excepción.',
    example: '12:00',
    pattern: 'HH:mm',
  })
  @IsOptional()
  @IsString()
  @Matches(TIME_FORMAT_REGEX, {
    message: 'La hora de fin debe tener formato HH:mm',
  })
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Tipo de excepción.',
    enum: AvailabilityExceptionType,
    example: AvailabilityExceptionType.EXTRA_AVAILABLE,
  })
  @IsOptional()
  @IsEnum(AvailabilityExceptionType)
  type?: AvailabilityExceptionType;

  @ApiPropertyOptional({
    description: 'Etiqueta descriptiva de la excepción.',
    example: 'Horario ampliado',
  })
  @IsOptional()
  @IsString()
  label?: string;
}
