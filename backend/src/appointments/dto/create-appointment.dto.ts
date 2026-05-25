import { IsDateString, IsInt, Min } from 'class-validator';

export class CreateAppointmentDto {
  @IsDateString()
  startDateTime: string;

  @IsInt()
  @Min(1)
  clientId: number;

  @IsInt()
  @Min(1)
  serviceId: number;
}
