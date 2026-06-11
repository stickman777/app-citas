import {
  BadRequestException,
  Body,
  Controller,
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
import { CreateServiceDto } from './dto/create-service.dto';
import { ServicesService } from './services.service';
import { UpdateServiceDto } from './dto/update-service.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.GESTOR)
@Controller('services')
@ApiTags('Servicios')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido.' })
@ApiForbiddenResponse({ description: 'Acceso permitido solo a ADMIN o GESTOR.' })
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // Endpoint para obtener todos los servicios activos
  @Get()
  @ApiOperation({
    summary: 'Listar servicios activos',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiQuery({ name: 'centerId', required: false, type: Number, description: 'Filtra por centro.' })
  @ApiOkResponse({ description: 'Listado de servicios activos.' })
  @ApiBadRequestResponse({ description: 'Centro no válido.' })
  findAll(@Req() request, @Query('centerId') centerId?: string) {
    return this.servicesService.findAll(
      request.user,
      this.parseCenterId(centerId),
    );
  }

  // Endpoint para obtener todos los servicios, incluyendo los inactivos
  @Get('all')
  @ApiOperation({
    summary: 'Listar todos los servicios',
    description: 'Incluye servicios activos e inactivos. Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiQuery({ name: 'centerId', required: false, type: Number, description: 'Filtra por centro.' })
  @ApiOkResponse({ description: 'Listado de servicios.' })
  @ApiBadRequestResponse({ description: 'Centro no válido.' })
  findAllIncludingInactive(@Req() request, @Query('centerId') centerId?: string) {
    return this.servicesService.findAllIncludingInactive(
      request.user,
      this.parseCenterId(centerId),
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar servicio',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador del servicio.' })
  @ApiOkResponse({ description: 'Servicio encontrado.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el servicio indicado.' })
  @ApiNotFoundResponse({ description: 'Servicio no encontrado.' })
  findOne(@Req() request, @Param('id', ParseIntPipe) id: number) {
    return this.servicesService.findOne(id, request.user);
  }

  // Endpoint para crear un nuevo servicio
  @Post()
  @ApiOperation({
    summary: 'Crear servicio',
    description: 'Crea un servicio asociado a un centro y especialista. Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiCreatedResponse({ description: 'Servicio creado correctamente.' })
  @ApiBadRequestResponse({ description: 'Datos no válidos, centro requerido o especialista incompatible.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el centro indicado.' })
  @ApiNotFoundResponse({ description: 'Especialista no encontrado.' })
  create(@Req() request, @Body() serviceData: CreateServiceDto) {
    return this.servicesService.create(serviceData, request.user);
  }

  // Endpoint para actualizar un servicio por su ID
  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar servicio',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador del servicio.' })
  @ApiOkResponse({ description: 'Servicio actualizado correctamente.' })
  @ApiBadRequestResponse({ description: 'Datos no válidos o especialista incompatible.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el servicio indicado.' })
  @ApiNotFoundResponse({ description: 'Servicio o especialista no encontrado.' })
  update(
    @Req() request,
    @Param('id', ParseIntPipe) id: number,
    @Body() serviceData: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, serviceData, request.user);
  }

  // Endpoint para activar un servicio por su ID
  @Patch(':id/activate')
  @ApiOperation({
    summary: 'Activar servicio',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador del servicio.' })
  @ApiOkResponse({ description: 'Servicio activado correctamente.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el servicio indicado.' })
  @ApiNotFoundResponse({ description: 'Servicio no encontrado.' })
  activate(
    @Req() request,
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.servicesService.activate(id, request.user);
  }

  // Endpoint para desactivar un servicio por su ID
  @Patch(':id/deactivate')
  @ApiOperation({
    summary: 'Desactivar servicio',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador del servicio.' })
  @ApiOkResponse({ description: 'Servicio desactivado correctamente.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el servicio indicado.' })
  @ApiNotFoundResponse({ description: 'Servicio no encontrado.' })
  deactivate(@Req() request, @Param('id', ParseIntPipe) id: number) {
    return this.servicesService.deactivate(id, request.user);
  }

  private parseCenterId(centerId?: string): number | undefined {
    if (centerId === undefined) return undefined;

    const parsedCenterId = Number(centerId);

    if (!Number.isInteger(parsedCenterId) || parsedCenterId < 1)
      throw new BadRequestException('El centro no es valido');

    return parsedCenterId;
  }
}
