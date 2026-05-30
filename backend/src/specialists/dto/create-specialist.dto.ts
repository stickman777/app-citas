import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateSpecialistDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsInt()
  @Min(1)
  centerId: number;
}
