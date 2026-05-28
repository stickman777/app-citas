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
  @IsInt()
  @Min(1)
  centerId: number;

  @IsString()
  @Matches(DATE_FORMAT_REGEX, {
    message: 'La fecha debe tener formato YYYY-MM-DD',
  })
  date: string;

  @IsString()
  @Matches(TIME_FORMAT_REGEX, {
    message: 'La hora de inicio debe tener formato HH:mm',
  })
  startTime: string;

  @IsString()
  @Matches(TIME_FORMAT_REGEX, {
    message: 'La hora de fin debe tener formato HH:mm',
  })
  endTime: string;

  @IsEnum(AvailabilityExceptionType)
  type: AvailabilityExceptionType;

  @IsOptional()
  @IsString()
  label?: string;
}
