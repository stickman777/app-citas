import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/user.entity';
import { CentersService } from './centers.service';
import { CreateCenterDto } from './dto/create-center.dto';
import { UpdateCenterDto } from './dto/update-center.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.GESTOR)
@Controller('centers')
@ApiTags('Centros')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido.' })
export class CentersController {
  constructor(private readonly centersService: CentersService) {}

  @Roles(UserRole.ADMIN, UserRole.GESTOR, UserRole.CLIENT)
  @Get()
  @ApiOperation({
    summary: 'Listar centros activos',
    description: 'Roles permitidos: ADMIN, GESTOR y CLIENT.',
  })
  @ApiOkResponse({ description: 'Listado de centros activos con horario.' })
  @ApiForbiddenResponse({ description: 'Rol no permitido.' })
  findAll(@Req() request: { user: { id: number; role: UserRole } }) {
    return this.centersService.findAll(request.user);
  }

  @Get('all')
  @ApiOperation({
    summary: 'Listar todos los centros',
    description: 'Incluye centros activos e inactivos. Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiOkResponse({ description: 'Listado de centros con horario.' })
  @ApiForbiddenResponse({ description: 'Acceso permitido solo a ADMIN o GESTOR.' })
  findAllIncludingInactive(
    @Req() request: { user: { id: number; role: UserRole } },
  ) {
    return this.centersService.findAllIncludingInactive(request.user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar centro',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador del centro.' })
  @ApiOkResponse({ description: 'Centro encontrado con horario.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el centro indicado.' })
  @ApiNotFoundResponse({ description: 'Centro no encontrado.' })
  findOne(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.centersService.findOne(id, request.user);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear centro',
    description: 'Crea un centro y su horario base. Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiCreatedResponse({ description: 'Centro creado correctamente.' })
  @ApiBadRequestResponse({ description: 'Datos u horario no válidos.' })
  @ApiForbiddenResponse({ description: 'Acceso permitido solo a ADMIN o GESTOR.' })
  create(
    @Req() request: { user: { id: number; role: UserRole } },
    @Body() centerData: CreateCenterDto,
  ) {
    return this.centersService.create(centerData, request.user);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar centro',
    description: 'Permite actualizar los datos del centro y opcionalmente su horario. Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador del centro.' })
  @ApiOkResponse({ description: 'Centro actualizado correctamente.' })
  @ApiBadRequestResponse({ description: 'Datos u horario no válidos.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el centro indicado.' })
  @ApiNotFoundResponse({ description: 'Centro no encontrado.' })
  update(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
    @Body() centerData: UpdateCenterDto,
  ) {
    return this.centersService.update(id, centerData, request.user);
  }

  @Patch(':id/activate')
  @ApiOperation({
    summary: 'Activar centro',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador del centro.' })
  @ApiOkResponse({ description: 'Centro activado correctamente.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el centro indicado.' })
  @ApiNotFoundResponse({ description: 'Centro no encontrado.' })
  activate(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.centersService.activate(id, request.user);
  }

  @Patch(':id/deactivate')
  @ApiOperation({
    summary: 'Desactivar centro',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador del centro.' })
  @ApiOkResponse({ description: 'Centro desactivado correctamente.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el centro indicado.' })
  @ApiNotFoundResponse({ description: 'Centro no encontrado.' })
  deactivate(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.centersService.deactivate(id, request.user);
  }
}
