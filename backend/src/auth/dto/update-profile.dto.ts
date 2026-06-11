import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MAX_EMAIL_LENGTH, MAX_NAME_LENGTH } from '../../common/validation.constants';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Nuevo nombre del usuario.',
    example: 'Pablo García',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_NAME_LENGTH)
  name?: string;

  @ApiPropertyOptional({
    description: 'Nuevo email del usuario.',
    example: 'pablo@example.com',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(MAX_EMAIL_LENGTH)
  email?: string;

  @ApiPropertyOptional({
    description: 'Contraseña actual, requerida cuando se cambia la contraseña.',
    example: 'admin1234',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  currentPassword?: string;

  @ApiPropertyOptional({
    description: 'Nueva contraseña.',
    example: 'nueva1234',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
