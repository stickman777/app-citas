import { BadRequestException } from '@nestjs/common';
import { AppointmentStatus } from './appointment.entity';

// Transiciones permitidas en el ciclo de vida de una cita.
// SCHEDULED es el único estado de origen: COMPLETED y CANCELLED son terminales.
export const APPOINTMENT_STATUS_TRANSITIONS: Record<
  AppointmentStatus,
  AppointmentStatus[]
> = {
  [AppointmentStatus.SCHEDULED]: [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
  ],
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.CANCELLED]: [],
};

export function canTransitionAppointmentStatus(
  from: AppointmentStatus,
  to: AppointmentStatus,
): boolean {
  // Mantener el mismo estado siempre es válido (no es una transición).
  if (from === to) return true;

  return APPOINTMENT_STATUS_TRANSITIONS[from].includes(to);
}

export function assertAppointmentStatusTransition(
  from: AppointmentStatus,
  to: AppointmentStatus,
): void {
  if (!canTransitionAppointmentStatus(from, to))
    throw new BadRequestException(
      `No se puede cambiar el estado de la cita de ${from} a ${to}`,
    );
}

// Una cita no puede marcarse como completada si todavía no ha comenzado.
export function assertAppointmentCanBeCompleted(startDateTime: Date): void {
  if (new Date(startDateTime).getTime() > Date.now())
    throw new BadRequestException(
      'No se puede completar una cita que aún no ha comenzado',
    );
}
