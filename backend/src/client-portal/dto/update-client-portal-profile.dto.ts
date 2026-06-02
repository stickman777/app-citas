import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateClientPortalProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string | null;
}
