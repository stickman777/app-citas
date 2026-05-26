import { IsOptional, IsString } from 'class-validator';

export class UpdateCenterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;
}
