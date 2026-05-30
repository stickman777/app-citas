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
  @IsOptional()
  @IsString()
  @Matches(LOCAL_DATE_TIME_REGEX, {
    message: 'La fecha y hora debe tener formato YYYY-MM-DDTHH:mm:ss',
  })
  startDateTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  clientId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  serviceId?: number;

  @IsOptional()
  @IsBoolean()
  allowOutsideAvailability?: boolean;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}
