import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

// Requiere fecha local sin zona horaria, con formato YYYY-MM-DDTHH:mm:ss
const LOCAL_DATE_TIME_REGEX =
  /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;

export class RescheduleAppointmentDto {
  @IsString()
  @Matches(LOCAL_DATE_TIME_REGEX, {
    message: 'La fecha y hora debe tener formato YYYY-MM-DDTHH:mm:ss',
  })
  startDateTime: string;

  @IsOptional()
  @IsBoolean()
  allowOutsideAvailability?: boolean;
}
