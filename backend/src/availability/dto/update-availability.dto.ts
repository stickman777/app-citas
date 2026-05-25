import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

const TIME_FORMAT_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class UpdateAvailabilityDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @IsString()
  @Matches(TIME_FORMAT_REGEX, {
    message: 'La hora de inicio debe tener formato HH:mm',
  })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(TIME_FORMAT_REGEX, {
    message: 'La hora de fin debe tener formato HH:mm',
  })
  endTime?: string;
}
