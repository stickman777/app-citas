import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from './user.entity';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';


@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.GESTOR)
@Controller('users')
@ApiTags('Usuarios')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido.' })
@ApiForbiddenResponse({ description: 'Acceso permitido solo a ADMIN o GESTOR.' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Endpoint para obtener todos los usuarios
  @Get()
  @ApiOperation({
    summary: 'Listar usuarios gestionables',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiOkResponse({ description: 'Listado de usuarios sin contraseña.' })
  findAll(@Req() request: { user: { id: number; role: UserRole } }) {
    return this.usersService.findAll(request.user);
  }

  // Endpoint para crear un nuevo usuario
  @Post()
  @ApiOperation({
    summary: 'Crear usuario',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiCreatedResponse({ description: 'Usuario creado correctamente.' })
  @ApiBadRequestResponse({ description: 'Datos no válidos, email duplicado o reglas de rol incumplidas.' })
  create(
    @Body() userData: CreateUserDto,
    @Req() request: { user: { id: number; role: UserRole } },
  ) {
    return this.usersService.create(userData, request.user);
  }

  // Endpoint para actualizar un usuario por su ID
  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar usuario',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador del usuario.' })
  @ApiOkResponse({ description: 'Usuario actualizado correctamente.' })
  @ApiBadRequestResponse({ description: 'Datos no válidos o email duplicado.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el usuario o asignar esos centros.' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado.' })
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
  @ApiOperation({
    summary: 'Eliminar usuario',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador del usuario.' })
  @ApiOkResponse({ description: 'Usuario eliminado correctamente.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el usuario indicado.' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado.' })
  remove(
    @Param('id', ParseIntPipe)
    id: number,
    @Req() request: { user: { id: number; role: UserRole } },
  ) {
    return this.usersService.remove(id, request.user);
  }
}
