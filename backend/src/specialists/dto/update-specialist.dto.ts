import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSpecialistDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  centerId?: number;
}
