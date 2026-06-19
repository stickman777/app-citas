import { BadRequestException } from '@nestjs/common';
import {
  AvailabilityException,
  AvailabilityExceptionType,
} from '../availability/availability-exception.entity';
import { Availability } from '../availability/availability.entity';
import { Center } from '../centers/center.entity';
import { CenterAccessService } from '../centers/center-access.service';
import { Client } from '../clients/client.entity';
import { ServiceEntity } from '../services/service.entity';
import {
  Specialist,
  SpecialistStatus,
} from '../specialists/specialist.entity';
import { SpecialistAbsence } from '../specialists/specialist-absence.entity';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { AppointmentsService } from './appointments.service';

type MockRepository = {
  find: jest.Mock;
  findOne: jest.Mock;
  count: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  remove: jest.Mock;
  query: jest.Mock;
  createQueryBuilder: jest.Mock;
};

describe('AppointmentsService - HU-06/HU-07 disponibilidad y ciclo de vida de citas', () => {
  let service: AppointmentsService;
  let appointmentsRepository: MockRepository;
  let clientsRepository: MockRepository;
  let servicesRepository: MockRepository;
  let specialistsRepository: MockRepository;
  let availabilityRepository: MockRepository;
  let availabilityExceptionRepository: MockRepository;
  let specialistAbsenceRepository: MockRepository;
  let centerAccessService: { validateCenterAccess: jest.Mock };

  const center: Center = {
    id: 1,
    name: 'Centro Norte',
    active: true,
  } as Center;
  const client: Client = {
    id: 10,
    name: 'Ana',
    phone: '600123123',
    active: true,
    center,
  } as Client;
  const specialist: Specialist = {
    id: 30,
    name: 'Dra. Lopez',
    status: SpecialistStatus.ACTIVE,
    center,
  } as Specialist;
  const bookableService: ServiceEntity = {
    id: 20,
    name: 'Fisioterapia',
    durationMinutes: 30,
    active: true,
    center,
    specialist: null,
  } as ServiceEntity;

  beforeEach(() => {
    appointmentsRepository = createRepositoryMock();
    clientsRepository = createRepositoryMock();
    servicesRepository = createRepositoryMock();
    specialistsRepository = createRepositoryMock();
    availabilityRepository = createRepositoryMock();
    availabilityExceptionRepository = createRepositoryMock();
    specialistAbsenceRepository = createRepositoryMock();
    centerAccessService = {
      validateCenterAccess: jest.fn().mockResolvedValue(undefined),
    };

    clientsRepository.findOne.mockResolvedValue(client);
    servicesRepository.findOne.mockResolvedValue(bookableService);
    specialistsRepository.findOne.mockResolvedValue(specialist);
    specialistAbsenceRepository.count.mockResolvedValue(0);
    availabilityExceptionRepository.find.mockResolvedValue([]);
    availabilityRepository.find.mockResolvedValue([
      { dayOfWeek: 1, startTime: '09:00', endTime: '14:00', center },
    ]);
    appointmentsRepository.find.mockResolvedValue([]);
    appointmentsRepository.create.mockImplementation((value) => ({
      ...value,
      status: AppointmentStatus.SCHEDULED,
    }));
    appointmentsRepository.save.mockImplementation((value) =>
      Promise.resolve(value),
    );

    jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-06-01T08:00:00').getTime());

    service = new AppointmentsService(
      appointmentsRepository as never,
      clientsRepository as never,
      servicesRepository as never,
      specialistsRepository as never,
      availabilityRepository as never,
      availabilityExceptionRepository as never,
      specialistAbsenceRepository as never,
      centerAccessService as unknown as CenterAccessService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('HU-06/HU-07 RNF-02 disponibilidad: devuelve cero huecos cuando el dia esta cerrado', async () => {
    availabilityRepository.find.mockResolvedValue([]);
    availabilityExceptionRepository.find.mockResolvedValue([]);

    const result = await service.findAvailableSlots('2026-06-15', 20, 30);

    expect(result).toEqual([]);
    expect(availabilityRepository.find).toHaveBeenCalledWith({
      where: { dayOfWeek: 1, center: { id: 1 } },
      order: { startTime: 'ASC' },
    });
  });

  it('HU-06/HU-07 RNF-02 disponibilidad: genera huecos de un dia completo hasta el ultimo inicio valido', async () => {
    const oneHourService = {
      ...bookableService,
      durationMinutes: 60,
    } as ServiceEntity;
    servicesRepository.findOne.mockResolvedValue(oneHourService);
    availabilityRepository.find.mockResolvedValue([
      { dayOfWeek: 1, startTime: '00:00', endTime: '23:59', center },
    ]);

    const result = await service.findAvailableSlots('2026-06-15', 20, 30);

    expect(result[0]).toBe('00:00');
    expect(result).toContain('12:00');
    expect(result).toContain('22:45');
    expect(result).not.toContain('23:00');
  });

  it('HU-06/HU-07 RNF-02 disponibilidad: excluye un dia completo bloqueado por excepcion', async () => {
    availabilityRepository.find.mockResolvedValue([
      { dayOfWeek: 1, startTime: '09:00', endTime: '14:00', center },
    ]);
    availabilityExceptionRepository.find.mockResolvedValue([
      {
        id: 99,
        date: '2026-06-15',
        startTime: '00:00',
        endTime: '23:59',
        type: AvailabilityExceptionType.BLOCKED,
        center,
      } as AvailabilityException,
    ]);

    const result = await service.findAvailableSlots('2026-06-15', 20, 30);

    expect(result).toEqual([]);
  });

  it('HU-06/HU-07 RNF-02 disponibilidad: permite una franja justo en el borde de una cita anterior', async () => {
    availabilityRepository.find.mockResolvedValue([
      { dayOfWeek: 1, startTime: '09:00', endTime: '10:00', center },
    ] as Availability[]);
    appointmentsRepository.find.mockResolvedValue([
      {
        id: 1,
        startDateTime: new Date('2026-06-15T09:00:00'),
        duration: 30,
        status: AppointmentStatus.SCHEDULED,
        center,
        specialist,
      } as Appointment,
    ]);

    const result = await service.findAvailableSlots('2026-06-15', 20, 30);

    expect(result).toEqual(['09:30']);
  });

  it('HU-07 RNF-02 citas: crea una cita programada con duracion, centro y disponibilidad calculados', async () => {
    const result = await service.create({
      startDateTime: '2026-06-15T10:00:00',
      clientId: 10,
      serviceId: 20,
      specialistId: 30,
    });

    expect(result).toMatchObject({
      startDateTime: new Date('2026-06-15T10:00:00'),
      duration: 30,
      outsideAvailability: false,
      status: AppointmentStatus.SCHEDULED,
      client,
      service: bookableService,
      center,
      specialist,
    });
  });

  it('HU-07 citas: completa una cita solo si ya ha comenzado', async () => {
    const appointment = {
      id: 1,
      startDateTime: new Date('2026-06-01T07:30:00'),
      duration: 30,
      status: AppointmentStatus.SCHEDULED,
      center,
      client,
      service: bookableService,
      specialist,
    } as Appointment;
    appointmentsRepository.findOne.mockResolvedValue(appointment);

    const result = await service.complete(1);

    expect(result.status).toBe(AppointmentStatus.COMPLETED);
    expect(appointmentsRepository.save).toHaveBeenCalledWith({
      ...appointment,
      status: AppointmentStatus.COMPLETED,
    });
  });

  it('HU-07 RNF-02 citas: rechaza completar una cita que aun no ha comenzado', async () => {
    appointmentsRepository.findOne.mockResolvedValue({
      id: 1,
      startDateTime: new Date('2026-06-01T09:00:00'),
      duration: 30,
      status: AppointmentStatus.SCHEDULED,
      center,
      client,
      service: bookableService,
      specialist,
    } as Appointment);

    await expect(service.complete(1)).rejects.toThrow(
      'No se puede completar una cita que',
    );
    expect(appointmentsRepository.save).not.toHaveBeenCalled();
  });

  it('HU-07 citas: cancela una cita programada', async () => {
    const appointment = {
      id: 1,
      startDateTime: new Date('2026-06-15T10:00:00'),
      duration: 30,
      status: AppointmentStatus.SCHEDULED,
      center,
      client,
      service: bookableService,
      specialist,
    } as Appointment;
    appointmentsRepository.findOne.mockResolvedValue(appointment);

    const result = await service.cancel(1);

    expect(result.status).toBe(AppointmentStatus.CANCELLED);
    expect(appointmentsRepository.save).toHaveBeenCalledWith({
      ...appointment,
      status: AppointmentStatus.CANCELLED,
    });
  });

  it('HU-07 RNF-02 citas: rechaza una transicion invalida desde cancelada a completada', async () => {
    appointmentsRepository.findOne.mockResolvedValue({
      id: 1,
      startDateTime: new Date('2026-06-01T07:30:00'),
      duration: 30,
      status: AppointmentStatus.CANCELLED,
      center,
      client,
      service: bookableService,
      specialist,
    } as Appointment);

    await expect(
      service.update(1, { status: AppointmentStatus.COMPLETED }),
    ).rejects.toThrow('No se puede cambiar el estado de la cita');
    expect(appointmentsRepository.save).not.toHaveBeenCalled();
  });

  it('HU-07 RNF-02 citas: rechaza en memoria una cita que solapa con el mismo especialista', async () => {
    appointmentsRepository.find.mockImplementation(({ where }) => {
      if (where.specialist?.id === 30) {
        return Promise.resolve([
          {
            id: 2,
            startDateTime: new Date('2026-06-15T10:15:00'),
            duration: 30,
            status: AppointmentStatus.SCHEDULED,
            center,
            specialist,
          } as Appointment,
        ]);
      }

      return Promise.resolve([]);
    });

    await expect(
      service.create({
        startDateTime: '2026-06-15T10:00:00',
        clientId: 10,
        serviceId: 20,
        specialistId: 30,
      }),
    ).rejects.toThrow('El horario seleccionado no está disponible');
    expect(appointmentsRepository.save).not.toHaveBeenCalled();
  });

  it('HU-07 RNF-02 citas: rechaza en memoria una cita que solapa con otra del cliente', async () => {
    appointmentsRepository.find.mockImplementation(({ where }) => {
      if (where.client?.id === 10) {
        return Promise.resolve([
          {
            id: 3,
            startDateTime: new Date('2026-06-15T10:15:00'),
            duration: 30,
            status: AppointmentStatus.SCHEDULED,
            client,
          } as Appointment,
        ]);
      }

      return Promise.resolve([]);
    });

    await expect(
      service.create({
        startDateTime: '2026-06-15T10:00:00',
        clientId: 10,
        serviceId: 20,
        specialistId: 30,
      }),
    ).rejects.toThrow('El cliente ya tiene una cita en ese horario');
    expect(appointmentsRepository.save).not.toHaveBeenCalled();
  });

  function createRepositoryMock(): MockRepository {
    return {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      query: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
  }
});
