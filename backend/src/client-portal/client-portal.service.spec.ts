import { BadRequestException } from '@nestjs/common';
import { AppointmentStatus } from '../appointments/appointment.entity';
import { AppointmentsService } from '../appointments/appointments.service';
import { AppointmentRequestsService } from '../appointment-requests/appointment-requests.service';
import { Center } from '../centers/center.entity';
import { Client } from '../clients/client.entity';
import { ClientsService } from '../clients/clients.service';
import { ServiceEntity } from '../services/service.entity';
import {
  Specialist,
  SpecialistStatus,
} from '../specialists/specialist.entity';
import { ClientPortalService } from './client-portal.service';

describe('ClientPortalService - HU-08 portal del cliente', () => {
  let service: ClientPortalService;
  let clientsService: { findForUser: jest.Mock; updateForUser: jest.Mock };
  let appointmentsService: {
    create: jest.Mock;
    findAllForClient: jest.Mock;
    cancel: jest.Mock;
    findAvailableSlots: jest.Mock;
  };
  let appointmentRequestsService: {
    findForClient: jest.Mock;
    cancelForClient: jest.Mock;
    createForClient: jest.Mock;
  };
  let servicesRepository: { find: jest.Mock; findOne: jest.Mock };
  let specialistsRepository: { find: jest.Mock; findOne: jest.Mock };

  const center: Center = {
    id: 1,
    name: 'Centro Norte',
    city: 'Madrid',
    logoUrl: '/logo.png',
    active: true,
  } as Center;
  const client: Client = {
    id: 10,
    name: 'Ana',
    phone: '600123123',
    email: 'ana@example.com',
    active: true,
    center,
  } as Client;
  const specialist: Specialist = {
    id: 30,
    name: 'Dra. Lopez',
    specialty: 'Fisio',
    status: SpecialistStatus.ACTIVE,
    center,
  } as Specialist;
  const bookableService: ServiceEntity = {
    id: 20,
    name: 'Fisioterapia',
    durationMinutes: 30,
    price: 35,
    active: true,
    center,
    specialist: null,
  } as ServiceEntity;

  beforeEach(() => {
    clientsService = {
      findForUser: jest.fn().mockResolvedValue(client),
      updateForUser: jest.fn(),
    };
    appointmentsService = {
      create: jest.fn(),
      findAllForClient: jest.fn(),
      cancel: jest.fn(),
      findAvailableSlots: jest.fn(),
    };
    appointmentRequestsService = {
      findForClient: jest.fn(),
      cancelForClient: jest.fn(),
      createForClient: jest.fn(),
    };
    servicesRepository = {
      find: jest.fn(),
      findOne: jest.fn().mockResolvedValue(bookableService),
    };
    specialistsRepository = {
      find: jest.fn(),
      findOne: jest.fn().mockResolvedValue(specialist),
    };

    appointmentsService.create.mockResolvedValue({
      id: 99,
      startDateTime: new Date('2026-06-15T10:00:00'),
      duration: 30,
      status: AppointmentStatus.SCHEDULED,
      outsideAvailability: false,
      center,
      client,
      service: bookableService,
      specialist,
    });

    service = new ClientPortalService(
      clientsService as unknown as ClientsService,
      appointmentsService as unknown as AppointmentsService,
      appointmentRequestsService as unknown as AppointmentRequestsService,
      servicesRepository as never,
      specialistsRepository as never,
    );
  });

  it('HU-08 RNF-01 portal: fija el cliente autenticado y reserva solo dentro del centro del cliente', async () => {
    const result = await service.createAppointment(100, {
      startDateTime: '2026-06-15T10:00:00',
      serviceId: 20,
      specialistId: 30,
    });

    expect(servicesRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: 20,
        active: true,
        center: { id: 1 },
      },
    });
    expect(specialistsRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: 30,
        status: SpecialistStatus.ACTIVE,
        center: { id: 1 },
      },
    });
    expect(appointmentsService.create).toHaveBeenCalledWith({
      startDateTime: '2026-06-15T10:00:00',
      serviceId: 20,
      specialistId: 30,
      clientId: 10,
      allowOutsideAvailability: false,
    });
    expect(result).toEqual({
      id: 99,
      startDateTime: new Date('2026-06-15T10:00:00'),
      duration: 30,
      status: AppointmentStatus.SCHEDULED,
      outsideAvailability: false,
      center: {
        id: 1,
        name: 'Centro Norte',
        city: 'Madrid',
        logoUrl: '/logo.png',
      },
      service: {
        id: 20,
        name: 'Fisioterapia',
        durationMinutes: 30,
        price: 35,
      },
      specialist: {
        id: 30,
        name: 'Dra. Lopez',
        specialty: 'Fisio',
      },
    });
  });

  it('HU-08 RNF-01 RNF-02 portal: rechaza una reserva cuando el servicio no pertenece al centro del cliente', async () => {
    servicesRepository.findOne.mockResolvedValue(null);

    await expect(
      service.createAppointment(100, {
        startDateTime: '2026-06-15T10:00:00',
        serviceId: 20,
        specialistId: 30,
      }),
    ).rejects.toThrow(new BadRequestException('El servicio no esta disponible'));
    expect(appointmentsService.create).not.toHaveBeenCalled();
  });
});
