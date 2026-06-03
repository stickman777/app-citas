import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { MAX_EMAIL_LENGTH, MAX_NAME_LENGTH } from '../../common/validation.constants';
import { UserRole } from '../user.entity';

export class CreateUserDto {
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

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  centerIds?: number[];
}
