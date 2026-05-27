import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  AuthUser,
  CenterAccessService,
} from '../centers/center-access.service';
import { Availability } from './availability.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private availabilityRepository: Repository<Availability>,

    private readonly centerAccessService: CenterAccessService,
  ) {}

  async findAll(authUser?: AuthUser, centerId?: number) {
    const centerIds = await this.getAllowedCenterIds(authUser, centerId);

    if (centerIds.length === 0) return [];

    return this.availabilityRepository.find({
      where: {
        center: {
          id: In(centerIds),
        },
      },
      order: {
        dayOfWeek: 'ASC',
        startTime: 'ASC',
      },
    });
  }

  async findByDay(dayOfWeek: number, authUser?: AuthUser, centerId?: number) {
    const centerIds = await this.getAllowedCenterIds(authUser, centerId);

    if (centerIds.length === 0) return [];

    return this.availabilityRepository.find({
      where: {
        dayOfWeek,
        center: {
          id: In(centerIds),
        },
      },
      order: {
        startTime: 'ASC',
      },
    });
  }

  // Crea una nueva franja de disponibilidad
  async create(availabilityData: CreateAvailabilityDto, authUser?: AuthUser) {
    const { centerId, ...availabilityPayload } = availabilityData;
    const center = await this.centerAccessService.getCenter(centerId, authUser);

    if (availabilityData.startTime >= availabilityData.endTime)
      throw new BadRequestException(
        'La hora de inicio debe ser anterior a la hora de fin',
      );

    const availabilitiesSameDay = await this.availabilityRepository.find({
      where: {
        dayOfWeek: availabilityData.dayOfWeek,
        center: {
          id: centerId,
        },
      },
    });

    const hasOverlap = availabilitiesSameDay.some((availability) => {
      return (
        availability.startTime < availabilityData.endTime &&
        availability.endTime > availabilityData.startTime
      );
    });

    if (hasOverlap)
      throw new BadRequestException(
        'La franja de disponibilidad se solapa con otra existente',
      );

    const availability = this.availabilityRepository.create({
      ...availabilityPayload,
      center,
    });

    return this.availabilityRepository.save(availability);
  }

  // Elimina una franja de disponibilidad por su ID
  async remove(id: number, authUser?: AuthUser) {
    const availability = await this.findOne(id, authUser);

    await this.availabilityRepository.remove(availability);

    return {
      message: 'Disponibilidad eliminada correctamente',
    };
  }

  // Actualiza una franja de disponibilidad por su ID
  async update(
    id: number,
    availabilityData: UpdateAvailabilityDto,
    authUser?: AuthUser,
  ) {
    // Busca la franja de disponibilidad por su ID
    const availability = await this.findOne(id, authUser);
    const { centerId, ...availabilityPayload } = availabilityData;
    const center =
      centerId !== undefined
        ? await this.centerAccessService.getCenter(centerId, authUser)
        : availability.center;

    const updatedAvailability = {
      ...availability,
      ...availabilityPayload,
      center,
    };

    // Valida que la hora de inicio sea anterior a la hora de fin
    if (updatedAvailability.startTime >= updatedAvailability.endTime)
      throw new BadRequestException(
        'La hora de inicio debe ser anterior a la hora de fin',
      );

    // Obtiene todas las franjas de disponibilidad del mismo día
    const availabilitiesSameDay = await this.availabilityRepository.find({
      where: {
        dayOfWeek: updatedAvailability.dayOfWeek,
        center: {
          id: updatedAvailability.center?.id,
        },
      },
    });

    // Verifica si la franja actualizada se solapa con otras franjas del mismo día, excluyendo la franja que se está actualizando
    const hasOverlap = availabilitiesSameDay.some((existingAvailability) => {
      if (existingAvailability.id === id) return false;

      return (
        existingAvailability.startTime < updatedAvailability.endTime &&
        existingAvailability.endTime > updatedAvailability.startTime
      );
    });

    if (hasOverlap)
      throw new BadRequestException(
        'La franja de disponibilidad se solapa con otra existente',
      );

    Object.assign(availability, availabilityPayload);

    if (centerId !== undefined) {
      availability.center = center;
    }

    return this.availabilityRepository.save(availability);
  }

  private async findOne(
    id: number,
    authUser?: AuthUser,
  ): Promise<Availability> {
    const availability = await this.availabilityRepository.findOne({
      where: { id },
    });

    if (!availability)
      throw new NotFoundException('No se ha encontrado la disponibilidad');

    if (!availability.center?.id)
      throw new BadRequestException(
        'La disponibilidad debe tener un centro asignado',
      );

    await this.centerAccessService.validateCenterAccess(
      availability.center.id,
      authUser,
    );

    return availability;
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
}
