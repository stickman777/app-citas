import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { MAX_LONG_TEXT_LENGTH } from '../../common/validation.constants';

export enum AppointmentRequestAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class ResolveAppointmentRequestDto {
  @ApiProperty({
    description:
      'Acción del gestor: APPROVE crea la cita (fuera de horario permitido); ' +
      'REJECT descarta la solicitud.',
    enum: AppointmentRequestAction,
    example: AppointmentRequestAction.APPROVE,
  })
  @IsEnum(AppointmentRequestAction)
  action: AppointmentRequestAction;

  @ApiPropertyOptional({
    description: 'Nota para el cliente sobre la decisión.',
    example: 'Aprobada tras mover la cita anterior.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_LONG_TEXT_LENGTH)
  resolutionNote?: string;
}
