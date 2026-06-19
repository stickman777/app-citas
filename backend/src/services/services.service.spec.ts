import { BadRequestException } from '@nestjs/common';
import { Center } from '../centers/center.entity';
import { CenterAccessService } from '../centers/center-access.service';
import {
  Specialist,
  SpecialistStatus,
} from '../specialists/specialist.entity';
import { ServiceEntity } from './service.entity';
import { ServicesService } from './services.service';

describe('ServicesService - HU-04 gestion de servicios y especialistas', () => {
  let service: ServicesService;
  let servicesRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let specialistsRepository: { findOne: jest.Mock };
  let centerAccessService: {
    getCenter: jest.Mock;
    getAllowedCenterIds: jest.Mock;
    validateCenterAccess: jest.Mock;
  };

  const center: Center = {
    id: 1,
    name: 'Centro Norte',
    active: true,
  } as Center;
  const otherCenter: Center = {
    id: 2,
    name: 'Centro Sur',
    active: true,
  } as Center;
  const specialist: Specialist = {
    id: 30,
    name: 'Dra. Lopez',
    status: SpecialistStatus.ACTIVE,
    center,
  } as Specialist;

  beforeEach(() => {
    servicesRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn((value) => Promise.resolve({ id: 20, ...value })),
    };
    specialistsRepository = {
      findOne: jest.fn().mockResolvedValue(specialist),
    };
    centerAccessService = {
      getCenter: jest.fn().mockResolvedValue(center),
      getAllowedCenterIds: jest.fn().mockResolvedValue([1]),
      validateCenterAccess: jest.fn().mockResolvedValue(undefined),
    };

    service = new ServicesService(
      servicesRepository as never,
      specialistsRepository as never,
      centerAccessService as unknown as CenterAccessService,
    );
  });

  it('HU-04 RNF-02 servicios: da de alta un servicio asociado a su centro y especialista', async () => {
    const result = await service.create({
      name: 'Consulta inicial',
      description: 'Primera visita',
      durationMinutes: 45,
      price: 30,
      centerId: 1,
      specialistId: 30,
    });

    expect(centerAccessService.getCenter).toHaveBeenCalledWith(1, undefined);
    expect(specialistsRepository.findOne).toHaveBeenCalledWith({
      where: { id: 30 },
    });
    expect(servicesRepository.create).toHaveBeenCalledWith({
      name: 'Consulta inicial',
      description: 'Primera visita',
      durationMinutes: 45,
      price: 30,
      center,
      specialist,
    });
    expect(result).toMatchObject({
      id: 20,
      name: 'Consulta inicial',
      center,
      specialist,
    });
  });

  it('HU-04 RNF-02 servicios: rechaza el alta sin centro', async () => {
    await expect(
      service.create({
        name: 'Consulta inicial',
        durationMinutes: 45,
        specialistId: 30,
      } as never),
    ).rejects.toThrow(new BadRequestException('Centro requerido'));
    expect(servicesRepository.save).not.toHaveBeenCalled();
  });

  it('HU-04 RNF-02 servicios: rechaza un especialista que no pertenece al centro del servicio', async () => {
    specialistsRepository.findOne.mockResolvedValue({
      ...specialist,
      center: otherCenter,
    } as Specialist);

    await expect(
      service.create({
        name: 'Consulta inicial',
        durationMinutes: 45,
        centerId: 1,
        specialistId: 30,
      }),
    ).rejects.toThrow('El especialista debe pertenecer al centro del servicio');
    expect(servicesRepository.save).not.toHaveBeenCalled();
  });

  it('HU-04 RNF-02 servicios: edita un servicio conservando la regla centro-especialista', async () => {
    const existingService = {
      id: 20,
      name: 'Consulta inicial',
      durationMinutes: 45,
      price: 30,
      active: true,
      center,
      specialist,
    } as ServiceEntity;
    servicesRepository.findOne.mockResolvedValue(existingService);
    servicesRepository.save.mockImplementation((value) => Promise.resolve(value));

    const result = await service.update(20, {
      name: 'Consulta seguimiento',
      durationMinutes: 30,
      centerId: 1,
      specialistId: 30,
    });

    expect(result).toMatchObject({
      id: 20,
      name: 'Consulta seguimiento',
      durationMinutes: 30,
      center,
      specialist,
    });
    expect(servicesRepository.save).toHaveBeenCalledWith({
      ...existingService,
      name: 'Consulta seguimiento',
      durationMinutes: 30,
      center,
      specialist,
    });
  });
});
