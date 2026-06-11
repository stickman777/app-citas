import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({
    description: 'Email del usuario.',
    example: 'gestor@example.com',
  })
  @IsEmail()
  @MaxLength(MAX_EMAIL_LENGTH)
  email: string;

  @ApiProperty({
    description: 'Nombre visible del usuario.',
    example: 'Gestor Principal',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_NAME_LENGTH)
  name: string;

  @ApiProperty({
    description: 'Contraseña inicial del usuario.',
    example: 'gestor1234',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Rol asignado al usuario.',
    enum: UserRole,
    example: UserRole.GESTOR,
  })
  @IsEnum(UserRole)
  role: UserRole;

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
