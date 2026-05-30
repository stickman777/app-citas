import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CenterAccessService } from '../centers/center-access.service';
import { AvailabilityException } from './availability-exception.entity';
import { Availability } from './availability.entity';
import { AvailabilityService } from './availability.service';

describe('AvailabilityService', () => {
  let service: AvailabilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityService,
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

    service = module.get<AvailabilityService>(AvailabilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
