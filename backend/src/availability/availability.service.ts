import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from './availability.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private availabilityRepository: Repository<Availability>,
  ) {}

  findAll() {
    return this.availabilityRepository.find({
      order: {
        dayOfWeek: 'ASC',
      },
    });
  }

  async findByDay(dayOfWeek: number) {
    return this.availabilityRepository.find({
      where: { dayOfWeek },
      order: {
        startTime: 'ASC',
      },
    });
  }

  // Crea una nueva franja de disponibilidad
  async create(availabilityData: CreateAvailabilityDto) {
    if (availabilityData.startTime >= availabilityData.endTime)
      throw new BadRequestException(
        'La hora de inicio debe ser anterior a la hora de fin',
      );

    const availabilitiesSameDay = await this.availabilityRepository.find({
      where: {
        dayOfWeek: availabilityData.dayOfWeek,
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

    const availability = this.availabilityRepository.create(availabilityData);

    return this.availabilityRepository.save(availability);
  }

  // Elimina una franja de disponibilidad por su ID
  async remove(id: number) {
    const availability = await this.availabilityRepository.findOne({
      where: { id },
    });

    if (!availability)
      throw new NotFoundException('No se ha encontrado la disponibilidad');

    await this.availabilityRepository.remove(availability);

    return {
      message: 'Disponibilidad eliminada correctamente',
    };
  }

  // Actualiza una franja de disponibilidad por su ID
  async update(id: number, availabilityData: UpdateAvailabilityDto) {
    // Busca la franja de disponibilidad por su ID
    const availability = await this.availabilityRepository.findOne({
      where: { id },
    });

    if (!availability)
      throw new NotFoundException('No se ha encontrado la disponibilidad');

    const updatedAvailability = {
      ...availability,
      ...availabilityData,
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

    Object.assign(availability, availabilityData);

    return this.availabilityRepository.save(availability);
  }
}
