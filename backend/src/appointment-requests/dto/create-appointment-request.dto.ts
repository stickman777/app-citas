import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { MAX_LONG_TEXT_LENGTH } from '../../common/validation.constants';

// Fecha y hora local sin zona horaria, con formato YYYY-MM-DDTHH:mm:ss.
const LOCAL_DATE_TIME_REGEX =
  /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;

export class CreateAppointmentRequestDto {
  @ApiProperty({
    description: 'Fecha y hora local deseada para la cita.',
    example: '2026-06-15T20:30:00',
    pattern: 'YYYY-MM-DDTHH:mm:ss',
  })
  @IsString()
  @Matches(LOCAL_DATE_TIME_REGEX, {
    message: 'La fecha y hora debe tener formato YYYY-MM-DDTHH:mm:ss',
  })
  startDateTime: string;

  @ApiProperty({
    description: 'Identificador del servicio deseado.',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  serviceId: number;

  @ApiProperty({
    description: 'Identificador del especialista deseado.',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  specialistId: number;

  @ApiPropertyOptional({
    description: 'Preferencias o motivo de la solicitud.',
    example: 'Solo puedo por la tarde, después de las 20:00.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_LONG_TEXT_LENGTH)
  notes?: string;
}
