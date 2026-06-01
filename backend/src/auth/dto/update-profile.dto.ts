import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;
}
