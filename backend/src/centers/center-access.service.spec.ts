import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../users/user.entity';
import { CenterAccessService } from './center-access.service';
import { Center } from './center.entity';

describe('CenterAccessService - HU-05 gestion de centros y centro activo', () => {
  let service: CenterAccessService;
  let centersRepository: { find: jest.Mock; findOne: jest.Mock };
  let usersRepository: { findOne: jest.Mock };

  beforeEach(() => {
    centersRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    usersRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 7,
        role: UserRole.GESTOR,
        centers: [
          { id: 1, name: 'Centro Norte' } as Center,
          { id: 2, name: 'Centro Sur' } as Center,
        ],
      }),
    };

    service = new CenterAccessService(
      centersRepository as never,
      usersRepository as never,
    );
  });

  it('HU-05 RNF-01 centros: limita al gestor a sus centros asignados cuando no filtra por centro', async () => {
    const result = await service.getAllowedCenterIds({
      id: 7,
      role: UserRole.GESTOR,
    });

    expect(result).toEqual([1, 2]);
    expect(usersRepository.findOne).toHaveBeenCalledWith({
      relations: { centers: true },
      where: { id: 7 },
    });
  });

  it('HU-05 RNF-01 centros: permite al gestor operar sobre un centro asignado explicitamente', async () => {
    const result = await service.getAllowedCenterIds(
      { id: 7, role: UserRole.GESTOR },
      2,
    );

    expect(result).toEqual([2]);
  });

  it('HU-05 RNF-01 centros: rechaza al gestor cuando intenta operar sobre un centro no asignado', async () => {
    await expect(
      service.validateCenterAccess(9, { id: 7, role: UserRole.GESTOR }),
    ).rejects.toThrow(new ForbiddenException('No puedes gestionar este centro'));
  });
});
