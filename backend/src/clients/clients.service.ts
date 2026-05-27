import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Center } from '../centers/center.entity';
import { User, UserRole } from '../users/user.entity';
import { Client } from './client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

interface AuthUser {
  id: number;
  role: UserRole;
}

@Injectable()
export class ClientsService {
  constructor(
    // Repositorio necesario para manejar los clientes
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,

    @InjectRepository(Center)
    private centersRepository: Repository<Center>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Obtiene todos los clientes, incluyendo los inactivos
  async findAllIncludingInactive(authUser?: AuthUser, centerId?: number) {
    const centerIds = await this.getAllowedCenterIds(authUser, centerId);

    if (centerIds.length === 0) return [];

    return this.clientsRepository.find({
      where: this.getCenterWhere(centerIds),
    });
  }

  // Obtiene todos los clientes activos
  async findAll(authUser?: AuthUser, centerId?: number) {
    const centerIds = await this.getAllowedCenterIds(authUser, centerId);

    if (centerIds.length === 0) return [];

    return this.clientsRepository.find({
      where: {
        active: true,
        ...this.getCenterWhere(centerIds),
      },
    });
  }

  // Crea un nuevo cliente
  async create(clientData: CreateClientDto, authUser?: AuthUser) {
    const { centerId, ...clientPayload } = clientData;

    if (authUser?.role === UserRole.GESTOR && !centerId)
      throw new ForbiddenException('Un gestor debe asignar un centro');

    const center = await this.getCenter(centerId, authUser);
    const client = this.clientsRepository.create({
      ...clientPayload,
      center,
    });

    return this.clientsRepository.save(client);
  }

  // Actualiza un cliente existente por su ID
  async update(id: number, clientData: UpdateClientDto, authUser?: AuthUser) {
    const client = await this.findOne(id, authUser);

    const { centerId, ...clientPayload } = clientData;
    const center = await this.getCenter(centerId, authUser);

    Object.assign(client, clientPayload);

    if (centerId !== undefined) {
      client.center = center;
    }

    return this.clientsRepository.save(client);
  }

  private async getCenter(
    centerId: number | undefined,
    authUser?: AuthUser,
  ): Promise<Center | null> {
    if (!centerId) return null;

    await this.validateCenterAccess(centerId, authUser);

    const center = await this.centersRepository.findOne({
      where: { id: centerId },
    });

    if (!center) throw new NotFoundException('No se ha encontrado el centro');

    return center;
  }

  private getCenterWhere(centerIds: number[]) {
    return {
      center: {
        id: In(centerIds),
      },
    };
  }

  // Activa un cliente por su ID (lo marca como activo)
  async activate(id: number, authUser?: AuthUser) {
    const client = await this.findOne(id, authUser);

    client.active = true;

    return this.clientsRepository.save(client);
  }

  // Desactiva un cliente por su ID (lo marca como inactivo)
  async deactivate(id: number, authUser?: AuthUser) {
    const client = await this.findOne(id, authUser);

    client.active = false;

    return this.clientsRepository.save(client);
  }

  private async findOne(id: number, authUser?: AuthUser): Promise<Client> {
    const client = await this.clientsRepository.findOne({
      where: { id },
    });

    if (!client) throw new NotFoundException('No se ha encontrado el cliente');

    await this.validateClientAccess(client, authUser);

    return client;
  }

  private async getAllowedCenterIds(
    authUser?: AuthUser,
    centerId?: number,
  ): Promise<number[]> {
    if (authUser?.role !== UserRole.GESTOR) {
      if (centerId) return [centerId];

      const centers = await this.centersRepository.find({
        select: {
          id: true,
        },
        where: {
          active: true,
        },
      });

      return centers.map((center) => center.id);
    }

    const managedCenterIds = await this.getManagedCenterIds(authUser);

    if (centerId) {
      if (!managedCenterIds.includes(centerId))
        throw new ForbiddenException('No puedes gestionar este centro');

      return [centerId];
    }

    return managedCenterIds;
  }

  private async validateClientAccess(
    client: Client,
    authUser?: AuthUser,
  ): Promise<void> {
    if (authUser?.role !== UserRole.GESTOR) return;

    if (!client.center?.id)
      throw new ForbiddenException('No puedes gestionar este cliente');

    await this.validateCenterAccess(client.center.id, authUser);
  }

  private async validateCenterAccess(
    centerId: number,
    authUser?: AuthUser,
  ): Promise<void> {
    if (authUser?.role !== UserRole.GESTOR) return;

    const managedCenterIds = await this.getManagedCenterIds(authUser);

    if (!managedCenterIds.includes(centerId))
      throw new ForbiddenException('No puedes gestionar este centro');
  }

  private async getManagedCenterIds(authUser?: AuthUser): Promise<number[]> {
    if (!authUser) return [];

    const user = await this.usersRepository.findOne({
      relations: {
        centers: true,
      },
      where: { id: authUser.id },
    });

    if (!user)
      throw new BadRequestException('No se ha encontrado el usuario autenticado');

    return user.centers?.map((center) => center.id) ?? [];
  }
}
