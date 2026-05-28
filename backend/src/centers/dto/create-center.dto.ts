import { IsArray, IsOptional, IsString } from 'class-validator';
import { CenterScheduleSlotDto } from './center-schedule-slot.dto';

export class CreateCenterDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsArray()
  schedule?: CenterScheduleSlotDto[];
}
