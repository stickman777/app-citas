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
import { CreateSpecialistDto } from './dto/create-specialist.dto';
import { UpdateSpecialistDto } from './dto/update-specialist.dto';
import { Specialist } from './specialist.entity';

@Injectable()
export class SpecialistsService {
  constructor(
    @InjectRepository(Specialist)
    private specialistsRepository: Repository<Specialist>,

    private readonly centerAccessService: CenterAccessService,
  ) {}

  async findAll(authUser?: AuthUser, centerId?: number) {
    const centerIds = await this.getAllowedCenterIds(authUser, centerId);

    if (centerIds.length === 0) return [];

    return this.specialistsRepository.find({
      where: {
        active: true,
        center: {
          id: In(centerIds),
        },
      },
      order: {
        name: 'ASC',
      },
    });
  }

  async findAllIncludingInactive(authUser?: AuthUser, centerId?: number) {
    const centerIds = await this.getAllowedCenterIds(authUser, centerId);

    if (centerIds.length === 0) return [];

    return this.specialistsRepository.find({
      where: {
        center: {
          id: In(centerIds),
        },
      },
      order: {
        name: 'ASC',
      },
    });
  }

  async findOne(id: number, authUser?: AuthUser) {
    const specialist = await this.specialistsRepository.findOne({
      where: { id },
    });

    if (!specialist)
      throw new NotFoundException('No se ha encontrado el especialista');

    await this.validateSpecialistAccess(specialist, authUser);

    return specialist;
  }

  async create(specialistData: CreateSpecialistDto, authUser?: AuthUser) {
    const { centerId, name, specialty } = specialistData;

    if (!centerId) throw new BadRequestException('Centro requerido');

    const center = await this.centerAccessService.getCenter(centerId, authUser);

    if (!center) throw new BadRequestException('Centro requerido');

    const specialist = this.specialistsRepository.create({
      name: name.trim(),
      specialty: specialty?.trim() || undefined,
      center,
    });

    return this.specialistsRepository.save(specialist);
  }

  async update(
    id: number,
    specialistData: UpdateSpecialistDto,
    authUser?: AuthUser,
  ) {
    const specialist = await this.findOne(id, authUser);
    const { centerId, name, specialty } = specialistData;
    const center =
      centerId !== undefined
        ? await this.centerAccessService.getCenter(centerId, authUser)
        : specialist.center;

    if (!center) throw new BadRequestException('Centro requerido');

    if (name !== undefined) {
      specialist.name = name.trim();
    }

    if (specialty !== undefined) {
      specialist.specialty = specialty.trim() || undefined;
    }

    if (centerId !== undefined) {
      specialist.center = center;
    }

    return this.specialistsRepository.save(specialist);
  }

  async activate(id: number, authUser?: AuthUser) {
    const specialist = await this.findOne(id, authUser);

    specialist.active = true;

    return this.specialistsRepository.save(specialist);
  }

  async deactivate(id: number, authUser?: AuthUser) {
    const specialist = await this.findOne(id, authUser);

    specialist.active = false;

    return this.specialistsRepository.save(specialist);
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

  private async validateSpecialistAccess(
    specialist: Specialist,
    authUser?: AuthUser,
  ): Promise<void> {
    if (authUser?.role !== UserRole.GESTOR) return;

    if (!specialist.center?.id)
      throw new ForbiddenException('No puedes gestionar este especialista');

    await this.centerAccessService.validateCenterAccess(
      specialist.center.id,
      authUser,
    );
  }
}
