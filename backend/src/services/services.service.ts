import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ServiceEntity } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Center } from '../centers/center.entity';
import { User, UserRole } from '../users/user.entity';

interface AuthUser {
  id: number;
  role: UserRole;
}

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceEntity)
    private servicesRepository: Repository<ServiceEntity>,

    @InjectRepository(Center)
    private centersRepository: Repository<Center>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,
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
    const { centerId, ...servicePayload } = serviceData;

    if (!centerId) throw new BadRequestException('Centro requerido');

    const center = await this.getCenter(centerId, authUser);
    const service = this.servicesRepository.create({
      ...servicePayload,
      center,
    });

    return this.servicesRepository.save(service);
  }

  // Actualiza un servicio existente por su ID
  async update(id: number, serviceData: UpdateServiceDto, authUser?: AuthUser) {
    const service = await this.findOne(id, authUser);
    const { centerId, ...servicePayload } = serviceData;
    const center = await this.getCenter(centerId, authUser);

    Object.assign(service, servicePayload);
    service.center = center ?? service.center;

    return this.servicesRepository.save(service);
  }

  private async getCenter(
    centerId: number | undefined,
    authUser?: AuthUser,
  ): Promise<Center | null> {
    if (!centerId) return null;

    await this.validateCenterAccess(centerId, authUser);

    const center = await this.centersRepository.findOne({
      where: { id: centerId },
    });

    if (!center)
      throw new NotFoundException('No se ha encontrado el centro');

    return center;
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
    if (authUser?.role !== UserRole.GESTOR) {
      if (centerId) return [centerId];

      const centers = await this.centersRepository.find({
        select: {
          id: true,
        },
        where: {
          active: true,
        },
      });

      return centers.map((center) => center.id);
    }

    const managedCenterIds = await this.getManagedCenterIds(authUser);

    if (centerId) {
      if (!managedCenterIds.includes(centerId))
        throw new ForbiddenException('No puedes gestionar este centro');

      return [centerId];
    }

    return managedCenterIds;
  }

  private async validateServiceAccess(
    service: ServiceEntity,
    authUser?: AuthUser,
  ): Promise<void> {
    if (authUser?.role !== UserRole.GESTOR) return;

    if (!service.center?.id)
      throw new ForbiddenException('No puedes gestionar este servicio');

    await this.validateCenterAccess(service.center.id, authUser);
  }

  private async validateCenterAccess(
    centerId: number,
    authUser?: AuthUser,
  ): Promise<void> {
    if (authUser?.role !== UserRole.GESTOR) return;

    const managedCenterIds = await this.getManagedCenterIds(authUser);

    if (!managedCenterIds.includes(centerId))
      throw new ForbiddenException('No puedes gestionar este centro');
  }

  private async getManagedCenterIds(authUser?: AuthUser): Promise<number[]> {
    if (!authUser) return [];

    const user = await this.usersRepository.findOne({
      relations: {
        centers: true,
      },
      where: { id: authUser.id },
    });

    if (!user)
      throw new BadRequestException('No se ha encontrado el usuario autenticado');

    return user.centers?.map((center) => center.id) ?? [];
  }
}
