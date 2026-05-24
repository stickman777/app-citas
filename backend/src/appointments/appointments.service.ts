import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Client } from '../clients/client.entity';
import { ServiceEntity } from '../services/service.entity';
import { Between } from 'typeorm';
import { AppointmentStatus } from './appointment.entity';

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

  // Obtiene todas las citas, con opción de filtrar por fecha
  async findAll(date?: string) {
    if (!date) {
      return this.appointmentsRepository.find({
        order: {
          startDateTime: 'ASC',
        },
      });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.appointmentsRepository.find({
      where: {
        startDateTime: Between(startOfDay, endOfDay),
      },
      order: {
        startDateTime: 'ASC',
      },
    });
  }

  // Crea una nueva cita
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

    const startDate = new Date(appointmentData.startDateTime);
    const hasOverlap = await this.hasOverlappingAppointment(
      startDate,
      service.duration,
    );

    if (hasOverlap) {
      throw new BadRequestException(
        'El horario seleccionado no está disponible',
      );
    }

    // Si todo es correcto, se crea la cita
    const appointment = this.appointmentsRepository.create({
      startDateTime: appointmentData.startDateTime,
      duration: service.duration,
      client,
      service,
    });

    return this.appointmentsRepository.save(appointment);
  }

  // Verifica si hay citas que se solapan en el mismo día
  private async hasOverlappingAppointment(
    startDate: Date,
    duration: number,
  ): Promise<boolean> {
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + duration);

    const dayStart = new Date(startDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(startDate);
    dayEnd.setHours(23, 59, 59, 999);

    const appointmentsSameDay = await this.appointmentsRepository.find({
      where: {
        startDateTime: Between(dayStart, dayEnd),
        status: AppointmentStatus.SCHEDULED,
      },
    });

    return appointmentsSameDay.some((appointment) => {
      const existingStart = new Date(appointment.startDateTime);

      const existingEnd = new Date(existingStart);
      existingEnd.setMinutes(existingEnd.getMinutes() + appointment.duration);

      return existingStart < endDate && existingEnd > startDate;
    });
  }

  // Cancela una cita existente
  async cancel(id: number) {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('No se ha encontrado la cita');
    }

    appointment.status = AppointmentStatus.CANCELLED;

    return this.appointmentsRepository.save(appointment);
  }

  // Marca una cita como completada
  async complete(id: number) {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
    });

    if (!appointment)
      throw new NotFoundException('No se ha encontrado la cita');

    appointment.status = AppointmentStatus.DONE;

    return this.appointmentsRepository.save(appointment);
  }
}
