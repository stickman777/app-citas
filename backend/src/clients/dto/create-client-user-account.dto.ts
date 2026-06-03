import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_EMAIL_LENGTH, MAX_NAME_LENGTH } from '../../common/validation.constants';

export class CreateClientUserAccountDto {
  @IsEmail()
  @MaxLength(MAX_EMAIL_LENGTH)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_NAME_LENGTH)
  name: string;

  @IsString()
  @MinLength(8)
  password: string;
}
