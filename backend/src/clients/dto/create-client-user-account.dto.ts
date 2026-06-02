import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateClientUserAccountDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @MinLength(4)
  password: string;
}
