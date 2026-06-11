import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateClientPortalProfileDto {
  @ApiPropertyOptional({
    description: 'Nombre del cliente.',
    example: 'Ana Martínez',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto del cliente.',
    example: '600123456',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Email de contacto del cliente. Puede ser null.',
    example: 'ana.martinez@example.com',
    nullable: true,
  })
  @IsOptional()
  @IsEmail()
  email?: string | null;
}
