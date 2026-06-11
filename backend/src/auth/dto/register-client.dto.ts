import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import {
  MAX_EMAIL_LENGTH,
  MAX_NAME_LENGTH,
} from '../../common/validation.constants';

export class RegisterClientDto {
  @ApiProperty({
    description: 'Token de invitación generado para la ficha de cliente.',
    example: 'f2a8b91c9d0e4f1a',
    maxLength: 128,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  invitationToken: string;

  @ApiProperty({
    description: 'Nombre del cliente.',
    example: 'Ana Martínez',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_NAME_LENGTH)
  name: string;

  @ApiProperty({
    description: 'Email con el que el cliente accederá a la aplicación.',
    example: 'ana.martinez@example.com',
  })
  @IsEmail()
  @MaxLength(MAX_EMAIL_LENGTH)
  email: string;

  @ApiProperty({
    description: 'Contraseña de acceso.',
    example: 'cliente1234',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;
}
