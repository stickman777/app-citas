import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Center } from '../centers/center.entity';
import { Client } from './client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    // Repositorio necesario para manejar los clientes
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,

    @InjectRepository(Center)
    private centersRepository: Repository<Center>,
  ) {}

  // Obtiene todos los clientes, incluyendo los inactivos
  findAllIncludingInactive() {
    return this.clientsRepository.find();
  }

  // Obtiene todos los clientes activos
  findAll() {
    return this.clientsRepository.find({
      where: {
        active: true,
      },
    });
  }

  // Crea un nuevo cliente
  async create(clientData: CreateClientDto) {
    const { centerId, ...clientPayload } = clientData;
    const center = await this.getCenter(centerId);
    const client = this.clientsRepository.create({
      ...clientPayload,
      center,
    });

    return this.clientsRepository.save(client);
  }

  // Actualiza un cliente existente por su ID
  async update(id: number, clientData: UpdateClientDto) {
    const client = await this.clientsRepository.findOne({
      where: { id },
    });

    if (!client) throw new NotFoundException('No se ha encontrado el cliente');

    const { centerId, ...clientPayload } = clientData;
    const center = await this.getCenter(centerId);

    Object.assign(client, clientPayload);

    if (centerId !== undefined) {
      client.center = center;
    }

    return this.clientsRepository.save(client);
  }

  private async getCenter(centerId?: number): Promise<Center | null> {
    if (!centerId) return null;

    const center = await this.centersRepository.findOne({
      where: { id: centerId },
    });

    if (!center) throw new NotFoundException('No se ha encontrado el centro');

    return center;
  }

  // Activa un cliente por su ID (lo marca como activo)
  async activate(id: number) {
    const client = await this.clientsRepository.findOne({
      where: { id },
    });

    if (!client) throw new NotFoundException('No se ha encontrado el cliente');

    client.active = true;

    return this.clientsRepository.save(client);
  }

  // Desactiva un cliente por su ID (lo marca como inactivo)
  async deactivate(id: number) {
    const client = await this.clientsRepository.findOne({
      where: { id },
    });

    if (!client) throw new NotFoundException('No se ha encontrado el cliente');

    client.active = false;

    return this.clientsRepository.save(client);
  }
}
