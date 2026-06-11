import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Matches, Max, Min } from 'class-validator';

export const TIME_FORMAT_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CenterScheduleSlotDto {
  @ApiProperty({
    description: 'Día de la semana entre 0 y 6.',
    example: 1,
    minimum: 0,
    maximum: 6,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({
    description: 'Hora de inicio de la franja.',
    example: '09:00',
    pattern: 'HH:mm',
  })
  @IsString()
  @Matches(TIME_FORMAT_REGEX, {
    message: 'La hora de inicio debe tener formato HH:mm',
  })
  startTime: string;

  @ApiProperty({
    description: 'Hora de fin de la franja.',
    example: '14:00',
    pattern: 'HH:mm',
  })
  @IsString()
  @Matches(TIME_FORMAT_REGEX, {
    message: 'La hora de fin debe tener formato HH:mm',
  })
  endTime: string;
}
