import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceEntity } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceEntity)
    private servicesRepository: Repository<ServiceEntity>,
  ) {}

  // Obtiene todos los servicios activos
  findAll() {
    return this.servicesRepository.find({
      where: {
        active: true,
      },
    });
  }

  // Obtiene todos los servicios, incluyendo los inactivos
  findAllIncludingInactive() {
    return this.servicesRepository.find();
  }

  async findOne(id: number) {
    const service = await this.servicesRepository.findOne({
      where: { id },
    });

    if (!service)
      throw new NotFoundException('No se ha encontrado el servicio');

    return service;
  }

  // Crea un nuevo servicio
  create(serviceData: CreateServiceDto) {
    const service = this.servicesRepository.create(serviceData);

    return this.servicesRepository.save(service);
  }

  // Actualiza un servicio existente por su ID
  async update(id: number, serviceData: UpdateServiceDto) {
    const service = await this.findOne(id);

    Object.assign(service, serviceData);

    return this.servicesRepository.save(service);
  }

  // Activa un servicio por su ID (lo marca como activo)
  async activate(id: number) {
    const service = await this.findOne(id);

    service.active = true;

    return this.servicesRepository.save(service);
  }

  // Desactiva un servicio por su ID (lo marca como inactivo)
  async deactivate(id: number) {
    const service = await this.findOne(id);

    service.active = false;

    return this.servicesRepository.save(service);
  }
}
