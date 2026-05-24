import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Appointment } from 'src/appointments/appointment.entity';

@Injectable()
export class ClientsService {
  constructor(
    // Repositorio necesario para manejar los clientes
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,

    // Repositorio necesario para verificar si un cliente tiene citas asociadas antes de eliminarlo
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
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
  create(clientData: CreateClientDto) {
    const client = this.clientsRepository.create(clientData);
    return this.clientsRepository.save(client);
  }

  // Actualiza un cliente existente por su ID
  async update(id: number, clientData: UpdateClientDto) {
    const client = await this.clientsRepository.findOne({
      where: { id },
    });

    if (!client) throw new NotFoundException('No se ha encontrado el cliente');

    Object.assign(client, clientData);

    return this.clientsRepository.save(client);
  }

  // Activa un cliente por su ID (lo marca como activo)
  async activate(id: number) {
    const client = await this.clientsRepository.findOne({
      where: { id },
    });

    if (!client) throw new NotFoundException('No se ha encontrado el cliente');

    client.active = true;

    await this.clientsRepository.save(client);

    return {
      message: 'Cliente activado correctamente',
    };
  }

  // Desactiva un cliente por su ID (lo marca como inactivo)
  async deactivate(id: number) {
    const client = await this.clientsRepository.findOne({
      where: { id },
    });

    if (!client) throw new NotFoundException('No se ha encontrado el cliente');

    client.active = false;

    await this.clientsRepository.save(client);

    return {
      message: 'Cliente desactivado correctamente',
    };
  }
}
