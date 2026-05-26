import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Center } from './center.entity';
import { CreateCenterDto } from './dto/create-center.dto';
import { UpdateCenterDto } from './dto/update-center.dto';

@Injectable()
export class CentersService implements OnModuleInit {
  constructor(
    @InjectRepository(Center)
    private centersRepository: Repository<Center>,
  ) {}

  async onModuleInit() {
    await this.ensureDefaultCenter();
  }

  findAll() {
    return this.centersRepository.find({
      where: {
        active: true,
      },
      order: {
        name: 'ASC',
      },
    });
  }

  findAllIncludingInactive() {
    return this.centersRepository.find({
      order: {
        name: 'ASC',
      },
    });
  }

  async findOne(id: number) {
    const center = await this.centersRepository.findOne({
      where: { id },
    });

    if (!center) throw new NotFoundException('No se ha encontrado el centro');

    return center;
  }

  create(centerData: CreateCenterDto) {
    const center = this.centersRepository.create(centerData);

    return this.centersRepository.save(center);
  }

  async update(id: number, centerData: UpdateCenterDto) {
    const center = await this.findOne(id);

    Object.assign(center, centerData);

    return this.centersRepository.save(center);
  }

  async activate(id: number) {
    const center = await this.findOne(id);

    center.active = true;

    return this.centersRepository.save(center);
  }

  async deactivate(id: number) {
    const center = await this.findOne(id);

    center.active = false;

    return this.centersRepository.save(center);
  }

  private async ensureDefaultCenter() {
    const defaultCenterName = 'Trustcare Clinic';
    const existingCenter = await this.centersRepository.findOne({
      where: { name: defaultCenterName },
    });

    if (existingCenter) return;

    const center = this.centersRepository.create({
      name: defaultCenterName,
      city: 'Las Vegas',
      logoUrl: 'assets/img/icons/trustcare.svg',
    });

    await this.centersRepository.save(center);
  }
}
