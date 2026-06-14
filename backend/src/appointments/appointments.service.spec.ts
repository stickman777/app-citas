import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AvailabilityException } from '../availability/availability-exception.entity';
import { Availability } from '../availability/availability.entity';
import { CenterAccessService } from '../centers/center-access.service';
import { Client } from '../clients/client.entity';
import { ServiceEntity } from '../services/service.entity';
import { Specialist } from '../specialists/specialist.entity';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { AppointmentsService } from './appointments.service';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let appointmentsRepository: { find: jest.Mock };
  let availabilityRepository: { find: jest.Mock };
  let availabilityExceptionRepository: { find: jest.Mock };

  beforeEach(async () => {
    appointmentsRepository = {
      find: jest.fn(),
    };
    availabilityRepository = {
      find: jest.fn(),
    };
    availabilityExceptionRepository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: getRepositoryToken(Appointment),
          useValue: appointmentsRepository,
        },
        {
          provide: getRepositoryToken(Client),
          useValue: {},
        },
        {
          provide: getRepositoryToken(ServiceEntity),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Specialist),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Availability),
          useValue: availabilityRepository,
        },
        {
          provide: getRepositoryToken(AvailabilityException),
          useValue: availabilityExceptionRepository,
        },
        {
          provide: CenterAccessService,
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn((work) =>
              work({ query: jest.fn().mockResolvedValue(undefined) }),
            ),
          },
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rechaza una cita si el cliente ya tiene otra solapada en cualquier centro', async () => {
    const startDate = new Date('2026-06-01T10:00:00');

    availabilityRepository.find.mockResolvedValue([
      {
        startTime: '09:00',
        endTime: '14:00',
      },
    ]);
    availabilityExceptionRepository.find.mockResolvedValue([]);
    appointmentsRepository.find.mockImplementation(({ where }) => {
      if (where.client?.id === 7)
        return Promise.resolve([
          {
            id: 10,
            startDateTime: new Date('2026-06-01T10:15:00'),
            duration: 30,
            status: AppointmentStatus.SCHEDULED,
            center: { id: 99 },
          },
        ]);

      return Promise.resolve([]);
    });

    await expect(
      (
        service as unknown as {
          validateAppointmentSlot: (
            startDate: Date,
            duration: number,
            centerId: number,
            specialistId: number,
            clientId: number,
          ) => Promise<boolean>;
        }
      ).validateAppointmentSlot(startDate, 30, 1, 2, 7),
    ).rejects.toThrow('El cliente ya tiene una cita en ese horario');
  });
});
