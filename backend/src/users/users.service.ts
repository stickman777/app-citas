import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Not, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  AuthUser,
  CenterAccessService,
} from '../centers/center-access.service';
import { Center } from '../centers/center.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Center)
    private centersRepository: Repository<Center>,

    private readonly centerAccessService: CenterAccessService,
  ) {}

  async onModuleInit() {
    await this.ensureDefaultAdmin();
    await this.ensureExistingUserNames();
  }

  async findAll(authUser?: AuthUser) {
    if (!authUser || authUser.role === UserRole.ADMIN) {
      const users = await this.usersRepository.find({
        relations: {
          centers: true,
        },
      });

      return users.map((user) => this.removePassword(user));
    }

    const centerIds =
      await this.centerAccessService.getManagedCenterIds(authUser);

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

  async findForLogin(identifier: string) {
    const normalizedIdentifier = identifier.trim();

    if (!normalizedIdentifier) return null;

    const user = await this.findByEmail(normalizedIdentifier);

    if (user) return user;

    return this.usersRepository.findOne({
      where: {
        role: UserRole.ADMIN,
        name: ILike(normalizedIdentifier),
      },
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

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      centers:
        user.centers?.map((center) => ({
          id: center.id,
          name: center.name,
        })) ?? [],
      centerIds: user.centers?.map((center) => center.id) ?? [],
    };
  }

  async create(userData: CreateUserDto, authUser?: AuthUser) {
    this.validateRoleChange(authUser, userData.role);
    await this.validateAdminAlias(userData.role, userData.name);

    if (!userData.password) throw new BadRequestException('Password requerido');

    const existingUser = await this.usersRepository.findOne({
      where: {
        email: userData.email,
      },
    });

    if (existingUser)
      throw new BadRequestException('Ya existe un usuario con ese email');

    const { centerIds: requestedCenterIds, ...userPayload } = userData;
    const centerIds = await this.resolveCenterIdsForRole(
      userData.role,
      requestedCenterIds,
      authUser,
    );
    this.validateManagedCenterSelection(authUser, centerIds ?? []);
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const centers = await this.resolveCentersForUser(authUser, centerIds);

    const user = this.usersRepository.create({
      ...this.normalizeUserPayload(userPayload),
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

    const nextRole = userData.role ?? user.role;
    const nextName = userData.name ?? user.name;
    await this.validateAdminAlias(nextRole, nextName, user.id);

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

    const { centerIds: requestedCenterIds, ...userPayload } = userData;
    const centerIds = await this.resolveCenterIdsForRole(
      nextRole,
      requestedCenterIds,
      authUser,
      user,
    );
    this.validateManagedCenterSelection(authUser, centerIds);
    const centers = await this.resolveCentersForUser(authUser, centerIds);

    Object.assign(user, this.normalizeUserPayload(userPayload));

    if (centerIds !== undefined) {
      user.centers = centers;
    }

    const savedUser = await this.usersRepository.save(user);

    return this.removePassword(savedUser);
  }

  async updateProfile(
    id: number,
    userData: {
      email?: string;
      currentPassword?: string;
      password?: string;
    },
  ) {
    const user = await this.usersRepository.findOne({
      relations: {
        centers: true,
      },
      where: { id },
    });

    if (!user) throw new NotFoundException('No se ha encontrado el usuario');

    if (userData.email && userData.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: {
          email: userData.email,
        },
      });

      if (existingUser)
        throw new BadRequestException('Ya existe un usuario con ese email');

      user.email = userData.email;
    }

    if (userData.password) {
      if (!userData.currentPassword)
        throw new BadRequestException('Password actual requerido');

      const passwordMatches = await bcrypt.compare(
        userData.currentPassword,
        user.password,
      );

      if (!passwordMatches)
        throw new BadRequestException('Password actual incorrecto');

      user.password = await bcrypt.hash(userData.password, 10);
    }

    await this.usersRepository.save(user);

    return this.findProfile(id);
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

    const centerIds =
      await this.centerAccessService.getManagedCenterIds(authUser);
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
  ) {
    if (centerIds === undefined) return [];

    const uniqueCenterIds = [...new Set(centerIds)];

    if (uniqueCenterIds.length === 0) return [];

    if (authUser?.role !== UserRole.ADMIN) {
      const managedCenterIds =
        await this.centerAccessService.getManagedCenterIds(authUser);
      const hasInvalidCenter = uniqueCenterIds.some(
        (centerId) => !managedCenterIds.includes(centerId),
      );

      if (hasInvalidCenter)
        throw new ForbiddenException(
          'No puedes asignar centros que no gestionas',
        );
    }

    return this.centerAccessService.findCentersByIds(uniqueCenterIds);
  }

  private async resolveCenterIdsForRole(
    role: UserRole,
    centerIds: number[] | undefined,
    authUser?: AuthUser,
    currentUser?: User,
  ): Promise<number[] | undefined> {
    if (role === UserRole.ADMIN) return [];

    const hasAssignedCenters = (currentUser?.centers?.length ?? 0) > 0;

    if (
      role === UserRole.GESTOR &&
      ((centerIds !== undefined && centerIds.length === 0) ||
        (centerIds === undefined && !hasAssignedCenters))
    ) {
      return [await this.getDefaultAssignableCenterId(authUser)];
    }

    return centerIds;
  }

  private async getDefaultAssignableCenterId(authUser?: AuthUser) {
    if (authUser?.role === UserRole.GESTOR) {
      const managedCenterIds =
        await this.centerAccessService.getManagedCenterIds(authUser);

      if (managedCenterIds.length === 0)
        throw new BadRequestException(
          'No hay centros disponibles para asignar al gestor',
        );

      return managedCenterIds[0];
    }

    const center = await this.centersRepository.findOne({
      select: {
        id: true,
      },
      where: {
        active: true,
      },
      order: {
        name: 'ASC',
      },
    });

    if (!center)
      throw new BadRequestException(
        'No hay centros disponibles para asignar al gestor',
      );

    return center.id;
  }

  private normalizeUserPayload<T extends Partial<CreateUserDto | UpdateUserDto>>(
    userData: T,
  ): T {
    if (userData.name !== undefined && !userData.name.trim())
      throw new BadRequestException('Nombre requerido');

    return {
      ...userData,
      ...(userData.name !== undefined ? { name: userData.name.trim() } : {}),
      ...(userData.email !== undefined ? { email: userData.email.trim() } : {}),
    };
  }

  private validateRoleChange(authUser: AuthUser | undefined, role?: UserRole) {
    if (authUser?.role !== UserRole.ADMIN && role === UserRole.ADMIN)
      throw new ForbiddenException('Solo un administrador puede asignar ADMIN');
  }

  private async validateAdminAlias(
    role: UserRole,
    name: string,
    excludeUserId?: number,
  ) {
    if (role !== UserRole.ADMIN) return;

    const admin = await this.usersRepository.findOne({
      where: {
        role: UserRole.ADMIN,
        name: ILike(name.trim()),
        ...(excludeUserId ? { id: Not(excludeUserId) } : {}),
      },
    });

    if (admin)
      throw new BadRequestException('Ya existe un administrador con ese alias');
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

  private async ensureDefaultAdmin() {
    const existingAdmin = await this.usersRepository.findOne({
      where: {
        role: UserRole.ADMIN,
      },
    });

    if (existingAdmin) {
      if (!existingAdmin.name.trim()) {
        existingAdmin.name =
          process.env.ADMIN_ALIAS?.trim() ||
          existingAdmin.email.split('@')[0] ||
          'admin';
        existingAdmin.centers = [];
        await this.usersRepository.save(existingAdmin);
      }

      return;
    }

    const email = process.env.ADMIN_EMAIL?.trim();
    const password = process.env.ADMIN_PASSWORD?.trim();

    if (!email || !password) {
      this.logger.warn(
        'No se ha creado el admin inicial porque faltan ADMIN_EMAIL o ADMIN_PASSWORD',
      );
      return;
    }

    const existingUser = await this.usersRepository.findOne({
      where: {
        email,
      },
    });

    if (existingUser) {
      this.logger.warn(
        `No se ha creado el admin inicial porque ya existe un usuario con el email ${email}`,
      );
      return;
    }

    const admin = this.usersRepository.create({
      email,
      name: process.env.ADMIN_ALIAS?.trim() || 'admin',
      password: await bcrypt.hash(password, 10),
      role: UserRole.ADMIN,
      centers: [],
    });

    await this.usersRepository.save(admin);
    this.logger.log(`Admin inicial creado: ${email}`);
  }

  private async ensureExistingUserNames() {
    const users = await this.usersRepository.find();
    const usersWithoutName = users.filter((user) => !user.name.trim());

    if (usersWithoutName.length === 0) return;

    for (const user of usersWithoutName) {
      user.name = user.email.split('@')[0] || `usuario-${user.id}`;
    }

    await this.usersRepository.save(usersWithoutName);
  }
}
