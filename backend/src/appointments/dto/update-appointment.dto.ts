import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { AppointmentStatus } from '../appointment.entity';

const LOCAL_DATE_TIME_REGEX =
  /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;

export class UpdateAppointmentDto {
  @ApiPropertyOptional({
    description: 'Nueva fecha y hora local de inicio de la cita.',
    example: '2026-06-15T11:00:00',
    pattern: 'YYYY-MM-DDTHH:mm:ss',
  })
  @IsOptional()
  @IsString()
  @Matches(LOCAL_DATE_TIME_REGEX, {
    message: 'La fecha y hora debe tener formato YYYY-MM-DDTHH:mm:ss',
  })
  startDateTime?: string;

  @ApiPropertyOptional({
    description: 'Nuevo identificador del cliente.',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  clientId?: number;

  @ApiPropertyOptional({
    description: 'Nuevo identificador del servicio.',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  serviceId?: number;

  @ApiPropertyOptional({
    description: 'Nuevo identificador del especialista.',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  specialistId?: number;

  @ApiPropertyOptional({
    description: 'Permite actualizar la cita fuera de las franjas de disponibilidad.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  allowOutsideAvailability?: boolean;

  @ApiPropertyOptional({
    description: 'Estado de la cita.',
    enum: AppointmentStatus,
    example: AppointmentStatus.SCHEDULED,
  })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}
