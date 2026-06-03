import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  MAX_EMAIL_LENGTH,
  MAX_LONG_TEXT_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PHONE_LENGTH,
} from '../../common/validation.constants';

export class CreateClientDto {
  @IsString()
  @MaxLength(MAX_NAME_LENGTH)
  name: string;

  @IsString()
  @MaxLength(MAX_PHONE_LENGTH)
  phone: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(MAX_EMAIL_LENGTH)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_LONG_TEXT_LENGTH)
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsInt()
  @Min(1)
  centerId: number;
}
