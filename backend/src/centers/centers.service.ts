import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Availability } from '../availability/availability.entity';
import { User, UserRole } from '../users/user.entity';
import { AuthUser, CenterAccessService } from './center-access.service';
import { Center } from './center.entity';
import { DEFAULT_CENTER_SCHEDULE } from './default-center-schedule';
import {
  CenterScheduleSlotDto,
  TIME_FORMAT_REGEX,
} from './dto/center-schedule-slot.dto';
import { CreateCenterDto } from './dto/create-center.dto';
import { UpdateCenterDto } from './dto/update-center.dto';

type CenterWithSchedule = Center & {
  schedule: CenterScheduleSlotDto[];
};

@Injectable()
export class CentersService {
  constructor(
    @InjectRepository(Center)
    private centersRepository: Repository<Center>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Availability)
    private availabilityRepository: Repository<Availability>,

    private readonly centerAccessService: CenterAccessService,
  ) {}

  async findAll(authUser?: AuthUser) {
    if (authUser?.role === UserRole.GESTOR)
      return this.findManagedCenters(authUser, true);

    const centers = await this.centersRepository.find({
      where: {
        active: true,
      },
      order: {
        name: 'ASC',
      },
    });

    return this.attachSchedules(centers);
  }

  async findAllIncludingInactive(authUser?: AuthUser) {
    if (authUser?.role === UserRole.GESTOR)
      return this.findManagedCenters(authUser, false);

    const centers = await this.centersRepository.find({
      order: {
        name: 'ASC',
      },
    });

    return this.attachSchedules(centers);
  }

  async findOne(id: number, authUser?: AuthUser) {
    const center = await this.centersRepository.findOne({
      where: { id },
    });

    if (!center) throw new NotFoundException('No se ha encontrado el centro');

    await this.centerAccessService.validateCenterAccess(id, authUser);

    return this.attachSchedule(center);
  }

  async create(centerData: CreateCenterDto, authUser?: AuthUser) {
    const { schedule, ...centerPayload } = centerData;
    const normalizedSchedule = this.normalizeSchedule(
      schedule ?? DEFAULT_CENTER_SCHEDULE,
    );

    const savedCenter = await this.centersRepository.manager.transaction(
      async (manager) => {
        const centerRepository = manager.getRepository(Center);
        const center = centerRepository.create(centerPayload);
        const createdCenter = await centerRepository.save(center);

        await this.replaceSchedule(
          manager.getRepository(Availability),
          createdCenter,
          normalizedSchedule,
        );

        return createdCenter;
      },
    );

    if (authUser?.role === UserRole.GESTOR)
      await this.assignCenterToManager(savedCenter, authUser);

    return this.attachSchedule(savedCenter);
  }

  async update(id: number, centerData: UpdateCenterDto, authUser?: AuthUser) {
    const { schedule, ...centerPayload } = centerData;
    const center = await this.getCenterEntity(id, authUser);
    const normalizedSchedule =
      schedule !== undefined ? this.normalizeSchedule(schedule) : undefined;

    Object.assign(center, centerPayload);

    const savedCenter = await this.centersRepository.manager.transaction(
      async (manager) => {
        const centerRepository = manager.getRepository(Center);
        const updatedCenter = await centerRepository.save(center);

        if (normalizedSchedule !== undefined) {
          await this.replaceSchedule(
            manager.getRepository(Availability),
            updatedCenter,
            normalizedSchedule,
          );
        }

        return updatedCenter;
      },
    );

    return this.attachSchedule(savedCenter);
  }

  async activate(id: number, authUser?: AuthUser) {
    const center = await this.getCenterEntity(id, authUser);

    center.active = true;

    const savedCenter = await this.centersRepository.save(center);

    return this.attachSchedule(savedCenter);
  }

  async deactivate(id: number, authUser?: AuthUser) {
    const center = await this.getCenterEntity(id, authUser);

    center.active = false;

    const savedCenter = await this.centersRepository.save(center);

    return this.attachSchedule(savedCenter);
  }

  private async assignCenterToManager(center: Center, authUser: AuthUser) {
    const user = await this.usersRepository.findOne({
      relations: {
        centers: true,
      },
      where: { id: authUser.id },
    });

    if (!user)
      throw new BadRequestException(
        'No se ha encontrado el usuario autenticado',
      );

    user.centers = [...(user.centers ?? []), center];

    await this.usersRepository.save(user);
  }

  private async findManagedCenters(authUser: AuthUser, activeOnly: boolean) {
    const centerIds =
      await this.centerAccessService.getManagedCenterIds(authUser);

    if (centerIds.length === 0) return [];

    const centers = await this.centersRepository.find({
      where: {
        id: In(centerIds),
        ...(activeOnly ? { active: true } : {}),
      },
      order: {
        name: 'ASC',
      },
    });

    return this.attachSchedules(centers);
  }

  private async getCenterEntity(id: number, authUser?: AuthUser) {
    const center = await this.centersRepository.findOne({
      where: { id },
    });

    if (!center) throw new NotFoundException('No se ha encontrado el centro');

    await this.centerAccessService.validateCenterAccess(id, authUser);

    return center;
  }

  private async attachSchedule(center: Center): Promise<CenterWithSchedule> {
    const [centerWithSchedule] = await this.attachSchedules([center]);

    return centerWithSchedule;
  }

  private async attachSchedules(
    centers: Center[],
  ): Promise<CenterWithSchedule[]> {
    if (centers.length === 0) return [];

    const centerIds = centers.map((center) => center.id);
    const availabilities = await this.availabilityRepository.find({
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

    const scheduleByCenterId = new Map<number, CenterScheduleSlotDto[]>();

    for (const availability of availabilities) {
      const centerId = availability.center?.id;
      if (!centerId) continue;

      const schedule = scheduleByCenterId.get(centerId) ?? [];
      schedule.push({
        dayOfWeek: availability.dayOfWeek,
        startTime: availability.startTime,
        endTime: availability.endTime,
      });
      scheduleByCenterId.set(centerId, schedule);
    }

    return centers.map((center) => ({
      ...center,
      schedule: scheduleByCenterId.get(center.id) ?? [],
    }));
  }

  private normalizeSchedule(
    schedule: CenterScheduleSlotDto[],
  ): CenterScheduleSlotDto[] {
    if (!Array.isArray(schedule) || schedule.length === 0)
      throw new BadRequestException('El horario debe tener al menos una franja');

    const normalizedSchedule = schedule
      .map((slot) => ({
        dayOfWeek: Number(slot.dayOfWeek),
        startTime: slot.startTime,
        endTime: slot.endTime,
      }))
      .sort(
        (a, b) =>
          a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime),
      );

    for (const slot of normalizedSchedule) {
      if (
        !Number.isInteger(slot.dayOfWeek) ||
        slot.dayOfWeek < 0 ||
        slot.dayOfWeek > 6
      )
        throw new BadRequestException(
          'El dia de la semana debe estar entre el Lunes y el Domingo (0-6)',
        );

      if (!TIME_FORMAT_REGEX.test(slot.startTime))
        throw new BadRequestException(
          'La hora de inicio debe tener formato HH:mm',
        );

      if (!TIME_FORMAT_REGEX.test(slot.endTime))
        throw new BadRequestException('La hora de fin debe tener formato HH:mm');

      if (slot.startTime >= slot.endTime)
        throw new BadRequestException(
          'La hora de inicio debe ser anterior a la hora de fin',
        );
    }

    const hasOverlap = normalizedSchedule.some((slot, index) =>
      normalizedSchedule.some((otherSlot, otherIndex) => {
        if (index === otherIndex || slot.dayOfWeek !== otherSlot.dayOfWeek)
          return false;

        return (
          slot.startTime < otherSlot.endTime &&
          slot.endTime > otherSlot.startTime
        );
      }),
    );

    if (hasOverlap)
      throw new BadRequestException(
        'El horario del centro tiene franjas solapadas',
      );

    return normalizedSchedule;
  }

  private async replaceSchedule(
    repository: Repository<Availability>,
    center: Center,
    schedule: CenterScheduleSlotDto[],
  ) {
    await repository.delete({
      center: {
        id: center.id,
      },
    });

    const availability = schedule.map((slot) =>
      repository.create({
        ...slot,
        center,
      }),
    );

    await repository.save(availability);
  }

}
