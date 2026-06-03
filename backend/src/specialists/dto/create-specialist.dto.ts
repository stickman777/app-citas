import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import {
  MAX_NAME_LENGTH,
  MAX_SHORT_TEXT_LENGTH,
} from '../../common/validation.constants';
import { SpecialistStatus } from '../specialist.entity';

export class CreateSpecialistDto {
  @IsString()
  @MaxLength(MAX_NAME_LENGTH)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_SHORT_TEXT_LENGTH)
  specialty?: string;

  @IsOptional()
  @IsEnum(SpecialistStatus)
  status?: SpecialistStatus;

  @IsInt()
  @Min(1)
  centerId: number;
}
