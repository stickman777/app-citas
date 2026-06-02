import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  AuthUser,
  CenterAccessService,
} from '../centers/center-access.service';
import { User, UserRole } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { Client } from './client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { CreateClientUserAccountDto } from './dto/create-client-user-account.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    // Repositorio necesario para manejar los clientes
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,

    private readonly centerAccessService: CenterAccessService,
    private readonly usersService: UsersService,
  ) {}

  // Obtiene todos los clientes, incluyendo los inactivos
  async findAllIncludingInactive(authUser?: AuthUser, centerId?: number) {
    const centerIds = await this.getAllowedCenterIds(authUser, centerId);

    if (centerIds.length === 0) return [];

    const clients = await this.clientsRepository.find({
      relations: {
        user: true,
      },
      where: this.getCenterWhere(centerIds),
    });

    return clients.map((client) => this.toClientResponse(client));
  }

  // Obtiene todos los clientes activos
  async findAll(authUser?: AuthUser, centerId?: number) {
    const centerIds = await this.getAllowedCenterIds(authUser, centerId);

    if (centerIds.length === 0) return [];

    const clients = await this.clientsRepository.find({
      relations: {
        user: true,
      },
      where: {
        active: true,
        ...this.getCenterWhere(centerIds),
      },
    });

    return clients.map((client) => this.toClientResponse(client));
  }

  async findForUser(userId: number): Promise<Client> {
    const client = await this.clientsRepository.findOne({
      where: {
        user: {
          id: userId,
        },
      },
    });

    if (!client)
      throw new NotFoundException(
        'No se ha encontrado un cliente vinculado al usuario',
      );

    return client;
  }

  // Crea un nuevo cliente
  async create(clientData: CreateClientDto, authUser?: AuthUser) {
    const { centerId, ...clientPayload } = clientData;

    if (authUser?.role === UserRole.GESTOR && !centerId)
      throw new ForbiddenException('Un gestor debe asignar un centro');

    const center = await this.centerAccessService.getCenter(centerId, authUser);
    const client = this.clientsRepository.create({
      ...clientPayload,
      center,
    });

    const savedClient = await this.clientsRepository.save(client);

    return this.toClientResponse(savedClient);
  }

  // Actualiza un cliente existente por su ID
  async update(id: number, clientData: UpdateClientDto, authUser?: AuthUser) {
    const client = await this.findOne(id, authUser);

    const { centerId, ...clientPayload } = clientData;
    const center = await this.centerAccessService.getCenter(centerId, authUser);

    Object.assign(client, clientPayload);

    if (centerId !== undefined) {
      client.center = center;
    }

    const savedClient = await this.clientsRepository.save(client);

    return this.toClientResponse(savedClient);
  }

  async createUserAccount(
    id: number,
    accountData: CreateClientUserAccountDto,
    authUser?: AuthUser,
  ) {
    const client = await this.findOne(id, authUser);

    if (client.user)
      throw new BadRequestException('El cliente ya tiene una cuenta vinculada');

    if (!client.center?.id)
      throw new BadRequestException(
        'El cliente debe tener un centro asignado',
      );

    const user = await this.usersService.create(
      {
        email: accountData.email,
        name: accountData.name,
        password: accountData.password,
        role: UserRole.CLIENT,
        centerIds: [client.center.id],
      },
      authUser,
    );

    client.user = {
      id: user.id,
    } as User;

    await this.clientsRepository.save(client);

    return this.toClientResponse(await this.findOne(id, authUser));
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

    const savedClient = await this.clientsRepository.save(client);

    return this.toClientResponse(savedClient);
  }

  // Desactiva un cliente por su ID (lo marca como inactivo)
  async deactivate(id: number, authUser?: AuthUser) {
    const client = await this.findOne(id, authUser);

    client.active = false;

    const savedClient = await this.clientsRepository.save(client);

    return this.toClientResponse(savedClient);
  }

  private async findOne(id: number, authUser?: AuthUser): Promise<Client> {
    const client = await this.clientsRepository.findOne({
      relations: {
        user: true,
      },
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
    return (
      (await this.centerAccessService.getAllowedCenterIds(authUser, centerId, {
        includeActiveCentersForAdmin: true,
      })) ?? []
    );
  }

  private async validateClientAccess(
    client: Client,
    authUser?: AuthUser,
  ): Promise<void> {
    if (authUser?.role !== UserRole.GESTOR) return;

    if (!client.center?.id)
      throw new ForbiddenException('No puedes gestionar este cliente');

    await this.centerAccessService.validateCenterAccess(
      client.center.id,
      authUser,
    );
  }

  private toClientResponse(client: Client) {
    return {
      ...client,
      user: client.user
        ? {
            id: client.user.id,
            email: client.user.email,
            name: client.user.name,
          }
        : null,
    };
  }
}
