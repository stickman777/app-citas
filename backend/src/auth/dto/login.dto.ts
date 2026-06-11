import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email del usuario.',
    example: 'admin@app-citas.local',
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario.',
    example: 'admin1234',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;
}
