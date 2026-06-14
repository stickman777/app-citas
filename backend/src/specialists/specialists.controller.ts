import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/user.entity';
import { CreateSpecialistDto } from './dto/create-specialist.dto';
import { CreateSpecialistAbsenceDto } from './dto/create-specialist-absence.dto';
import { UpdateSpecialistDto } from './dto/update-specialist.dto';
import { SpecialistsService } from './specialists.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.GESTOR)
@Controller('specialists')
@ApiTags('Especialistas')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido.' })
@ApiForbiddenResponse({ description: 'Acceso permitido solo a ADMIN o GESTOR.' })
export class SpecialistsController {
  constructor(private readonly specialistsService: SpecialistsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar especialistas activos',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiQuery({ name: 'centerId', required: false, type: Number, description: 'Filtra por centro.' })
  @ApiOkResponse({ description: 'Listado de especialistas activos.' })
  @ApiBadRequestResponse({ description: 'Centro no válido.' })
  findAll(
    @Req() request: { user: { id: number; role: UserRole } },
    @Query('centerId') centerId?: string,
  ) {
    return this.specialistsService.findAll(
      request.user,
      this.parseCenterId(centerId),
    );
  }

  @Get('all')
  @ApiOperation({
    summary: 'Listar todos los especialistas',
    description: 'Incluye especialistas activos e inactivos. Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiQuery({ name: 'centerId', required: false, type: Number, description: 'Filtra por centro.' })
  @ApiOkResponse({ description: 'Listado de especialistas.' })
  @ApiBadRequestResponse({ description: 'Centro no válido.' })
  findAllIncludingInactive(
    @Req() request: { user: { id: number; role: UserRole } },
    @Query('centerId') centerId?: string,
  ) {
    return this.specialistsService.findAllIncludingInactive(
      request.user,
      this.parseCenterId(centerId),
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar especialista',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador del especialista.' })
  @ApiOkResponse({ description: 'Especialista encontrado.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el especialista indicado.' })
  @ApiNotFoundResponse({ description: 'Especialista no encontrado.' })
  findOne(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.specialistsService.findOne(id, request.user);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear especialista',
    description: 'Crea un especialista asociado a un centro. Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiCreatedResponse({ description: 'Especialista creado correctamente.' })
  @ApiBadRequestResponse({ description: 'Datos no válidos o centro requerido.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el centro indicado.' })
  create(
    @Req() request: { user: { id: number; role: UserRole } },
    @Body() specialistData: CreateSpecialistDto,
  ) {
    return this.specialistsService.create(specialistData, request.user);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar especialista',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador del especialista.' })
  @ApiOkResponse({ description: 'Especialista actualizado correctamente.' })
  @ApiBadRequestResponse({ description: 'Datos no válidos o centro requerido.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el especialista indicado.' })
  @ApiNotFoundResponse({ description: 'Especialista no encontrado.' })
  update(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
    @Body() specialistData: UpdateSpecialistDto,
  ) {
    return this.specialistsService.update(id, specialistData, request.user);
  }

  @Patch(':id/activate')
  @ApiOperation({
    summary: 'Activar especialista',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador del especialista.' })
  @ApiOkResponse({ description: 'Especialista activado correctamente.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el especialista indicado.' })
  @ApiNotFoundResponse({ description: 'Especialista no encontrado.' })
  activate(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.specialistsService.activate(id, request.user);
  }

  @Patch(':id/deactivate')
  @ApiOperation({
    summary: 'Desactivar especialista',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador del especialista.' })
  @ApiOkResponse({ description: 'Especialista desactivado correctamente.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el especialista indicado.' })
  @ApiNotFoundResponse({ description: 'Especialista no encontrado.' })
  deactivate(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.specialistsService.deactivate(id, request.user);
  }

  @Get(':id/absences')
  @ApiOperation({
    summary: 'Listar ausencias del especialista',
    description: 'Periodos en los que el especialista no puede recibir citas. Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador del especialista.' })
  @ApiOkResponse({ description: 'Listado de ausencias.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el especialista indicado.' })
  @ApiNotFoundResponse({ description: 'Especialista no encontrado.' })
  listAbsences(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.specialistsService.listAbsences(id, request.user);
  }

  @Post(':id/absences')
  @ApiOperation({
    summary: 'Crear ausencia del especialista',
    description: 'Bloquea el agendado de citas en el rango de fechas. Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador del especialista.' })
  @ApiCreatedResponse({ description: 'Ausencia creada correctamente.' })
  @ApiBadRequestResponse({ description: 'Fechas no válidas.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el especialista indicado.' })
  @ApiNotFoundResponse({ description: 'Especialista no encontrado.' })
  createAbsence(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
    @Body() absenceData: CreateSpecialistAbsenceDto,
  ) {
    return this.specialistsService.createAbsence(id, absenceData, request.user);
  }

  @Delete('absences/:absenceId')
  @ApiOperation({
    summary: 'Eliminar ausencia del especialista',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'absenceId', type: Number, description: 'Identificador de la ausencia.' })
  @ApiOkResponse({ description: 'Ausencia eliminada correctamente.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el centro de la ausencia.' })
  @ApiNotFoundResponse({ description: 'Ausencia no encontrada.' })
  removeAbsence(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('absenceId', ParseIntPipe) absenceId: number,
  ) {
    return this.specialistsService.removeAbsence(absenceId, request.user);
  }

  private parseCenterId(centerId?: string): number | undefined {
    if (centerId === undefined) return undefined;

    const parsedCenterId = Number(centerId);

    if (!Number.isInteger(parsedCenterId) || parsedCenterId < 1)
      throw new BadRequestException('El centro no es valido');

    return parsedCenterId;
  }
}
