import { BadRequestException } from '@nestjs/common';
import { Center } from '../centers/center.entity';
import { CenterAccessService } from '../centers/center-access.service';
import { User } from '../users/user.entity';
import { Client } from './client.entity';
import { ClientsService } from './clients.service';

describe('ClientsService - HU-03 gestion de clientes e invitaciones', () => {
  let service: ClientsService;
  let clientsRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
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

  beforeEach(() => {
    clientsRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn((value) => Promise.resolve({ id: 10, ...value })),
    };
    centerAccessService = {
      getCenter: jest.fn().mockResolvedValue(center),
      getAllowedCenterIds: jest.fn().mockResolvedValue([1]),
      validateCenterAccess: jest.fn().mockResolvedValue(undefined),
    };

    service = new ClientsService(
      clientsRepository as never,
      centerAccessService as unknown as CenterAccessService,
    );
  });

  it('HU-03 RNF-01 clientes: da de alta un cliente asociado al centro permitido y oculta el token de invitacion', async () => {
    clientsRepository.save.mockResolvedValue({
      id: 10,
      name: 'Ana Martinez',
      phone: '600123456',
      email: 'ana@example.com',
      active: true,
      center,
      invitationTokenHash: 'hash-secreto',
      invitationExpiresAt: new Date('2026-06-20T10:00:00'),
      user: undefined,
    } as Client);

    const result = await service.create({
      name: 'Ana Martinez',
      phone: '600123456',
      email: 'ana@example.com',
      centerId: 1,
    });

    expect(centerAccessService.getCenter).toHaveBeenCalledWith(1, undefined);
    expect(clientsRepository.create).toHaveBeenCalledWith({
      name: 'Ana Martinez',
      phone: '600123456',
      email: 'ana@example.com',
      center,
    });
    expect(result).toEqual({
      id: 10,
      name: 'Ana Martinez',
      phone: '600123456',
      email: 'ana@example.com',
      active: true,
      center,
      user: null,
    });
  });

  it('HU-03 RNF-02 clientes: rechaza el alta si no se puede fijar un centro', async () => {
    centerAccessService.getCenter.mockResolvedValue(null);

    await expect(
      service.create({
        name: 'Ana Martinez',
        phone: '600123456',
        centerId: 1,
      }),
    ).rejects.toThrow(new BadRequestException('Centro requerido'));
    expect(clientsRepository.save).not.toHaveBeenCalled();
  });

  it('HU-03 RNF-02 clientes: edita el perfil propio normalizando nombre, telefono y email', async () => {
    const client = {
      id: 10,
      name: 'Ana',
      phone: '600000000',
      email: 'ana@old.test',
      active: true,
      center,
      user: { id: 100 } as User,
    } as Client;
    clientsRepository.findOne.mockResolvedValue(client);
    clientsRepository.save.mockImplementation((value) => Promise.resolve(value));

    const result = await service.updateForUser(100, {
      name: '  Ana Garcia  ',
      phone: '  611222333  ',
      email: '  ANA@EXAMPLE.COM  ',
    });

    expect(result).toMatchObject({
      id: 10,
      name: 'Ana Garcia',
      phone: '611222333',
      email: 'ana@example.com',
    });
    expect(clientsRepository.save).toHaveBeenCalledWith({
      ...client,
      name: 'Ana Garcia',
      phone: '611222333',
      email: 'ana@example.com',
    });
  });

  it('HU-03 RNF-02 clientes: rechaza una edicion propia con nombre vacio', async () => {
    clientsRepository.findOne.mockResolvedValue({
      id: 10,
      name: 'Ana',
      phone: '600000000',
      active: true,
      center,
      user: { id: 100 } as User,
    } as Client);

    await expect(
      service.updateForUser(100, { name: '   ' }),
    ).rejects.toThrow('Nombre requerido');
    expect(clientsRepository.save).not.toHaveBeenCalled();
  });

  it('HU-03 RNF-02 clientes: edita un cliente normalizando nombre, telefono y email', async () => {
    clientsRepository.findOne.mockResolvedValue({
      id: 10,
      name: 'Ana',
      phone: '600000000',
      email: 'ana@old.test',
      active: true,
      center,
    } as Client);
    clientsRepository.save.mockImplementation((value) => Promise.resolve(value));

    const result = await service.update(10, {
      name: '  Ana Garcia  ',
      phone: '  611222333  ',
      email: '  ANA@EXAMPLE.COM  ',
    });

    expect(result).toMatchObject({
      id: 10,
      name: 'Ana Garcia',
      phone: '611222333',
      email: 'ana@example.com',
    });
  });

  it('HU-03 RNF-02 clientes: rechaza una edicion con nombre vacio', async () => {
    clientsRepository.findOne.mockResolvedValue({
      id: 10,
      name: 'Ana',
      phone: '600000000',
      active: true,
      center,
    } as Client);

    await expect(service.update(10, { name: '   ' })).rejects.toThrow(
      'Nombre requerido',
    );
    expect(clientsRepository.save).not.toHaveBeenCalled();
  });
});
