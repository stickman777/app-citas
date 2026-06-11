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
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.GESTOR)
@Controller('clients')
@ApiTags('Clientes')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido.' })
@ApiForbiddenResponse({ description: 'Acceso permitido solo a ADMIN o GESTOR.' })
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  // Endpoint para obtener todos los clientes activos
  @Get()
  @ApiOperation({
    summary: 'Listar clientes activos',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiQuery({ name: 'centerId', required: false, type: Number, description: 'Filtra por centro.' })
  @ApiOkResponse({ description: 'Listado de clientes activos.' })
  @ApiBadRequestResponse({ description: 'Centro no válido.' })
  findAll(
    @Req() request: { user: { id: number; role: UserRole } },
    @Query('centerId') centerId?: string,
  ) {
    return this.clientsService.findAll(
      request.user,
      this.parseCenterId(centerId),
    );
  }

  // Endpoint para obtener todos los clientes, incluyendo los inactivos
  @Get('all')
  @ApiOperation({
    summary: 'Listar todos los clientes',
    description: 'Incluye clientes activos e inactivos. Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiQuery({ name: 'centerId', required: false, type: Number, description: 'Filtra por centro.' })
  @ApiOkResponse({ description: 'Listado de clientes.' })
  @ApiBadRequestResponse({ description: 'Centro no válido.' })
  findAllIncludingInactive(
    @Req() request: { user: { id: number; role: UserRole } },
    @Query('centerId') centerId?: string,
  ) {
    return this.clientsService.findAllIncludingInactive(
      request.user,
      this.parseCenterId(centerId),
    );
  }

  // Endpoint para crear un nuevo cliente
  @Post()
  @ApiOperation({
    summary: 'Crear cliente',
    description: 'Crea una ficha de cliente asociada a un centro. Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiCreatedResponse({ description: 'Cliente creado correctamente.' })
  @ApiBadRequestResponse({ description: 'Datos no válidos o centro requerido.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el centro indicado.' })
  create(
    @Req() request: { user: { id: number; role: UserRole } },
    @Body() clientData: CreateClientDto,
  ) {
    return this.clientsService.create(clientData, request.user);
  }

  // Endpoint para actualizar un cliente existente por su ID
  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar cliente',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador del cliente.' })
  @ApiOkResponse({ description: 'Cliente actualizado correctamente.' })
  @ApiBadRequestResponse({ description: 'Datos no válidos.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el cliente o centro indicado.' })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado.' })
  update(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
    @Body() clientData: UpdateClientDto,
  ) {
    return this.clientsService.update(id, clientData, request.user);
  }

  @Post(':id/invitation')
  @ApiOperation({
    summary: 'Generar invitación de registro para cliente',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador del cliente.' })
  @ApiCreatedResponse({ description: 'Token temporal de invitación generado.' })
  @ApiBadRequestResponse({ description: 'El cliente ya tiene cuenta o no tiene centro asignado.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el cliente indicado.' })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado.' })
  createInvitation(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.clientsService.createInvitation(id, request.user);
  }

  // Endpoint para activar un cliente por su ID
  @Patch(':id/activate')
  @ApiOperation({
    summary: 'Activar cliente',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador del cliente.' })
  @ApiOkResponse({ description: 'Cliente activado correctamente.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el cliente indicado.' })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado.' })
  activate(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.clientsService.activate(id, request.user);
  }

  // Endpoint para desactivar un cliente por su ID
  @Patch(':id/deactivate')
  @ApiOperation({
    summary: 'Desactivar cliente',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador del cliente.' })
  @ApiOkResponse({ description: 'Cliente desactivado correctamente.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el cliente indicado.' })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado.' })
  deactivate(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.clientsService.deactivate(id, request.user);
  }

  private parseCenterId(centerId?: string): number | undefined {
    if (centerId === undefined) return undefined;

    const parsedCenterId = Number(centerId);

    if (!Number.isInteger(parsedCenterId) || parsedCenterId < 1)
      throw new BadRequestException('El centro no es valido');

    return parsedCenterId;
  }
}
