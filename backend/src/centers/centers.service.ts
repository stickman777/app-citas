import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { Center } from './center.entity';
import { CreateCenterDto } from './dto/create-center.dto';
import { UpdateCenterDto } from './dto/update-center.dto';

interface AuthUser {
  id: number;
  role: UserRole;
}

@Injectable()
export class CentersService implements OnModuleInit {
  constructor(
    @InjectRepository(Center)
    private centersRepository: Repository<Center>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.ensureDefaultCenter();
  }

  async findAll(authUser?: AuthUser) {
    if (authUser?.role === UserRole.GESTOR)
      return this.findManagedCenters(authUser, true);

    return this.centersRepository.find({
      where: {
        active: true,
      },
      order: {
        name: 'ASC',
      },
    });
  }

  async findAllIncludingInactive(authUser?: AuthUser) {
    if (authUser?.role === UserRole.GESTOR)
      return this.findManagedCenters(authUser, false);

    return this.centersRepository.find({
      order: {
        name: 'ASC',
      },
    });
  }

  async findOne(id: number, authUser?: AuthUser) {
    const center = await this.centersRepository.findOne({
      where: { id },
    });

    if (!center) throw new NotFoundException('No se ha encontrado el centro');

    await this.validateCenterAccess(id, authUser);

    return center;
  }

  async create(centerData: CreateCenterDto, authUser?: AuthUser) {
    const center = this.centersRepository.create(centerData);

    const savedCenter = await this.centersRepository.save(center);

    if (authUser?.role === UserRole.GESTOR)
      await this.assignCenterToManager(savedCenter, authUser);

    return savedCenter;
  }

  async update(id: number, centerData: UpdateCenterDto, authUser?: AuthUser) {
    const center = await this.findOne(id, authUser);

    Object.assign(center, centerData);

    return this.centersRepository.save(center);
  }

  async activate(id: number, authUser?: AuthUser) {
    const center = await this.findOne(id, authUser);

    center.active = true;

    return this.centersRepository.save(center);
  }

  async deactivate(id: number, authUser?: AuthUser) {
    const center = await this.findOne(id, authUser);

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

  private async assignCenterToManager(center: Center, authUser: AuthUser) {
    const user = await this.usersRepository.findOne({
      relations: {
        centers: true,
      },
      where: { id: authUser.id },
    });

    if (!user)
      throw new BadRequestException('No se ha encontrado el usuario autenticado');

    user.centers = [...(user.centers ?? []), center];

    await this.usersRepository.save(user);
  }

  private async validateCenterAccess(id: number, authUser?: AuthUser) {
    if (authUser?.role !== UserRole.GESTOR) return;

    const centerIds = await this.getManagedCenterIds(authUser);

    if (!centerIds.includes(id))
      throw new ForbiddenException('No puedes gestionar este centro');
  }

  private async getManagedCenterIds(authUser: AuthUser) {
    const user = await this.usersRepository.findOne({
      relations: {
        centers: true,
      },
      where: { id: authUser.id },
    });

    return user?.centers?.map((center) => center.id) ?? [];
  }

  private async findManagedCenters(authUser: AuthUser, activeOnly: boolean) {
    const user = await this.usersRepository.findOne({
      relations: {
        centers: true,
      },
      where: { id: authUser.id },
    });

    const centers = user?.centers ?? [];
    const filteredCenters = activeOnly
      ? centers.filter((center) => center.active)
      : centers;

    return filteredCenters.sort((a, b) => a.name.localeCompare(b.name));
  }
}
