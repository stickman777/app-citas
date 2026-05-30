import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AvailabilityException } from '../availability/availability-exception.entity';
import { Availability } from '../availability/availability.entity';
import { CenterAccessService } from '../centers/center-access.service';
import { Client } from '../clients/client.entity';
import { ServiceEntity } from '../services/service.entity';
import { Appointment } from './appointment.entity';
import { AppointmentsService } from './appointments.service';

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: getRepositoryToken(Appointment),
          useValue: {},
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
          provide: getRepositoryToken(Availability),
          useValue: {},
        },
        {
          provide: getRepositoryToken(AvailabilityException),
          useValue: {},
        },
        {
          provide: CenterAccessService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
