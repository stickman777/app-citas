import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { Center } from './center.entity';

export interface AuthUser {
  id: number;
  role: UserRole;
}

interface CenterAccessOptions {
  includeActiveCentersForAdmin?: boolean;
}

@Injectable()
export class CenterAccessService {
  constructor(
    @InjectRepository(Center)
    private centersRepository: Repository<Center>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getAllowedCenterIds(
    authUser?: AuthUser,
    centerId?: number,
    options: CenterAccessOptions = {},
  ): Promise<number[] | undefined> {
    if (authUser?.role === UserRole.ADMIN || !authUser) {
      if (centerId) return [centerId];

      if (options.includeActiveCentersForAdmin) {
        return this.getActiveCenterIds();
      }

      return undefined;
    }

    const managedCenterIds = await this.getAssignedCenterIds(authUser);

    if (centerId) {
      if (!managedCenterIds.includes(centerId))
        throw new ForbiddenException('No puedes gestionar este centro');

      return [centerId];
    }

    return managedCenterIds;
  }

  async validateCenterAccess(
    centerId: number,
    authUser?: AuthUser,
  ): Promise<void> {
    if (authUser?.role === UserRole.ADMIN || !authUser) return;

    const managedCenterIds = await this.getAssignedCenterIds(authUser);

    if (!managedCenterIds.includes(centerId))
      throw new ForbiddenException('No puedes gestionar este centro');
  }

  async getManagedCenterIds(authUser?: AuthUser): Promise<number[]> {
    return this.getAssignedCenterIds(authUser);
  }

  async getAssignedCenterIds(authUser?: AuthUser): Promise<number[]> {
    if (!authUser) return [];

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

    return user.centers?.map((center) => center.id) ?? [];
  }

  async getCenter(
    centerId: number | undefined,
    authUser?: AuthUser,
  ): Promise<Center | null> {
    if (!centerId) return null;

    await this.validateCenterAccess(centerId, authUser);

    const center = await this.centersRepository.findOne({
      where: { id: centerId },
    });

    if (!center) throw new NotFoundException('No se ha encontrado el centro');

    return center;
  }

  async findCentersByIds(centerIds: number[]): Promise<Center[]> {
    const uniqueCenterIds = [...new Set(centerIds)];

    if (uniqueCenterIds.length === 0) return [];

    const centers = await this.centersRepository.find({
      where: {
        id: In(uniqueCenterIds),
      },
    });

    if (centers.length !== uniqueCenterIds.length)
      throw new BadRequestException('Alguno de los centros no existe');

    return centers;
  }

  private async getActiveCenterIds(): Promise<number[]> {
    const centers = await this.centersRepository.find({
      select: {
        id: true,
      },
      where: {
        active: true,
      },
    });

    return centers.map((center) => center.id);
  }
}
