import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { MAX_SHORT_TEXT_LENGTH } from '../../common/validation.constants';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class CreateSpecialistAbsenceDto {
  @ApiProperty({
    description: 'Fecha de inicio de la ausencia (incluida).',
    example: '2026-07-01',
    pattern: 'YYYY-MM-DD',
  })
  @IsString()
  @Matches(DATE_REGEX, { message: 'La fecha debe tener formato YYYY-MM-DD' })
  startDate: string;

  @ApiProperty({
    description: 'Fecha de fin de la ausencia (incluida).',
    example: '2026-07-15',
    pattern: 'YYYY-MM-DD',
  })
  @IsString()
  @Matches(DATE_REGEX, { message: 'La fecha debe tener formato YYYY-MM-DD' })
  endDate: string;

  @ApiPropertyOptional({
    description: 'Motivo de la ausencia.',
    example: 'Vacaciones',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_SHORT_TEXT_LENGTH)
  reason?: string;
}
