import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Client } from '../clients/client.entity';
import { ServiceEntity } from '../services/service.entity';
import { Between } from 'typeorm';
import { AppointmentStatus } from './appointment.entity';
import { Availability } from '../availability/availability.entity';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';


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

    @InjectRepository(Availability)
    private availabilityRepository: Repository<Availability>,
  ) {}

  private readonly SLOT_STEP_MINUTES = 15;

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

  // Obtiene los horarios disponibles para un servicio en una fecha determinada
  async findAvailableSlots(date: string, serviceId: number) {
    const service = await this.servicesRepository.findOne({
      where: { id: serviceId },
    });

    if (!service)
      throw new NotFoundException('No se ha encontrado el servicio');

    // Verifica que el servicio esté activo antes de mostrar los horarios disponibles
    if (!service.active)
      throw new BadRequestException(
        'No se pueden crear citas con un servicio inactivo',
      );

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    const availabilities = await this.availabilityRepository.find({
      where: { dayOfWeek },
      order: {
        startTime: 'ASC',
      },
    });

    if (availabilities.length === 0) return [];

    const slots: string[] = [];

    // Para cada franja de disponibilidad, se generan los posibles horarios de cita
    for (const availability of availabilities) {
      const availabilityStart = this.buildDateWithTime(
        targetDate,
        availability.startTime,
      );

      const availabilityEnd = this.buildDateWithTime(
        targetDate,
        availability.endTime,
      );

      const currentSlot = new Date(availabilityStart);

      // Se generan los horarios disponibles en intervalos de 15 minutos
      while (currentSlot < availabilityEnd) {
        const slotEnd = new Date(currentSlot);
        slotEnd.setMinutes(slotEnd.getMinutes() + service.duration);

        if (slotEnd <= availabilityEnd) {
          const hasOverlap = await this.hasOverlappingAppointment(
            currentSlot,
            service.duration,
          );

          if (!hasOverlap) slots.push(currentSlot.toTimeString().slice(0, 5));
        }

        currentSlot.setMinutes(
          currentSlot.getMinutes() + this.SLOT_STEP_MINUTES,
        );
      }
    }

    return slots;
  }

  // Crea una nueva cita
  async create(appointmentData: CreateAppointmentDto) {
    const client = await this.clientsRepository.findOne({
      where: { id: appointmentData.clientId },
    });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (!client.active)
      throw new BadRequestException(
        'No se pueden crear citas para un cliente inactivo',
      );

    const service = await this.servicesRepository.findOne({
      where: { id: appointmentData.serviceId },
    });

    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    // Verifica que el servicio esté activo antes de crear la cita
    if (!service.active)
      throw new BadRequestException(
        'No se pueden crear citas con un servicio inactivo',
      );

    const startDate = new Date(appointmentData.startDateTime);
    const isAvailable = await this.isInsideAvailability(
      startDate,
      service.duration,
    );

    // Verifica si el horario de la cita está dentro de la disponibilidad
    if (!isAvailable)
      throw new BadRequestException(
        'La cita está fuera del horario disponible',
      );

    // Verifica si hay citas que se solapan en el mismo día
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
    appointmentIdToExclude?: number,
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
      // Si se proporciona un ID de cita para excluir, se omite esa cita en la verificación
      if (appointment.id === appointmentIdToExclude) return false;

      const existingStart = new Date(appointment.startDateTime);
      const existingEnd = new Date(existingStart);

      existingEnd.setMinutes(existingEnd.getMinutes() + appointment.duration);

      return existingStart < endDate && existingEnd > startDate;
    });
  }

  // Verifica si el horario de la cita está dentro de la disponibilidad
  private async isInsideAvailability(
    startDate: Date,
    duration: number,
  ): Promise<boolean> {
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + duration);

    const dayOfWeek = startDate.getDay();

    const availabilities = await this.availabilityRepository.find({
      where: { dayOfWeek },
    });

    const startTime = startDate.toTimeString().slice(0, 5);
    const endTime = endDate.toTimeString().slice(0, 5);

    return availabilities.some((availability) => {
      return (
        startTime >= availability.startTime && endTime <= availability.endTime
      );
    });
  }

  // Construye un objeto Date combinando la fecha y la hora
  private buildDateWithTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);

    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);

    return result;
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

  // Reprograma una cita existente
  async reschedule(id: number, appointmentData: RescheduleAppointmentDto) {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
    });

    if (!appointment)
      throw new NotFoundException('No se ha encontrado la cita');

    if (!appointment.service.active)
      throw new BadRequestException(
        'No se pueden reprogramar citas con un servicio inactivo',
      );

    if (appointment.status !== AppointmentStatus.SCHEDULED)
      throw new BadRequestException(
        'Solo se pueden reprogramar citas pendientes',
      );

    const startDate = new Date(appointmentData.startDateTime);

    const isAvailable = await this.isInsideAvailability(
      startDate,
      appointment.duration,
    );

    if (!isAvailable)
      throw new BadRequestException(
        'La cita está fuera del horario disponible',
      );

    const hasOverlap = await this.hasOverlappingAppointment(
      startDate,
      appointment.duration,
      appointment.id,
    );

    if (hasOverlap)
      throw new BadRequestException(
        'El horario seleccionado no está disponible',
      );

    appointment.startDateTime = startDate;

    return this.appointmentsRepository.save(appointment);
  }
}
