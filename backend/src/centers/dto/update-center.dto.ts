import { IsArray, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import {
  MAX_CITY_LENGTH,
  MAX_NAME_LENGTH,
  MAX_URL_LENGTH,
} from '../../common/validation.constants';
import { CenterScheduleSlotDto } from './center-schedule-slot.dto';

export class UpdateCenterDto {
  @IsOptional()
  @IsString()
  @MaxLength(MAX_NAME_LENGTH)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_CITY_LENGTH)
  city?: string;

  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: false, require_tld: false })
  @MaxLength(MAX_URL_LENGTH)
  logoUrl?: string;

  @IsOptional()
  @IsArray()
  schedule?: CenterScheduleSlotDto[];
}
