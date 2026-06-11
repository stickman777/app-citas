import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import {
  MAX_NAME_LENGTH,
  MAX_SHORT_TEXT_LENGTH,
} from '../../common/validation.constants';
import { SpecialistStatus } from '../specialist.entity';

export class CreateSpecialistDto {
  @ApiProperty({
    description: 'Nombre del especialista.',
    example: 'Dra. Laura López',
  })
  @IsString()
  @MaxLength(MAX_NAME_LENGTH)
  name: string;

  @ApiPropertyOptional({
    description: 'Especialidad del profesional.',
    example: 'Fisioterapia',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_SHORT_TEXT_LENGTH)
  specialty?: string;

  @ApiPropertyOptional({
    description: 'Estado inicial del especialista.',
    enum: SpecialistStatus,
    example: SpecialistStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(SpecialistStatus)
  status?: SpecialistStatus;

  @ApiProperty({
    description: 'Centro al que pertenece el especialista.',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  centerId: number;
}
