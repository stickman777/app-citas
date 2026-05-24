import { Injectable } from '@nestjs/common';
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

  create(availabilityData: CreateAvailabilityDto) {
    const availability = this.availabilityRepository.create(availabilityData);

    return this.availabilityRepository.save(availability);
  }
}
