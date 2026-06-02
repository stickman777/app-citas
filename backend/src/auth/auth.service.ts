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
    const phone = registerData.phone.trim();
    const name = registerData.name.trim();

    if (!name) throw new BadRequestException('Nombre requerido');

    const existingUser = await this.usersRepository.findOne({
      where: {
        email: ILike(email),
      },
    });

    if (existingUser)
      throw new BadRequestException('Ya existe un usuario con ese email');

    const client = await this.resolveRegisterClient(email, phone, name);
    const hashedPassword = await bcrypt.hash(registerData.password, 10);

    const savedUser = await this.dataSource.transaction(async (manager) => {
      const clientToLink = client.id
        ? client
        : await manager.save(Client, client);

      if (clientToLink.user)
        throw new BadRequestException(
          'La ficha de cliente ya tiene una cuenta vinculada',
        );

      const user = manager.create(User, {
        email,
        name,
        password: hashedPassword,
        role: UserRole.CLIENT,
        centers: clientToLink.center ? [clientToLink.center] : [],
        activeCenter: clientToLink.center ?? null,
      });
      const savedUser = await manager.save(User, user);

      clientToLink.user = savedUser;
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

  private async resolveRegisterClient(
    email: string,
    phone: string,
    name: string,
  ): Promise<Client> {
    const matchingClients = await this.clientsRepository.find({
      relations: {
        user: true,
      },
      where: {
        email: ILike(email),
        phone,
      },
    });

    if (matchingClients.length > 1)
      throw new BadRequestException(
        'Hay mas de una ficha de cliente con esos datos',
      );

    const [matchingClient] = matchingClients;

    if (matchingClient) return matchingClient;

    return this.clientsRepository.create({
      name,
      email,
      phone,
    });
  }
}
