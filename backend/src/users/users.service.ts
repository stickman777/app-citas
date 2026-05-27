import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Center } from '../centers/center.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './user.entity';

interface AuthUser {
  id: number;
  role: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Center)
    private centersRepository: Repository<Center>,
  ) {}

  async findAll(authUser?: AuthUser) {
    if (!authUser || authUser.role === UserRole.ADMIN) {
      const users = await this.usersRepository.find({
        relations: {
          centers: true,
        },
      });

      return users.map((user) => this.removePassword(user));
    }

    const centerIds = await this.getManagedCenterIds(authUser);

    if (centerIds.length === 0) return [];

    const users = await this.usersRepository.find({
      relations: {
        centers: true,
      },
      where: {
        centers: {
          id: In(centerIds),
        },
      },
    });

    return users.map((user) => this.removePassword(user));
  }

  findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  async findProfile(id: number) {
    const user = await this.usersRepository.findOne({
      relations: {
        centers: true,
      },
      where: { id },
    });

    if (!user) throw new NotFoundException('No se ha encontrado el usuario');

    return this.removePassword(user);
  }

  async create(userData: CreateUserDto, authUser?: AuthUser) {
    this.validateRoleChange(authUser, userData.role);

    if (!userData.password)
      throw new BadRequestException('Password requerido');

    const existingUser = await this.usersRepository.findOne({
      where: {
        email: userData.email,
      },
    });

    if (existingUser)
      throw new BadRequestException('Ya existe un usuario con ese email');

    const { centerIds, ...userPayload } = userData;
    this.validateManagedCenterSelection(authUser, centerIds ?? []);
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const centers = await this.resolveCentersForUser(authUser, centerIds);

    const user = this.usersRepository.create({
      ...userPayload,
      password: hashedPassword,
      centers,
    });

    const savedUser = await this.usersRepository.save(user);

    return this.removePassword(savedUser);
  }

  async update(id: number, userData: UpdateUserDto, authUser?: AuthUser) {
    const user = await this.findManageableUser(id, authUser);

    if (!user) throw new NotFoundException('No se ha encontrado el usuario');

    if (userData.password)
      userData.password = await bcrypt.hash(userData.password, 10);

    if (
      user.role === UserRole.ADMIN &&
      userData.role &&
      userData.role !== UserRole.ADMIN
    )
      throw new BadRequestException('No se puede degradar un administrador');

    if (userData.email && userData.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: {
          email: userData.email,
        },
      });

      if (existingUser)
        throw new BadRequestException('Ya existe un usuario con ese email');
    }

    this.validateRoleChange(authUser, userData.role);

    const { centerIds, ...userPayload } = userData;
    this.validateManagedCenterSelection(authUser, centerIds);
    const centers = await this.resolveCentersForUser(authUser, centerIds);

    Object.assign(user, userPayload);

    if (centerIds !== undefined) {
      user.centers = centers;
    }

    const savedUser = await this.usersRepository.save(user);

    return this.removePassword(savedUser);
  }

  async remove(id: number, authUser?: AuthUser) {
    const user = await this.findManageableUser(id, authUser);

    if (!user) throw new NotFoundException('No se ha encontrado el usuario');

    const userWithoutPassword = this.removePassword(user);

    await this.usersRepository.remove(user);

    return userWithoutPassword;
  }

  private async findManageableUser(
    id: number,
    authUser?: AuthUser,
  ): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      relations: {
        centers: true,
      },
      where: { id },
    });

    if (!user || !authUser || authUser.role === UserRole.ADMIN) return user;

    const centerIds = await this.getManagedCenterIds(authUser);
    const sharesCenter = user.centers?.some((center) =>
      centerIds.includes(center.id),
    );

    if (!sharesCenter)
      throw new ForbiddenException(
        'No puedes gestionar usuarios fuera de tus centros',
      );

    return user;
  }

  private async resolveCentersForUser(
    authUser: AuthUser | undefined,
    centerIds?: number[],
  ): Promise<Center[]> {
    if (centerIds === undefined) return [];

    const uniqueCenterIds = [...new Set(centerIds)];

    if (uniqueCenterIds.length === 0) return [];

    if (authUser?.role !== UserRole.ADMIN) {
      const managedCenterIds = await this.getManagedCenterIds(authUser);
      const hasInvalidCenter = uniqueCenterIds.some(
        (centerId) => !managedCenterIds.includes(centerId),
      );

      if (hasInvalidCenter)
        throw new ForbiddenException(
          'No puedes asignar centros que no gestionas',
        );
    }

    const centers = await this.centersRepository.find({
      where: {
        id: In(uniqueCenterIds),
      },
    });

    if (centers.length !== uniqueCenterIds.length)
      throw new BadRequestException('Alguno de los centros no existe');

    return centers;
  }

  private async getManagedCenterIds(authUser?: AuthUser): Promise<number[]> {
    if (!authUser) return [];

    const user = await this.usersRepository.findOne({
      relations: {
        centers: true,
      },
      where: { id: authUser.id },
    });

    return user?.centers?.map((center) => center.id) ?? [];
  }

  private validateRoleChange(authUser: AuthUser | undefined, role?: UserRole) {
    if (authUser?.role !== UserRole.ADMIN && role === UserRole.ADMIN)
      throw new ForbiddenException('Solo un administrador puede asignar ADMIN');
  }

  private validateManagedCenterSelection(
    authUser: AuthUser | undefined,
    centerIds?: number[],
  ) {
    if (
      authUser?.role !== UserRole.ADMIN &&
      centerIds !== undefined &&
      centerIds.length === 0
    )
      throw new ForbiddenException(
        'Un gestor debe asignar al menos uno de sus centros',
      );
  }

  private removePassword(user: User) {
    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }
}
