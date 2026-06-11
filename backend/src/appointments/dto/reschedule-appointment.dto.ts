import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

// Requiere fecha local sin zona horaria, con formato YYYY-MM-DDTHH:mm:ss
const LOCAL_DATE_TIME_REGEX =
  /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;

export class RescheduleAppointmentDto {
  @ApiProperty({
    description: 'Nueva fecha y hora local de inicio de la cita.',
    example: '2026-06-15T12:00:00',
    pattern: 'YYYY-MM-DDTHH:mm:ss',
  })
  @IsString()
  @Matches(LOCAL_DATE_TIME_REGEX, {
    message: 'La fecha y hora debe tener formato YYYY-MM-DDTHH:mm:ss',
  })
  startDateTime: string;

  @ApiPropertyOptional({
    description: 'Permite reprogramar la cita fuera de las franjas de disponibilidad.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  allowOutsideAvailability?: boolean;
}
