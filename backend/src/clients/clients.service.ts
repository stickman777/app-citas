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

  findAll() {
    return this.clientsRepository.find();
  }

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

  // Elimina un cliente por su ID, verificando que no tenga citas asociadas
  async remove(id: number) {
    const client = await this.clientsRepository.findOne({
      where: { id },
    });

    if (!client) throw new NotFoundException('No se ha encontrado el cliente');

    const hasAppointments = await this.appointmentsRepository.exists({
      where: {
        client: {
          id,
        },
      },
    });

    if (hasAppointments)
      throw new BadRequestException(
        'No se puede eliminar un cliente con citas asociadas',
      );

    await this.clientsRepository.remove(client);

    return {
      message: 'Cliente eliminado correctamente',
    };
  }
}
