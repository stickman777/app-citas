import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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

  getCurrentUser(id: number) {
    return this.usersService.findProfile(id);
  }

  updateCurrentUser(id: number, profileData: UpdateProfileDto) {
    return this.usersService.updateProfile(id, profileData);
  }
}
