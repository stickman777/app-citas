import { IsOptional, IsString } from 'class-validator';

export class CreateCenterDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;
}
