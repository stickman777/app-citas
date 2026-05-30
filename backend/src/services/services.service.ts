import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  AuthUser,
  CenterAccessService,
} from '../centers/center-access.service';
import { UserRole } from '../users/user.entity';
import { ServiceEntity } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Specialist } from '../specialists/specialist.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceEntity)
    private servicesRepository: Repository<ServiceEntity>,

    @InjectRepository(Specialist)
    private specialistsRepository: Repository<Specialist>,

    private readonly centerAccessService: CenterAccessService,
  ) {}

  // Obtiene todos los servicios activos
  async findAll(authUser?: AuthUser, centerId?: number) {
    const centerIds = await this.getAllowedCenterIds(authUser, centerId);

    if (centerIds.length === 0) return [];

    return this.servicesRepository.find({
      where: {
        active: true,
        center: {
          id: In(centerIds),
        },
      },
    });
  }

  // Obtiene todos los servicios, incluyendo los inactivos
  async findAllIncludingInactive(authUser?: AuthUser, centerId?: number) {
    const centerIds = await this.getAllowedCenterIds(authUser, centerId);

    if (centerIds.length === 0) return [];

    return this.servicesRepository.find({
      where: {
        center: {
          id: In(centerIds),
        },
      },
    });
  }

  async findOne(id: number, authUser?: AuthUser) {
    const service = await this.servicesRepository.findOne({
      where: { id },
    });

    if (!service)
      throw new NotFoundException('No se ha encontrado el servicio');

    await this.validateServiceAccess(service, authUser);

    return service;
  }

  // Crea un nuevo servicio
  async create(serviceData: CreateServiceDto, authUser?: AuthUser) {
    const { centerId, specialistId, ...servicePayload } = serviceData;

    if (!centerId) throw new BadRequestException('Centro requerido');

    const center = await this.centerAccessService.getCenter(centerId, authUser);

    if (!center) throw new BadRequestException('Centro requerido');

    const specialist = await this.findSpecialist(specialistId);
    this.validateSpecialistCenter(specialist, center.id);

    const service = this.servicesRepository.create({
      ...servicePayload,
      center,
      specialist,
    });

    return this.servicesRepository.save(service);
  }

  // Actualiza un servicio existente por su ID
  async update(id: number, serviceData: UpdateServiceDto, authUser?: AuthUser) {
    const service = await this.findOne(id, authUser);
    const { centerId, specialistId, ...servicePayload } = serviceData;
    const center =
      centerId !== undefined
        ? await this.centerAccessService.getCenter(centerId, authUser)
        : service.center;
    const specialist =
      specialistId !== undefined
        ? await this.findSpecialist(specialistId)
        : service.specialist;

    if (!center) throw new BadRequestException('Centro requerido');
    if (!specialist) throw new BadRequestException('Especialista requerido');

    this.validateSpecialistCenter(specialist, center.id);

    Object.assign(service, servicePayload);
    service.center = center;
    service.specialist = specialist;

    return this.servicesRepository.save(service);
  }

  // Activa un servicio por su ID (lo marca como activo)
  async activate(id: number, authUser?: AuthUser) {
    const service = await this.findOne(id, authUser);

    service.active = true;

    return this.servicesRepository.save(service);
  }

  // Desactiva un servicio por su ID (lo marca como inactivo)
  async deactivate(id: number, authUser?: AuthUser) {
    const service = await this.findOne(id, authUser);

    service.active = false;

    return this.servicesRepository.save(service);
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

  private async validateServiceAccess(
    service: ServiceEntity,
    authUser?: AuthUser,
  ): Promise<void> {
    if (authUser?.role !== UserRole.GESTOR) return;

    if (!service.center?.id)
      throw new ForbiddenException('No puedes gestionar este servicio');

    await this.centerAccessService.validateCenterAccess(
      service.center.id,
      authUser,
    );
  }

  private async findSpecialist(id: number): Promise<Specialist> {
    const specialist = await this.specialistsRepository.findOne({
      where: { id },
    });

    if (!specialist)
      throw new NotFoundException('No se ha encontrado el especialista');

    return specialist;
  }

  private validateSpecialistCenter(
    specialist: Specialist,
    centerId: number,
  ): void {
    if (!specialist.center?.id)
      throw new BadRequestException(
        'El especialista debe tener un centro asignado',
      );

    if (specialist.center.id !== centerId)
      throw new BadRequestException(
        'El especialista debe pertenecer al centro del servicio',
      );
  }
}
