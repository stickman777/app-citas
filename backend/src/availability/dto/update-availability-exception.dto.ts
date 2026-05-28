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
  @IsOptional()
  @IsInt()
  @Min(1)
  centerId?: number;

  @IsOptional()
  @IsString()
  @Matches(DATE_FORMAT_REGEX, {
    message: 'La fecha debe tener formato YYYY-MM-DD',
  })
  date?: string;

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

  @IsOptional()
  @IsEnum(AvailabilityExceptionType)
  type?: AvailabilityExceptionType;

  @IsOptional()
  @IsString()
  label?: string;
}
