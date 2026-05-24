import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceEntity } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceEntity)
    private servicesRepository: Repository<ServiceEntity>,
  ) {}

  findAll() {
    return this.servicesRepository.find();
  }

  create(serviceData: CreateServiceDto) {
    const service = this.servicesRepository.create(serviceData);

    return this.servicesRepository.save(service);
  }
}
