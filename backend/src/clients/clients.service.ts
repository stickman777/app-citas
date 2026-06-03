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
import {
  createClientInvitationToken,
  getClientInvitationExpirationDate,
  hashClientInvitationToken,
} from '../common/client-invitation-token';
import { UserRole } from '../users/user.entity';
import { Client } from './client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

interface OwnClientProfileData {
  name?: string;
  phone?: string;
  email?: string | null;
}

@Injectable()
export class ClientsService {
  constructor(
    // Repositorio necesario para manejar los clientes
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,

    private readonly centerAccessService: CenterAccessService,
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
      relations: {
        user: true,
        center: true,
      },
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

  async updateForUser(
    userId: number,
    clientData: OwnClientProfileData,
  ): Promise<Client> {
    const client = await this.findForUser(userId);

    if (!client.active)
      throw new ForbiddenException('El cliente no esta activo');

    if (clientData.name !== undefined) {
      client.name = this.normalizeRequiredText(
        clientData.name,
        'Nombre requerido',
      );
    }

    if (clientData.phone !== undefined) {
      client.phone = this.normalizeRequiredText(
        clientData.phone,
        'Telefono requerido',
      );
    }

    if (clientData.email !== undefined) {
      client.email = clientData.email?.trim().toLowerCase() || null;
    }

    return this.clientsRepository.save(client);
  }

  // Crea un nuevo cliente
  async create(clientData: CreateClientDto, authUser?: AuthUser) {
    const { centerId, ...clientPayload } = clientData;

    const center = await this.centerAccessService.getCenter(centerId, authUser);

    if (!center) throw new BadRequestException('Centro requerido');

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

  async createInvitation(id: number, authUser?: AuthUser) {
    const client = await this.findOne(id, authUser);

    if (client.user)
      throw new BadRequestException('El cliente ya tiene una cuenta vinculada');

    if (!client.center?.id)
      throw new BadRequestException(
        'El cliente debe tener un centro asignado',
      );

    const token = createClientInvitationToken();
    const expiresAt = getClientInvitationExpirationDate();

    client.invitationTokenHash = hashClientInvitationToken(token);
    client.invitationExpiresAt = expiresAt;

    await this.clientsRepository.save(client);

    return {
      token,
      expiresAt,
    };
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
    const clientResponse = { ...client };
    delete clientResponse.invitationTokenHash;
    delete clientResponse.invitationExpiresAt;

    return {
      ...clientResponse,
      user: client.user
        ? {
            id: client.user.id,
            email: client.user.email,
            name: client.user.name,
          }
        : null,
    };
  }

  private normalizeRequiredText(value: string, message: string): string {
    const normalizedValue = value.trim();

    if (!normalizedValue) throw new BadRequestException(message);

    return normalizedValue;
  }
}
