import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AppointmentsService } from '../appointments/appointments.service';
import {
  AuthUser,
  CenterAccessService,
} from '../centers/center-access.service';
import { Client } from '../clients/client.entity';
import {
  AppointmentRequest,
  AppointmentRequestStatus,
} from './appointment-request.entity';
import { CreateAppointmentRequestDto } from './dto/create-appointment-request.dto';
import {
  AppointmentRequestAction,
  ResolveAppointmentRequestDto,
} from './dto/resolve-appointment-request.dto';

@Injectable()
export class AppointmentRequestsService {
  constructor(
    @InjectRepository(AppointmentRequest)
    private readonly requestsRepository: Repository<AppointmentRequest>,

    private readonly appointmentsService: AppointmentsService,
    private readonly centerAccessService: CenterAccessService,
  ) {}

  // Crea una solicitud para el cliente autenticado. Se asume que la combinación
  // servicio/especialista/centro ya ha sido validada por el portal de cliente.
  async createForClient(client: Client, dto: CreateAppointmentRequestDto) {
    if (!client.center?.id)
      throw new BadRequestException(
        'Tu ficha de cliente no tiene centro asignado',
      );

    const startDate = new Date(dto.startDateTime);

    if (startDate.getTime() < Date.now())
      throw new BadRequestException(
        'La fecha de la cita no puede estar en el pasado',
      );

    const {
      insideAvailability,
      hasSpecialistOverlap,
      hasClientOverlap,
      specialistAbsent,
    } = await this.appointmentsService.describeRequestedSlot(
      dto.serviceId,
      dto.specialistId,
      startDate,
      client.id,
    );

    if (specialistAbsent)
      throw new BadRequestException(
        'El especialista no está disponible en esas fechas',
      );

    if (hasClientOverlap)
      throw new BadRequestException('Ya tienes una cita en ese horario');

    if (insideAvailability && !hasSpecialistOverlap)
      throw new BadRequestException(
        'Ese horario está disponible; resérvalo directamente',
      );

    const request = this.requestsRepository.create({
      client: { id: client.id },
      service: { id: dto.serviceId },
      specialist: { id: dto.specialistId },
      center: { id: client.center.id },
      requestedStartDateTime: startDate,
      outsideAvailability: !insideAvailability,
      notes: dto.notes?.trim() || null,
    });

    const savedRequest = await this.requestsRepository.save(request);

    return this.toResponse(
      await this.findRequestEntity(savedRequest.id),
    );
  }

  async findPending(authUser?: AuthUser, centerId?: number) {
    const centerIds = await this.getAllowedCenterIds(authUser, centerId);

    if (centerIds.length === 0) return [];

    const requests = await this.requestsRepository.find({
      where: {
        status: AppointmentRequestStatus.PENDING,
        center: {
          id: In(centerIds),
        },
      },
      order: {
        createdAt: 'ASC',
      },
    });

    return requests.map((request) => this.toResponse(request));
  }

  async findForClient(clientId: number) {
    const requests = await this.requestsRepository.find({
      where: {
        client: {
          id: clientId,
        },
      },
      order: {
        requestedStartDateTime: 'DESC',
      },
    });

    return requests.map((request) => this.toResponse(request));
  }

  async cancelForClient(clientId: number, requestId: number) {
    const request = await this.requestsRepository.findOne({
      where: {
        id: requestId,
        client: {
          id: clientId,
        },
      },
    });

    if (!request)
      throw new NotFoundException('No se ha encontrado la solicitud de cita');

    if (request.status !== AppointmentRequestStatus.PENDING)
      throw new BadRequestException('Solo se pueden cancelar solicitudes pendientes');

    request.status = AppointmentRequestStatus.REJECTED;
    request.resolvedAt = new Date();
    request.resolutionNote = null;

    await this.requestsRepository.save(request);

    return this.toResponse(request);
  }

  async resolve(
    id: number,
    dto: ResolveAppointmentRequestDto,
    authUser?: AuthUser,
  ) {
    const request = await this.findRequestEntity(id);

    await this.centerAccessService.validateCenterAccess(
      request.center.id,
      authUser,
    );

    if (request.status !== AppointmentRequestStatus.PENDING)
      throw new BadRequestException('La solicitud ya ha sido resuelta');

    if (dto.action === AppointmentRequestAction.REJECT)
      return this.reject(request, dto.resolutionNote);

    return this.approve(request, dto.resolutionNote, authUser);
  }

  private async approve(
    request: AppointmentRequest,
    resolutionNote: string | undefined,
    authUser?: AuthUser,
  ) {
    // Reutiliza el flujo de creación de cita (permitiendo fuera de horario). Si
    // el hueco sigue ocupado, la restricción de exclusión lanza un conflicto y
    // el gestor deberá mover antes la cita existente.
    const appointment = await this.appointmentsService.create(
      {
        clientId: request.client.id,
        serviceId: request.service.id,
        specialistId: request.specialist.id,
        startDateTime: this.toLocalDateTimeString(request.requestedStartDateTime),
        allowOutsideAvailability: true,
      },
      authUser,
    );

    request.status = AppointmentRequestStatus.APPROVED;
    request.appointment = appointment;
    request.resolvedAt = new Date();
    request.resolutionNote = resolutionNote?.trim() || null;

    await this.requestsRepository.save(request);

    return this.toResponse(await this.findRequestEntity(request.id));
  }

  private async reject(
    request: AppointmentRequest,
    resolutionNote: string | undefined,
  ) {
    request.status = AppointmentRequestStatus.REJECTED;
    request.resolvedAt = new Date();
    request.resolutionNote = resolutionNote?.trim() || null;

    await this.requestsRepository.save(request);

    return this.toResponse(request);
  }

  private async findRequestEntity(id: number): Promise<AppointmentRequest> {
    const request = await this.requestsRepository.findOne({
      where: { id },
      relations: {
        appointment: true,
      },
    });

    if (!request)
      throw new NotFoundException('No se ha encontrado la solicitud de cita');

    return request;
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

  private toLocalDateTimeString(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');

    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
      `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    );
  }

  private toResponse(request: AppointmentRequest) {
    return {
      id: request.id,
      requestedStartDateTime: request.requestedStartDateTime,
      outsideAvailability: request.outsideAvailability,
      notes: request.notes ?? null,
      status: request.status,
      resolutionNote: request.resolutionNote ?? null,
      resolvedAt: request.resolvedAt ?? null,
      createdAt: request.createdAt,
      appointmentId: request.appointment?.id ?? null,
      client: {
        id: request.client.id,
        name: request.client.name,
        phone: request.client.phone,
        priority: request.client.priority,
      },
      service: {
        id: request.service.id,
        name: request.service.name,
        durationMinutes: request.service.durationMinutes,
      },
      specialist: {
        id: request.specialist.id,
        name: request.specialist.name,
        specialty: request.specialist.specialty ?? null,
      },
      center: {
        id: request.center.id,
        name: request.center.name,
      },
    };
  }
}
