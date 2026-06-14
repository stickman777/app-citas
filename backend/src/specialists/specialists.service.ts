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
import { CreateSpecialistAbsenceDto } from './dto/create-specialist-absence.dto';
import { UpdateSpecialistDto } from './dto/update-specialist.dto';
import { SpecialistAbsence } from './specialist-absence.entity';
import { Specialist, SpecialistStatus } from './specialist.entity';

@Injectable()
export class SpecialistsService {
  constructor(
    @InjectRepository(Specialist)
    private specialistsRepository: Repository<Specialist>,

    @InjectRepository(SpecialistAbsence)
    private absencesRepository: Repository<SpecialistAbsence>,

    private readonly centerAccessService: CenterAccessService,
  ) {}

  async listAbsences(specialistId: number, authUser?: AuthUser) {
    await this.findOne(specialistId, authUser);

    return this.absencesRepository.find({
      where: { specialist: { id: specialistId } },
      order: { startDate: 'ASC' },
    });
  }

  async createAbsence(
    specialistId: number,
    absenceData: CreateSpecialistAbsenceDto,
    authUser?: AuthUser,
  ) {
    const specialist = await this.findOne(specialistId, authUser);

    if (absenceData.endDate < absenceData.startDate)
      throw new BadRequestException(
        'La fecha de fin debe ser igual o posterior a la de inicio',
      );

    const absence = this.absencesRepository.create({
      specialist: { id: specialist.id },
      startDate: absenceData.startDate,
      endDate: absenceData.endDate,
      reason: absenceData.reason?.trim() || null,
    });

    return this.absencesRepository.save(absence);
  }

  async removeAbsence(absenceId: number, authUser?: AuthUser) {
    const absence = await this.absencesRepository.findOne({
      where: { id: absenceId },
      relations: { specialist: true },
    });

    if (!absence)
      throw new NotFoundException('No se ha encontrado la ausencia');

    if (!absence.specialist?.center?.id)
      throw new BadRequestException(
        'La ausencia no tiene un centro asignado',
      );

    await this.centerAccessService.validateCenterAccess(
      absence.specialist.center.id,
      authUser,
    );

    await this.absencesRepository.remove(absence);

    return { message: 'Ausencia eliminada correctamente' };
  }

  async findAll(authUser?: AuthUser, centerId?: number) {
    const centerIds = await this.getAllowedCenterIds(authUser, centerId);

    if (centerIds.length === 0) return [];

    return this.specialistsRepository.find({
      where: {
        status: SpecialistStatus.ACTIVE,
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
    const { centerId, name, specialty, status } = specialistData;

    if (!centerId) throw new BadRequestException('Centro requerido');

    const center = await this.centerAccessService.getCenter(centerId, authUser);

    if (!center) throw new BadRequestException('Centro requerido');

    const specialist = this.specialistsRepository.create({
      name: name.trim(),
      specialty: specialty?.trim() || undefined,
      status: status ?? SpecialistStatus.ACTIVE,
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
    const { centerId, name, specialty, status } = specialistData;
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

    if (status !== undefined) {
      specialist.status = status;
    }

    if (centerId !== undefined) {
      specialist.center = center;
    }

    return this.specialistsRepository.save(specialist);
  }

  async activate(id: number, authUser?: AuthUser) {
    const specialist = await this.findOne(id, authUser);

    specialist.status = SpecialistStatus.ACTIVE;

    return this.specialistsRepository.save(specialist);
  }

  async deactivate(id: number, authUser?: AuthUser) {
    const specialist = await this.findOne(id, authUser);

    specialist.status = SpecialistStatus.INACTIVE;

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
