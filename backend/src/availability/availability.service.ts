import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from './availability.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';

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
}
