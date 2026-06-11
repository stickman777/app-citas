import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Matches, Min } from 'class-validator';

const LOCAL_DATE_TIME_REGEX =
  /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;

export class CreateClientPortalAppointmentDto {
  @ApiProperty({
    description: 'Fecha y hora local de inicio de la cita.',
    example: '2026-06-15T10:00:00',
    pattern: 'YYYY-MM-DDTHH:mm:ss',
  })
  @IsString()
  @Matches(LOCAL_DATE_TIME_REGEX, {
    message: 'La fecha y hora debe tener formato YYYY-MM-DDTHH:mm:ss',
  })
  startDateTime: string;

  @ApiProperty({
    description: 'Identificador del servicio a reservar.',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  serviceId: number;

  @ApiProperty({
    description: 'Identificador del especialista elegido.',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  specialistId: number;
}
