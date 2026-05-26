import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from './user.entity';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';


@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.GESTOR)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Endpoint para obtener todos los usuarios
  @Get()
  findAll(@Req() request: { user: { id: number; role: UserRole } }) {
    return this.usersService.findAll(request.user);
  }

  // Endpoint para crear un nuevo usuario
  @Post()
  create(
    @Body() userData: CreateUserDto,
    @Req() request: { user: { id: number; role: UserRole } },
  ) {
    return this.usersService.create(userData, request.user);
  }

  // Endpoint para actualizar un usuario por su ID
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe)
    id: number,
    @Body()
    userData: UpdateUserDto,
    @Req() request: { user: { id: number; role: UserRole } },
  ) {
    return this.usersService.update(id, userData, request.user);
  }

  // Endpoint para eliminar un usuario por su ID
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe)
    id: number,
    @Req() request: { user: { id: number; role: UserRole } },
  ) {
    return this.usersService.remove(id, request.user);
  }
}
