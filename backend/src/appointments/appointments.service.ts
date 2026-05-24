import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Client } from '../clients/client.entity';
import { ServiceEntity } from '../services/service.entity';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class AppointmentsService {
  constructor(
    // Repositorios necesarios para manejar las citas, clientes y servicios
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,

    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,

    @InjectRepository(ServiceEntity)
    private servicesRepository: Repository<ServiceEntity>,
  ) {}

  findAll() {
    return this.appointmentsRepository.find();
  }

  async create(appointmentData: CreateAppointmentDto) {
    const client = await this.clientsRepository.findOne({
      where: { id: appointmentData.clientId },
    });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const service = await this.servicesRepository.findOne({
      where: { id: appointmentData.serviceId },
    });

    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    const appointment = this.appointmentsRepository.create({
      startDateTime: appointmentData.startDateTime,
      duration: service.duration,
      client,
      service,
    });

    return this.appointmentsRepository.save(appointment);
  }
}
