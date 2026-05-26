import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(1)
  durationMinutes: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  centerId?: number;
}
