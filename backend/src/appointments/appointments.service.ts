import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  In,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { Appointment } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Center } from '../centers/center.entity';
import { Client } from '../clients/client.entity';
import { ServiceEntity } from '../services/service.entity';
import { Specialist, SpecialistStatus } from '../specialists/specialist.entity';
import { AppointmentStatus } from './appointment.entity';
import {
  AvailabilityException,
  AvailabilityExceptionType,
} from '../availability/availability-exception.entity';
import { Availability } from '../availability/availability.entity';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import {
  AuthUser,
  CenterAccessService,
} from '../centers/center-access.service';
import {
  assertAppointmentCanBeCompleted,
  assertAppointmentStatusTransition,
} from './appointment-status';

@Injectable()
export class AppointmentsService implements OnModuleInit {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,

    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,

    @InjectRepository(ServiceEntity)
    private servicesRepository: Repository<ServiceEntity>,

    @InjectRepository(Specialist)
    private specialistsRepository: Repository<Specialist>,

    @InjectRepository(Availability)
    private availabilityRepository: Repository<Availability>,

    @InjectRepository(AvailabilityException)
    private availabilityExceptionRepository: Repository<AvailabilityException>,

    private readonly centerAccessService: CenterAccessService,
  ) {}

  private readonly SLOT_STEP_MINUTES = 15;

  async onModuleInit() {
    await this.ensureOverlapConstraints();
  }

  async findAll(authUser?: AuthUser, date?: string, centerId?: number) {
    await this.completePastScheduledAppointments();

    const centerIds = await this.getAllowedCenterIds(authUser, centerId);

    if (centerIds?.length === 0) return [];

    return this.appointmentsRepository.find({
      where: this.getFindAllWhere(date, centerIds),
      order: {
        startDateTime: 'ASC',
      },
    });
  }

  async findAllForClient(clientId: number) {
    await this.completePastScheduledAppointments();

    return this.appointmentsRepository.find({
      where: {
        client: {
          id: clientId,
        },
      },
      order: {
        startDateTime: 'ASC',
      },
    });
  }

  async findAvailableSlots(
    date: string,
    serviceId: number,
    specialistId: number,
    authUser?: AuthUser,
  ) {
    await this.completePastScheduledAppointments();

    const service = await this.getActiveService(serviceId);
    const centerId = this.getServiceCenterId(service);
    const specialist = await this.getActiveSpecialist(specialistId);
    this.validateSpecialistCenter(specialist, centerId);
    this.validateServiceSpecialist(service, specialist);

    await this.centerAccessService.validateCenterAccess(centerId, authUser);

    const targetDate = this.buildDateFromDateQuery(date);
    const dayOfWeek = targetDate.getDay();

    const availabilities = await this.availabilityRepository.find({
      where: {
        dayOfWeek,
        center: {
          id: centerId,
        },
      },
      order: {
        startTime: 'ASC',
      },
    });
    const exceptions = await this.findExceptionsForDate(
      this.toDateQuery(targetDate),
      centerId,
    );
    const availableRanges = [
      ...availabilities,
      ...exceptions.filter(
        (exception) =>
          exception.type === AvailabilityExceptionType.EXTRA_AVAILABLE,
      ),
    ];

    if (availableRanges.length === 0) return [];

    const slots = new Set<string>();

    for (const availability of availableRanges) {
      const availabilityStart = this.buildDateWithTime(
        targetDate,
        availability.startTime,
      );

      const availabilityEnd = this.buildDateWithTime(
        targetDate,
        availability.endTime,
      );

      const currentSlot = new Date(availabilityStart);

      while (currentSlot < availabilityEnd) {
        const slotEnd = new Date(currentSlot);
        slotEnd.setMinutes(slotEnd.getMinutes() + service.durationMinutes);

        if (slotEnd <= availabilityEnd) {
          const hasBlockedTime = this.hasOverlappingBlockedException(
            exceptions,
            currentSlot,
            service.durationMinutes,
          );
          const hasOverlap = await this.hasOverlappingAppointment(
            currentSlot,
            service.durationMinutes,
            centerId,
            specialist.id,
          );

          if (!hasBlockedTime && !hasOverlap) {
            slots.add(currentSlot.toTimeString().slice(0, 5));
          }
        }

        currentSlot.setMinutes(
          currentSlot.getMinutes() + this.SLOT_STEP_MINUTES,
        );
      }
    }

    return [...slots].sort();
  }

  async create(appointmentData: CreateAppointmentDto, authUser?: AuthUser) {
    await this.completePastScheduledAppointments();

    const client = await this.getActiveClient(appointmentData.clientId);
    const service = await this.getActiveService(appointmentData.serviceId);
    const specialist = await this.getActiveSpecialist(
      appointmentData.specialistId,
    );
    const startDate = new Date(appointmentData.startDateTime);
    this.assertStartDateNotInPast(startDate);
    const center = this.validateAppointmentCenter(client, service, specialist);
    this.validateServiceSpecialist(service, specialist);

    await this.centerAccessService.validateCenterAccess(center.id, authUser);

    const outsideAvailability = await this.validateAppointmentSlot(
      startDate,
      service.durationMinutes,
      center.id,
      specialist.id,
      client.id,
      undefined,
      appointmentData.allowOutsideAvailability,
    );

    const appointment = this.appointmentsRepository.create({
      startDateTime: startDate,
      duration: service.durationMinutes,
      outsideAvailability,
      client,
      service,
      center,
      specialist,
    });

    return this.persistAppointment(appointment);
  }

  async update(
    id: number,
    appointmentData: UpdateAppointmentDto,
    authUser?: AuthUser,
  ) {
    const appointment = await this.findAppointment(id, authUser);

    const client = await this.resolveClientForUpdate(
      appointment,
      appointmentData.clientId,
    );

    const service = await this.resolveServiceForUpdate(
      appointment,
      appointmentData.serviceId,
    );

    const specialist = await this.resolveSpecialistForUpdate(
      appointment,
      appointmentData.specialistId,
    );

    const startDate = appointmentData.startDateTime
      ? new Date(appointmentData.startDateTime)
      : new Date(appointment.startDateTime);
    const center = this.validateAppointmentCenter(client, service, specialist);
    this.validateServiceSpecialist(service, specialist);
    const status = appointmentData.status ?? appointment.status;

    assertAppointmentStatusTransition(appointment.status, status);

    if (status === AppointmentStatus.COMPLETED)
      assertAppointmentCanBeCompleted(startDate);

    if (
      status === AppointmentStatus.SCHEDULED &&
      appointmentData.startDateTime !== undefined
    )
      this.assertStartDateNotInPast(startDate);

    await this.centerAccessService.validateCenterAccess(center.id, authUser);

    const outsideAvailability =
      status === AppointmentStatus.SCHEDULED
        ? await this.validateAppointmentSlot(
            startDate,
            service.durationMinutes,
            center.id,
            specialist.id,
            client.id,
            appointment.id,
            appointmentData.allowOutsideAvailability ??
              appointment.outsideAvailability,
          )
        : appointment.outsideAvailability;

    appointment.startDateTime = startDate;
    appointment.duration = service.durationMinutes;
    appointment.outsideAvailability = outsideAvailability;
    appointment.client = client;
    appointment.service = service;
    appointment.center = center;
    appointment.specialist = specialist;
    appointment.status = status;

    return this.persistAppointment(appointment);
  }

  async remove(id: number, authUser?: AuthUser) {
    const appointment = await this.findAppointment(id, authUser);
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

  private async getActiveSpecialist(id: number): Promise<Specialist> {
    const specialist = await this.specialistsRepository.findOne({
      where: { id },
    });

    if (!specialist)
      throw new NotFoundException('No se ha encontrado el especialista');

    if (!this.isSpecialistSchedulable(specialist))
      throw new BadRequestException(
        'No se pueden crear citas con un especialista no disponible',
      );

    return specialist;
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

  private async resolveSpecialistForUpdate(
    appointment: Appointment,
    specialistId?: number,
  ): Promise<Specialist> {
    if (!specialistId || specialistId === appointment.specialist?.id) {
      if (!appointment.specialist)
        throw new BadRequestException(
          'La cita debe tener un especialista asignado',
        );

      return appointment.specialist;
    }

    return this.getActiveSpecialist(specialistId);
  }

  private validateAppointmentCenter(
    client: Client,
    service: ServiceEntity,
    specialist: Specialist,
  ): Center {
    if (!client.center?.id || !service.center?.id)
      throw new BadRequestException(
        'El cliente y el servicio deben tener un centro asignado',
      );

    if (client.center.id !== service.center.id)
      throw new BadRequestException(
        'El cliente y el servicio deben pertenecer al mismo centro',
      );

    this.validateSpecialistCenter(specialist, service.center.id);

    return service.center;
  }

  private validateSpecialistCenter(specialist: Specialist, centerId: number) {
    if (!specialist.center?.id)
      throw new BadRequestException(
        'El especialista debe tener un centro asignado',
      );

    if (specialist.center.id !== centerId)
      throw new BadRequestException(
        'El especialista debe pertenecer al mismo centro que la cita',
      );
  }

  private validateServiceSpecialist(
    service: ServiceEntity,
    specialist: Specialist,
  ): void {
    if (!service.specialist?.id) return;

    if (service.specialist.id !== specialist.id)
      throw new BadRequestException(
        'El servicio seleccionado no lo ofrece ese especialista',
      );
  }

  private isSpecialistSchedulable(specialist: Specialist): boolean {
    return specialist.active && specialist.status === SpecialistStatus.ACTIVE;
  }

  private async findAppointment(
    id: number,
    authUser?: AuthUser,
  ): Promise<Appointment> {
    await this.completePastScheduledAppointments();

    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
    });

    if (!appointment)
      throw new NotFoundException('No se ha encontrado la cita');

    await this.centerAccessService.validateCenterAccess(
      this.getAppointmentCenterId(appointment),
      authUser,
    );

    return appointment;
  }

  private async findScheduledAppointment(
    id: number,
    invalidStatusMessage: string,
    authUser?: AuthUser,
  ): Promise<Appointment> {
    const appointment = await this.findAppointment(id, authUser);

    if (appointment.status !== AppointmentStatus.SCHEDULED)
      throw new BadRequestException(invalidStatusMessage);

    return appointment;
  }

  // Crea (de forma idempotente) las restricciones de exclusión que impiden a
  // nivel de base de datos que dos citas programadas se solapen para un mismo
  // especialista o para un mismo cliente. Es la garantía definitiva frente a la
  // doble reserva por condiciones de carrera: aunque dos peticiones concurrentes
  // superen la comprobación previa en memoria, PostgreSQL rechaza la segunda.
  private async ensureOverlapConstraints(): Promise<void> {
    try {
      await this.appointmentsRepository.query(
        'CREATE EXTENSION IF NOT EXISTS btree_gist',
      );
      await this.appointmentsRepository.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'appointment_no_overlap_specialist'
          ) THEN
            ALTER TABLE "appointment"
              ADD CONSTRAINT "appointment_no_overlap_specialist"
              EXCLUDE USING gist (
                "specialistId" WITH =,
                tsrange(
                  "startDateTime",
                  "startDateTime" + ("duration" * interval '1 minute')
                ) WITH &&
              )
              WHERE (status = 'SCHEDULED');
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'appointment_no_overlap_client'
          ) THEN
            ALTER TABLE "appointment"
              ADD CONSTRAINT "appointment_no_overlap_client"
              EXCLUDE USING gist (
                "clientId" WITH =,
                tsrange(
                  "startDateTime",
                  "startDateTime" + ("duration" * interval '1 minute')
                ) WITH &&
              )
              WHERE (status = 'SCHEDULED');
          END IF;
        END $$;
      `);
    } catch (error) {
      this.logger.error(
        'No se pudieron crear las restricciones de exclusión de solape de citas',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  // Guarda la cita traduciendo la violación de exclusión de PostgreSQL (código
  // 23P01) en un conflicto legible para quien perdió la carrera por el hueco.
  private async persistAppointment(
    appointment: Appointment,
  ): Promise<Appointment> {
    try {
      return await this.appointmentsRepository.save(appointment);
    } catch (error) {
      if (this.isOverlapViolation(error))
        throw new ConflictException(
          'El horario seleccionado ya no está disponible',
        );

      throw error;
    }
  }

  private isOverlapViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) return false;

    const code =
      (error as QueryFailedError & { code?: string }).code ??
      (error.driverError as { code?: string } | undefined)?.code;

    return code === '23P01';
  }

  private assertStartDateNotInPast(startDate: Date): void {
    if (startDate.getTime() < Date.now())
      throw new BadRequestException(
        'La fecha de la cita no puede estar en el pasado',
      );
  }

  private async validateAppointmentSlot(
    startDate: Date,
    duration: number,
    centerId: number,
    specialistId: number,
    clientId: number,
    appointmentIdToExclude?: number,
    allowOutsideAvailability = false,
  ): Promise<boolean> {
    const isAvailable = await this.isInsideAvailability(
      startDate,
      duration,
      centerId,
    );

    if (!isAvailable && !allowOutsideAvailability)
      throw new BadRequestException(
        'La cita está fuera del horario disponible',
      );

    const hasOverlap = await this.hasOverlappingAppointment(
      startDate,
      duration,
      centerId,
      specialistId,
      appointmentIdToExclude,
    );

    if (hasOverlap)
      throw new BadRequestException(
        'El horario seleccionado no está disponible',
      );

    const hasClientOverlap = await this.hasOverlappingClientAppointment(
      startDate,
      duration,
      clientId,
      appointmentIdToExclude,
    );

    if (hasClientOverlap)
      throw new BadRequestException(
        'El cliente ya tiene una cita en ese horario',
      );

    return !isAvailable;
  }

  private async hasOverlappingAppointment(
    startDate: Date,
    duration: number,
    centerId: number,
    specialistId: number,
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
        center: {
          id: centerId,
        },
        specialist: {
          id: specialistId,
        },
      },
    });

    return appointmentsSameDay.some((appointment) => {
      if (appointment.id === appointmentIdToExclude) return false;

      const existingStart = new Date(appointment.startDateTime);
      const existingEnd = new Date(existingStart);

      existingEnd.setMinutes(existingEnd.getMinutes() + appointment.duration);

      return existingStart < endDate && existingEnd > startDate;
    });
  }

  private async hasOverlappingClientAppointment(
    startDate: Date,
    duration: number,
    clientId: number,
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
        client: {
          id: clientId,
        },
      },
    });

    return appointmentsSameDay.some((appointment) => {
      if (appointment.id === appointmentIdToExclude) return false;

      const existingStart = new Date(appointment.startDateTime);
      const existingEnd = new Date(existingStart);

      existingEnd.setMinutes(existingEnd.getMinutes() + appointment.duration);

      return existingStart < endDate && existingEnd > startDate;
    });
  }

  private async isInsideAvailability(
    startDate: Date,
    duration: number,
    centerId: number,
  ): Promise<boolean> {
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + duration);

    const dayOfWeek = startDate.getDay();
    const exceptions = await this.findExceptionsForDate(
      this.toDateQuery(startDate),
      centerId,
    );

    const availabilities = await this.availabilityRepository.find({
      where: {
        dayOfWeek,
        center: {
          id: centerId,
        },
      },
    });
    const availableRanges = [
      ...availabilities,
      ...exceptions.filter(
        (exception) =>
          exception.type === AvailabilityExceptionType.EXTRA_AVAILABLE,
      ),
    ];

    const startTime = startDate.toTimeString().slice(0, 5);
    const endTime = endDate.toTimeString().slice(0, 5);
    const hasBlockedTime = this.hasOverlappingBlockedException(
      exceptions,
      startDate,
      duration,
    );

    if (hasBlockedTime) return false;

    return availableRanges.some((availability) => {
      return (
        startTime >= availability.startTime && endTime <= availability.endTime
      );
    });
  }

  private async findExceptionsForDate(date: string, centerId: number) {
    return this.availabilityExceptionRepository.find({
      where: {
        date,
        center: {
          id: centerId,
        },
      },
      order: {
        startTime: 'ASC',
      },
    });
  }

  private hasOverlappingBlockedException(
    exceptions: AvailabilityException[],
    startDate: Date,
    duration: number,
  ): boolean {
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + duration);

    const startTime = startDate.toTimeString().slice(0, 5);
    const endTime = endDate.toTimeString().slice(0, 5);

    return exceptions.some((exception) => {
      if (exception.type !== AvailabilityExceptionType.BLOCKED) return false;

      return exception.startTime < endTime && exception.endTime > startTime;
    });
  }

  private toDateQuery(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private buildDateWithTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);

    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);

    return result;
  }

  private buildDateFromDateQuery(date: string): Date {
    const [year, month, day] = date.split('-').map(Number);

    return new Date(year, month - 1, day);
  }

  private getFindAllWhere(
    date?: string,
    centerIds?: number[],
  ): FindOptionsWhere<Appointment> {
    const where: FindOptionsWhere<Appointment> = {};

    if (date) {
      const startOfDay = this.buildDateFromDateQuery(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = this.buildDateFromDateQuery(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.startDateTime = Between(startOfDay, endOfDay);
    }

    if (centerIds?.length) {
      where.center = {
        id: In(centerIds),
      };
    }

    return where;
  }

  private async getAllowedCenterIds(
    authUser?: AuthUser,
    centerId?: number,
  ): Promise<number[] | undefined> {
    return this.centerAccessService.getAllowedCenterIds(authUser, centerId);
  }

  private getServiceCenterId(service: ServiceEntity): number {
    if (!service.center?.id)
      throw new BadRequestException(
        'El servicio debe tener un centro asignado',
      );

    return service.center.id;
  }

  private getAppointmentCenterId(appointment: Appointment): number {
    if (!appointment.center?.id) {
      throw new BadRequestException('La cita debe tener un centro asignado');
    }

    return appointment.center.id;
  }

  private getAppointmentSpecialistId(appointment: Appointment): number {
    if (!appointment.specialist?.id)
      throw new BadRequestException(
        'La cita debe tener un especialista asignado',
      );

    return appointment.specialist.id;
  }

  private async completePastScheduledAppointments(): Promise<void> {
    await this.appointmentsRepository
      .createQueryBuilder()
      .update(Appointment)
      .set({
        status: AppointmentStatus.COMPLETED,
      })
      .where('"status" = :status', {
        status: AppointmentStatus.SCHEDULED,
      })
      .andWhere(
        `"startDateTime" + ("duration" * INTERVAL '1 minute') <= CURRENT_TIMESTAMP`,
      )
      .execute();
  }

  async cancel(id: number, authUser?: AuthUser) {
    const appointment = await this.findScheduledAppointment(
      id,
      'Solo se pueden cancelar citas programadas',
      authUser,
    );

    appointment.status = AppointmentStatus.CANCELLED;

    return this.appointmentsRepository.save(appointment);
  }

  async complete(id: number, authUser?: AuthUser) {
    const appointment = await this.findScheduledAppointment(
      id,
      'Solo se pueden completar citas programadas',
      authUser,
    );

    assertAppointmentCanBeCompleted(appointment.startDateTime);

    appointment.status = AppointmentStatus.COMPLETED;

    return this.appointmentsRepository.save(appointment);
  }

  async reschedule(
    id: number,
    appointmentData: RescheduleAppointmentDto,
    authUser?: AuthUser,
  ) {
    const appointment = await this.findScheduledAppointment(
      id,
      'Solo se pueden reprogramar citas programadas',
      authUser,
    );

    if (!appointment.service.active)
      throw new BadRequestException(
        'No se pueden reprogramar citas con un servicio inactivo',
      );

    const startDate = new Date(appointmentData.startDateTime);
    this.assertStartDateNotInPast(startDate);

    const outsideAvailability = await this.validateAppointmentSlot(
      startDate,
      appointment.duration,
      this.getAppointmentCenterId(appointment),
      this.getAppointmentSpecialistId(appointment),
      appointment.client.id,
      appointment.id,
      appointmentData.allowOutsideAvailability ??
        appointment.outsideAvailability,
    );

    appointment.startDateTime = startDate;
    appointment.outsideAvailability = outsideAvailability;

    return this.persistAppointment(appointment);
  }
}
