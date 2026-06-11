import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { AvailabilityExceptionType } from '../availability-exception.entity';

export const DATE_FORMAT_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
export const TIME_FORMAT_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateAvailabilityExceptionDto {
  @ApiProperty({
    description: 'Centro al que pertenece la excepción.',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  centerId: number;

  @ApiProperty({
    description: 'Fecha de la excepción.',
    example: '2026-06-15',
    pattern: 'YYYY-MM-DD',
  })
  @IsString()
  @Matches(DATE_FORMAT_REGEX, {
    message: 'La fecha debe tener formato YYYY-MM-DD',
  })
  date: string;

  @ApiProperty({
    description: 'Hora de inicio de la excepción.',
    example: '10:00',
    pattern: 'HH:mm',
  })
  @IsString()
  @Matches(TIME_FORMAT_REGEX, {
    message: 'La hora de inicio debe tener formato HH:mm',
  })
  startTime: string;

  @ApiProperty({
    description: 'Hora de fin de la excepción.',
    example: '12:00',
    pattern: 'HH:mm',
  })
  @IsString()
  @Matches(TIME_FORMAT_REGEX, {
    message: 'La hora de fin debe tener formato HH:mm',
  })
  endTime: string;

  @ApiProperty({
    description: 'Tipo de excepción.',
    enum: AvailabilityExceptionType,
    example: AvailabilityExceptionType.BLOCKED,
  })
  @IsEnum(AvailabilityExceptionType)
  type: AvailabilityExceptionType;

  @ApiPropertyOptional({
    description: 'Etiqueta descriptiva de la excepción.',
    example: 'Festivo local',
  })
  @IsOptional()
  @IsString()
  label?: string;
}
