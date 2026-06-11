import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import {
  MAX_NAME_LENGTH,
  MAX_SHORT_TEXT_LENGTH,
} from '../../common/validation.constants';
import { SpecialistStatus } from '../specialist.entity';

export class UpdateSpecialistDto {
  @ApiPropertyOptional({
    description: 'Nombre del especialista.',
    example: 'Dra. Laura López',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_NAME_LENGTH)
  name?: string;

  @ApiPropertyOptional({
    description: 'Especialidad del profesional.',
    example: 'Podología',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_SHORT_TEXT_LENGTH)
  specialty?: string;

  @ApiPropertyOptional({
    description: 'Estado del especialista.',
    enum: SpecialistStatus,
    example: SpecialistStatus.VACATION,
  })
  @IsOptional()
  @IsEnum(SpecialistStatus)
  status?: SpecialistStatus;

  @ApiPropertyOptional({
    description: 'Centro al que pertenece el especialista.',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  centerId?: number;
}
