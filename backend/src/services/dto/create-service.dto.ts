import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  MAX_LONG_TEXT_LENGTH,
  MAX_NAME_LENGTH,
} from '../../common/validation.constants';

export class CreateServiceDto {
  @IsString()
  @MaxLength(MAX_NAME_LENGTH)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_LONG_TEXT_LENGTH)
  description?: string;

  @IsNumber()
  @Min(1)
  durationMinutes: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number | null;

  @IsInt()
  @Min(1)
  centerId: number;

  @IsInt()
  @Min(1)
  specialistId: number;
}
