import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import {
  AuthUser,
  CenterAccessService,
} from '../centers/center-access.service';
import { Center } from '../centers/center.entity';
import { AvailabilityException } from './availability-exception.entity';
import { Availability } from './availability.entity';
import { CreateAvailabilityExceptionDto } from './dto/create-availability-exception.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityExceptionDto } from './dto/update-availability-exception.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private availabilityRepository: Repository<Availability>,

    @InjectRepository(AvailabilityException)
    private availabilityExceptionRepository: Repository<AvailabilityException>,

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

  async findExceptions(
    authUser?: AuthUser,
    centerId?: number,
    from?: string,
    to?: string,
  ) {
    this.validateDateRange(from, to);

    const centerIds = await this.getAllowedCenterIds(authUser, centerId);

    if (centerIds.length === 0) return [];

    return this.availabilityExceptionRepository.find({
      where: {
        center: {
          id: In(centerIds),
        },
        ...(from && to ? { date: Between(from, to) } : {}),
      },
      order: {
        date: 'ASC',
        startTime: 'ASC',
      },
    });
  }

  async createException(
    exceptionData: CreateAvailabilityExceptionDto,
    authUser?: AuthUser,
  ) {
    const { centerId, label, ...exceptionPayload } = exceptionData;
    const center = await this.centerAccessService.getCenter(
      centerId,
      authUser,
    );

    if (!center)
      throw new BadRequestException('La excepcion debe tener un centro');

    const normalizedLabel = label?.trim() || undefined;

    await this.validateException({
      ...exceptionPayload,
      label: normalizedLabel,
      center,
    });

    const exception = this.availabilityExceptionRepository.create({
      ...exceptionPayload,
      label: normalizedLabel,
      center,
    });

    return this.availabilityExceptionRepository.save(exception);
  }

  async updateException(
    id: number,
    exceptionData: UpdateAvailabilityExceptionDto,
    authUser?: AuthUser,
  ) {
    const exception = await this.findException(id, authUser);
    const { centerId, label, ...exceptionPayload } = exceptionData;
    const center =
      centerId !== undefined
        ? await this.centerAccessService.getCenter(centerId, authUser)
        : exception.center;

    if (!center)
      throw new BadRequestException('La excepcion debe tener un centro');

    const updatedException = {
      ...exception,
      ...exceptionPayload,
      label: label !== undefined ? label.trim() || undefined : exception.label,
      center,
    };

    await this.validateException(updatedException, id);

    Object.assign(exception, exceptionPayload);

    if (label !== undefined) {
      exception.label = label.trim() || undefined;
    }

    if (centerId !== undefined) {
      exception.center = center;
    }

    return this.availabilityExceptionRepository.save(exception);
  }

  async removeException(id: number, authUser?: AuthUser) {
    const exception = await this.findException(id, authUser);

    await this.availabilityExceptionRepository.remove(exception);

    return {
      message: 'Excepcion de disponibilidad eliminada correctamente',
    };
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

  private async findException(
    id: number,
    authUser?: AuthUser,
  ): Promise<AvailabilityException> {
    const exception = await this.availabilityExceptionRepository.findOne({
      where: { id },
    });

    if (!exception)
      throw new NotFoundException(
        'No se ha encontrado la excepcion de disponibilidad',
      );

    await this.centerAccessService.validateCenterAccess(
      exception.center.id,
      authUser,
    );

    return exception;
  }

  private async validateException(
    exception: Omit<AvailabilityException, 'id'>,
    exceptionIdToExclude?: number,
  ) {
    this.validateDate(exception.date);

    if (exception.startTime >= exception.endTime)
      throw new BadRequestException(
        'La hora de inicio debe ser anterior a la hora de fin',
      );

    const exceptionsSameDay = await this.availabilityExceptionRepository.find({
      where: {
        date: exception.date,
        center: {
          id: exception.center.id,
        },
      },
    });

    const hasOverlap = exceptionsSameDay.some((existingException) => {
      if (existingException.id === exceptionIdToExclude) return false;

      return (
        existingException.startTime < exception.endTime &&
        existingException.endTime > exception.startTime
      );
    });

    if (hasOverlap)
      throw new BadRequestException(
        'La excepcion se solapa con otra excepcion existente',
      );
  }

  private validateDateRange(from?: string, to?: string) {
    if ((from && !to) || (!from && to))
      throw new BadRequestException(
        'Debe indicar fecha de inicio y fecha de fin',
      );

    if (!from || !to) return;

    this.validateDate(from);
    this.validateDate(to);

    if (from > to)
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior a la fecha de fin',
      );
  }

  private validateDate(date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      throw new BadRequestException('La fecha debe tener formato YYYY-MM-DD');

    const [year, month, day] = date.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);

    if (
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() !== month - 1 ||
      parsedDate.getDate() !== day
    )
      throw new BadRequestException('Fecha no valida');
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
