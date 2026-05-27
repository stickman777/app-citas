import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Client } from '../clients/client.entity';
import { ServiceEntity } from '../services/service.entity';
import { AppointmentStatus } from './appointment.entity';
import { Availability } from '../availability/availability.entity';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

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
  async findAll(date?: string, centerId?: number) {
    return this.appointmentsRepository.find({
      where: this.getFindAllWhere(date, centerId),
      order: {
        startDateTime: 'ASC',
      },
    });
  }

  // Obtiene los horarios disponibles para un servicio en una fecha determinada
  async findAvailableSlots(date: string, serviceId: number) {
    const service = await this.getActiveService(serviceId);

    const targetDate = this.buildDateFromDateQuery(date);
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
        slotEnd.setMinutes(slotEnd.getMinutes() + service.durationMinutes);

        if (slotEnd <= availabilityEnd) {
          const hasOverlap = await this.hasOverlappingAppointment(
            currentSlot,
            service.durationMinutes,
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
    const client = await this.getActiveClient(appointmentData.clientId);
    const service = await this.getActiveService(appointmentData.serviceId);
    const startDate = new Date(appointmentData.startDateTime);

    this.validateAppointmentCenter(client, service);
    await this.validateAppointmentSlot(startDate, service.durationMinutes);

    // Si todo es correcto, se crea la cita
    const appointment = this.appointmentsRepository.create({
      startDateTime: startDate,
      duration: service.durationMinutes,
      client,
      service,
    });

    return this.appointmentsRepository.save(appointment);
  }

  // Actualiza una cita existente
  async update(id: number, appointmentData: UpdateAppointmentDto) {
    const appointment = await this.findScheduledAppointment(
      id,
      'Solo se pueden actualizar citas programadas',
    );

    const client = await this.resolveClientForUpdate(
      appointment,
      appointmentData.clientId,
    );

    const service = await this.resolveServiceForUpdate(
      appointment,
      appointmentData.serviceId,
    );

    const startDate = appointmentData.startDateTime
      ? new Date(appointmentData.startDateTime)
      : new Date(appointment.startDateTime);

    this.validateAppointmentCenter(client, service);
    await this.validateAppointmentSlot(
      startDate,
      service.durationMinutes,
      appointment.id,
    );

    appointment.startDateTime = startDate;
    appointment.duration = service.durationMinutes;
    appointment.client = client;
    appointment.service = service;

    return this.appointmentsRepository.save(appointment);
  }

  // Elimina una cita existente
  async remove(id: number) {
    const appointment = await this.findAppointment(id);
    const appointmentToReturn = { ...appointment };

    await this.appointmentsRepository.remove(appointment);

    return appointmentToReturn;
  }

  private async getActiveClient(id: number): Promise<Client> {
    const client = await this.clientsRepository.findOne({
      where: { id },
    });

    if (!client) throw new NotFoundException('Cliente no encontrado');

    if (!client.active)
      throw new BadRequestException(
        'No se pueden crear citas para un cliente inactivo',
      );

    return client;
  }

  private async getActiveService(id: number): Promise<ServiceEntity> {
    const service = await this.servicesRepository.findOne({
      where: { id },
    });

    if (!service)
      throw new NotFoundException('No se ha encontrado el servicio');

    if (!service.active)
      throw new BadRequestException(
        'No se pueden crear citas con un servicio inactivo',
      );

    return service;
  }

  private async resolveClientForUpdate(
    appointment: Appointment,
    clientId?: number,
  ): Promise<Client> {
    if (!clientId || clientId === appointment.client.id)
      return appointment.client;

    return this.getActiveClient(clientId);
  }

  private async resolveServiceForUpdate(
    appointment: Appointment,
    serviceId?: number,
  ): Promise<ServiceEntity> {
    if (!serviceId || serviceId === appointment.service.id)
      return appointment.service;

    return this.getActiveService(serviceId);
  }

  private validateAppointmentCenter(
    client: Client,
    service: ServiceEntity,
  ): void {
    if (!client.center?.id || !service.center?.id)
      throw new BadRequestException(
        'El cliente y el servicio deben tener un centro asignado',
      );

    if (client.center.id !== service.center.id)
      throw new BadRequestException(
        'El cliente y el servicio deben pertenecer al mismo centro',
      );
  }

  private async findAppointment(id: number): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
    });

    if (!appointment)
      throw new NotFoundException('No se ha encontrado la cita');

    return appointment;
  }

  private async findScheduledAppointment(
    id: number,
    invalidStatusMessage: string,
  ): Promise<Appointment> {
    const appointment = await this.findAppointment(id);

    if (appointment.status !== AppointmentStatus.SCHEDULED)
      throw new BadRequestException(invalidStatusMessage);

    return appointment;
  }

  private async validateAppointmentSlot(
    startDate: Date,
    duration: number,
    appointmentIdToExclude?: number,
  ): Promise<void> {
    const isAvailable = await this.isInsideAvailability(startDate, duration);

    if (!isAvailable)
      throw new BadRequestException(
        'La cita está fuera del horario disponible',
      );

    const hasOverlap = await this.hasOverlappingAppointment(
      startDate,
      duration,
      appointmentIdToExclude,
    );

    if (hasOverlap)
      throw new BadRequestException(
        'El horario seleccionado no está disponible',
      );
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

  // Construye un objeto Date combinando fecha y hora
  private buildDateWithTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);

    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);

    return result;
  }

  // Construye un objeto Date a partir de una cadena con formato YYYY-MM-DD
  private buildDateFromDateQuery(date: string): Date {
    const [year, month, day] = date.split('-').map(Number);

    return new Date(year, month - 1, day);
  }

  private getFindAllWhere(
    date?: string,
    centerId?: number,
  ): FindOptionsWhere<Appointment> {
    const where: FindOptionsWhere<Appointment> = {};

    if (date) {
      const startOfDay = this.buildDateFromDateQuery(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = this.buildDateFromDateQuery(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.startDateTime = Between(startOfDay, endOfDay);
    }

    if (centerId) {
      where.service = {
        center: {
          id: centerId,
        },
      };
    }

    return where;
  }

  // Cancela una cita existente
  async cancel(id: number) {
    const appointment = await this.findScheduledAppointment(
      id,
      'Solo se pueden cancelar citas programadas',
    );

    appointment.status = AppointmentStatus.CANCELLED;

    return this.appointmentsRepository.save(appointment);
  }

  // Marca una cita como completada
  async complete(id: number) {
    const appointment = await this.findScheduledAppointment(
      id,
      'Solo se pueden completar citas programadas',
    );

    appointment.status = AppointmentStatus.COMPLETED;

    return this.appointmentsRepository.save(appointment);
  }

  // Reprograma una cita existente
  async reschedule(id: number, appointmentData: RescheduleAppointmentDto) {
    const appointment = await this.findScheduledAppointment(
      id,
      'Solo se pueden reprogramar citas programadas',
    );

    if (!appointment.service.active)
      throw new BadRequestException(
        'No se pueden reprogramar citas con un servicio inactivo',
      );

    const startDate = new Date(appointmentData.startDateTime);

    await this.validateAppointmentSlot(
      startDate,
      appointment.duration,
      appointment.id,
    );

    appointment.startDateTime = startDate;

    return this.appointmentsRepository.save(appointment);
  }
}
