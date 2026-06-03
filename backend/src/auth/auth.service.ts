import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RegisterClientDto } from './dto/register-client.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from '../clients/client.entity';
import { DataSource, ILike, Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { hashClientInvitationToken } from '../common/client-invitation-token';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,

    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,

    private readonly dataSource: DataSource,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findForLogin(email);

    if (!user)
      throw new UnauthorizedException('Credenciales inválidas');

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches)
      throw new UnauthorizedException('Credenciales inválidas');

    // Se genera el JWT con la información del usuario
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async registerClient(registerData: RegisterClientDto) {
    const email = registerData.email.trim().toLowerCase();
    const name = registerData.name.trim();
    const invitationToken = registerData.invitationToken.trim();

    if (!name) throw new BadRequestException('Nombre requerido');
    if (!invitationToken)
      throw new BadRequestException('Invitacion requerida');

    const existingUser = await this.usersRepository.findOne({
      where: {
        email: ILike(email),
      },
    });

    if (existingUser)
      throw new BadRequestException('Ya existe un usuario con ese email');

    const client = await this.resolveInvitedClient(invitationToken);
    const hashedPassword = await bcrypt.hash(registerData.password, 10);

    const savedUser = await this.dataSource.transaction(async (manager) => {
      const clientToLink = client;

      if (clientToLink.user)
        throw new BadRequestException(
          'La ficha de cliente ya tiene una cuenta vinculada',
        );

      if (!clientToLink.center?.id)
        throw new BadRequestException(
          'La ficha de cliente no tiene centro asignado',
        );

      const user = manager.create(User, {
        email,
        name,
        password: hashedPassword,
        role: UserRole.CLIENT,
        centers: [clientToLink.center],
        activeCenter: clientToLink.center,
      });
      const savedUser = await manager.save(User, user);

      clientToLink.name = name;
      clientToLink.email = email;
      clientToLink.user = savedUser;
      clientToLink.invitationTokenHash = null;
      clientToLink.invitationExpiresAt = null;
      await manager.save(Client, clientToLink);

      return savedUser;
    });

    return {
      access_token: this.jwtService.sign({
        sub: savedUser.id,
        email: savedUser.email,
        name: savedUser.name,
        role: savedUser.role,
      }),
    };
  }

  getCurrentUser(id: number) {
    return this.usersService.findProfile(id);
  }

  updateCurrentUser(id: number, profileData: UpdateProfileDto) {
    return this.usersService.updateProfile(id, profileData);
  }

  updateActiveCenter(id: number, centerId: number) {
    return this.usersService.updateActiveCenter(id, centerId);
  }

  private async resolveInvitedClient(invitationToken: string): Promise<Client> {
    const client = await this.clientsRepository.findOne({
      relations: {
        user: true,
        center: true,
      },
      where: {
        invitationTokenHash: hashClientInvitationToken(invitationToken),
      },
    });

    if (!client) throw new BadRequestException('Invitacion no valida');

    if (
      !client.invitationExpiresAt ||
      client.invitationExpiresAt.getTime() <= Date.now()
    )
      throw new BadRequestException('Invitacion caducada');

    return client;
  }
}
