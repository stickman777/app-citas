import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentRequestsService } from '../appointment-requests/appointment-requests.service';
import { CreateAppointmentRequestDto } from '../appointment-requests/dto/create-appointment-request.dto';
import { Appointment } from '../appointments/appointment.entity';
import { AppointmentsService } from '../appointments/appointments.service';
import { Client } from '../clients/client.entity';
import { ClientsService } from '../clients/clients.service';
import { ServiceEntity } from '../services/service.entity';
import {
  Specialist,
  SpecialistStatus,
} from '../specialists/specialist.entity';
import { CreateClientPortalAppointmentDto } from './dto/create-client-portal-appointment.dto';
import { UpdateClientPortalProfileDto } from './dto/update-client-portal-profile.dto';

@Injectable()
export class ClientPortalService {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly appointmentsService: AppointmentsService,
    private readonly appointmentRequestsService: AppointmentRequestsService,

    @InjectRepository(ServiceEntity)
    private servicesRepository: Repository<ServiceEntity>,

    @InjectRepository(Specialist)
    private specialistsRepository: Repository<Specialist>,
  ) {}

  async getProfile(userId: number) {
    const client = await this.getActiveClientForUser(userId);

    return this.toProfileResponse(client);
  }

  async updateProfile(
    userId: number,
    profileData: UpdateClientPortalProfileDto,
  ) {
    const updatedClient = await this.clientsService.updateForUser(
      userId,
      profileData,
    );

    return this.toProfileResponse(updatedClient);
  }

  async getAppointments(userId: number) {
    const client = await this.getActiveClientForUser(userId);
    const appointments = await this.appointmentsService.findAllForClient(
      client.id,
    );

    return appointments.map((appointment) =>
      this.toAppointmentResponse(appointment),
    );
  }

  async getAppointmentRequests(userId: number) {
    const client = await this.getActiveClientForUser(userId);

    return this.appointmentRequestsService.findForClient(client.id);
  }

  async getServices(userId: number) {
    const client = await this.getActiveClientForUser(userId);
    const centerId = this.getClientCenterId(client);
    const services = await this.servicesRepository.find({
      where: {
        active: true,
        center: {
          id: centerId,
        },
      },
      order: {
        name: 'ASC',
      },
    });

    return services.map((service) => this.toServiceResponse(service));
  }

  async getSpecialists(userId: number, serviceId?: number) {
    const client = await this.getActiveClientForUser(userId);
    const centerId = this.getClientCenterId(client);

    if (serviceId) {
      const service = await this.findBookableService(serviceId, centerId);

      if (service.specialist) {
        return [this.toSpecialistResponse(service.specialist)];
      }
    }

    const specialists = await this.specialistsRepository.find({
      where: {
        status: SpecialistStatus.ACTIVE,
        center: {
          id: centerId,
        },
      },
      order: {
        name: 'ASC',
      },
    });

    return specialists.map((specialist) =>
      this.toSpecialistResponse(specialist),
    );
  }

  async getAvailableSlots(
    userId: number,
    date: string,
    serviceId: number,
    specialistId: number,
  ) {
    const client = await this.getActiveClientForUser(userId);
    await this.validateBookableSelection(client, serviceId, specialistId);

    return this.appointmentsService.findAvailableSlots(
      date,
      serviceId,
      specialistId,
    );
  }

  async createAppointment(
    userId: number,
    appointmentData: CreateClientPortalAppointmentDto,
  ) {
    const client = await this.getActiveClientForUser(userId);
    await this.validateBookableSelection(
      client,
      appointmentData.serviceId,
      appointmentData.specialistId,
    );
    const appointment = await this.appointmentsService.create({
      ...appointmentData,
      clientId: client.id,
      allowOutsideAvailability: false,
    });

    return this.toAppointmentResponse(appointment);
  }

  // Crea una solicitud de cita cuando el horario deseado no es auto-reservable
  // (fuera del horario del centro o con el hueco ocupado). El gestor la revisará.
  async createAppointmentRequest(
    userId: number,
    requestData: CreateAppointmentRequestDto,
  ) {
    const client = await this.getActiveClientForUser(userId);
    await this.validateBookableSelection(
      client,
      requestData.serviceId,
      requestData.specialistId,
    );

    return this.appointmentRequestsService.createForClient(client, requestData);
  }

  private async getActiveClientForUser(userId: number): Promise<Client> {
    const client = await this.clientsService.findForUser(userId);

    if (!client.active)
      throw new ForbiddenException('El cliente no esta activo');

    return client;
  }

  private toProfileResponse(client: Client) {
    return {
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email ?? null,
      center: client.center
        ? {
            id: client.center.id,
            name: client.center.name,
            city: client.center.city ?? null,
            logoUrl: client.center.logoUrl ?? null,
          }
        : null,
    };
  }

  private async validateBookableSelection(
    client: Client,
    serviceId: number,
    specialistId: number,
  ) {
    const centerId = this.getClientCenterId(client);
    const service = await this.findBookableService(serviceId, centerId);
    const specialist = await this.findBookableSpecialist(
      specialistId,
      centerId,
    );

    if (service.specialist?.id && service.specialist.id !== specialist.id)
      throw new BadRequestException(
        'El servicio seleccionado no lo ofrece ese especialista',
      );
  }

  private async findBookableService(id: number, centerId: number) {
    const service = await this.servicesRepository.findOne({
      where: {
        id,
        active: true,
        center: {
          id: centerId,
        },
      },
    });

    if (!service)
      throw new BadRequestException('El servicio no esta disponible');

    return service;
  }

  private async findBookableSpecialist(id: number, centerId: number) {
    const specialist = await this.specialistsRepository.findOne({
      where: {
        id,
        status: SpecialistStatus.ACTIVE,
        center: {
          id: centerId,
        },
      },
    });

    if (!specialist)
      throw new BadRequestException('El especialista no esta disponible');

    return specialist;
  }

  private getClientCenterId(client: Client): number {
    if (!client.center?.id)
      throw new BadRequestException(
        'Tu ficha de cliente no tiene centro asignado',
      );

    return client.center.id;
  }

  private toServiceResponse(service: ServiceEntity) {
    return {
      id: service.id,
      name: service.name,
      description: service.description ?? null,
      durationMinutes: service.durationMinutes,
      price: service.price ?? null,
      specialist: service.specialist
        ? this.toSpecialistResponse(service.specialist)
        : null,
    };
  }

  private toSpecialistResponse(specialist: Specialist) {
    return {
      id: specialist.id,
      name: specialist.name,
      specialty: specialist.specialty ?? null,
    };
  }

  private toAppointmentResponse(appointment: Appointment) {
    return {
      id: appointment.id,
      startDateTime: appointment.startDateTime,
      duration: appointment.duration,
      status: appointment.status,
      outsideAvailability: appointment.outsideAvailability,
      center: {
        id: appointment.center.id,
        name: appointment.center.name,
        city: appointment.center.city ?? null,
        logoUrl: appointment.center.logoUrl ?? null,
      },
      service: {
        id: appointment.service.id,
        name: appointment.service.name,
        durationMinutes: appointment.service.durationMinutes,
        price: appointment.service.price ?? null,
      },
      specialist: {
        id: appointment.specialist.id,
        name: appointment.specialist.name,
        specialty: appointment.specialist.specialty ?? null,
      },
    };
  }
}
