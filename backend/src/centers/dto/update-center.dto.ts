import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import {
  MAX_CITY_LENGTH,
  MAX_NAME_LENGTH,
  MAX_URL_LENGTH,
} from '../../common/validation.constants';
import { CenterScheduleSlotDto } from './center-schedule-slot.dto';

export class UpdateCenterDto {
  @ApiPropertyOptional({
    description: 'Nombre del centro.',
    example: 'Centro Madrid Norte',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_NAME_LENGTH)
  name?: string;

  @ApiPropertyOptional({
    description: 'Ciudad del centro.',
    example: 'Madrid',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_CITY_LENGTH)
  city?: string;

  @ApiPropertyOptional({
    description: 'URL o ruta del logotipo del centro.',
    example: 'https://example.com/logo.png',
  })
  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: false, require_tld: false })
  @MaxLength(MAX_URL_LENGTH)
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Horario base del centro. Si se envía, reemplaza el horario anterior.',
    type: [CenterScheduleSlotDto],
  })
  @IsOptional()
  @IsArray()
  schedule?: CenterScheduleSlotDto[];
}
