import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Para proteger esta ruta, se usa el JwtAuthGuard, que verifica el JWT en la cabecera Authorization
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  // Endpoint para obtener todos los usuarios
  @Get()
  findAll() {
    return this.usersService.findAll();
  }
  // Endpoint para crear un nuevo usuario (registro) - se espera un JSON con email, password y rol
  @Post()
  create(@Body() userData: Partial<User>) {
    return this.usersService.create(userData);
  }
}
