import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterClientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @MinLength(8)
  password: string;
}
