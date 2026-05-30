import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { SpecialistStatus } from '../specialist.entity';

export class CreateSpecialistDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsEnum(SpecialistStatus)
  status?: SpecialistStatus;

  @IsInt()
  @Min(1)
  centerId: number;
}
