import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateActiveCenterDto {
  @ApiProperty({
    description: 'Identificador del centro que se establecerá como activo.',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  centerId: number;
}
