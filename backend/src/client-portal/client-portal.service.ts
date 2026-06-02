import { ForbiddenException, Injectable } from '@nestjs/common';
import { Appointment } from '../appointments/appointment.entity';
import { AppointmentsService } from '../appointments/appointments.service';
import { Client } from '../clients/client.entity';
import { ClientsService } from '../clients/clients.service';

@Injectable()
export class ClientPortalService {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly appointmentsService: AppointmentsService,
  ) {}

  async getProfile(userId: number) {
    const client = await this.getActiveClientForUser(userId);

    return this.toProfileResponse(client);
  }

  async getAppointments(userId: number) {
    const client = await this.getActiveClientForUser(userId);
    const appointments = await this.appointmentsService.findAllForClient(
      client.id,
    );

    return appointments.map((appointment) =>
      this.toAppointmentResponse(appointment),
    );
  }

  private async getActiveClientForUser(userId: number): Promise<Client> {
    const client = await this.clientsService.findForUser(userId);

    if (!client.active)
      throw new ForbiddenException('El cliente no esta activo');

    return client;
  }

  private toProfileResponse(client: Client) {
    return {
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email ?? null,
      center: client.center
        ? {
            id: client.center.id,
            name: client.center.name,
            city: client.center.city ?? null,
            logoUrl: client.center.logoUrl ?? null,
          }
        : null,
    };
  }

  private toAppointmentResponse(appointment: Appointment) {
    return {
      id: appointment.id,
      startDateTime: appointment.startDateTime,
      duration: appointment.duration,
      status: appointment.status,
      center: {
        id: appointment.center.id,
        name: appointment.center.name,
        city: appointment.center.city ?? null,
        logoUrl: appointment.center.logoUrl ?? null,
      },
      service: {
        id: appointment.service.id,
        name: appointment.service.name,
        durationMinutes: appointment.service.durationMinutes,
        price: appointment.service.price ?? null,
      },
      specialist: {
        id: appointment.specialist.id,
        name: appointment.specialist.name,
        specialty: appointment.specialist.specialty ?? null,
      },
    };
  }
}
