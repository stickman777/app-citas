import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsArray,
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

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Nuevo email del usuario.',
    example: 'usuario@example.com',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(MAX_EMAIL_LENGTH)
  email?: string;

  @ApiPropertyOptional({
    description: 'Nuevo nombre visible del usuario.',
    example: 'Usuario Actualizado',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_NAME_LENGTH)
  name?: string;

  @ApiPropertyOptional({
    description: 'Nueva contraseña del usuario.',
    example: 'password123',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({
    description: 'Nuevo rol del usuario.',
    enum: UserRole,
    example: UserRole.GESTOR,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Centros asignados al usuario.',
    example: [1, 2],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  centerIds?: number[];
}
