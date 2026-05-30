import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { SpecialistStatus } from '../specialist.entity';

export class UpdateSpecialistDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsEnum(SpecialistStatus)
  status?: SpecialistStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  centerId?: number;
}
