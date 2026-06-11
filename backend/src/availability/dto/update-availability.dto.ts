import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

const TIME_FORMAT_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class UpdateAvailabilityDto {
  @ApiPropertyOptional({
    description: 'Centro al que pertenece la franja.',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  centerId?: number;

  @ApiPropertyOptional({
    description: 'Día de la semana entre 0 y 6.',
    example: 1,
    minimum: 0,
    maximum: 6,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiPropertyOptional({
    description: 'Hora de inicio de la franja.',
    example: '09:00',
    pattern: 'HH:mm',
  })
  @IsOptional()
  @IsString()
  @Matches(TIME_FORMAT_REGEX, {
    message: 'La hora de inicio debe tener formato HH:mm',
  })
  startTime?: string;

  @ApiPropertyOptional({
    description: 'Hora de fin de la franja.',
    example: '14:00',
    pattern: 'HH:mm',
  })
  @IsOptional()
  @IsString()
  @Matches(TIME_FORMAT_REGEX, {
    message: 'La hora de fin debe tener formato HH:mm',
  })
  endTime?: string;
}
