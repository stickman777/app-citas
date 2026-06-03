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
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  // Endpoint para obtener todos los clientes activos
  @Get()
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
  create(
    @Req() request: { user: { id: number; role: UserRole } },
    @Body() clientData: CreateClientDto,
  ) {
    return this.clientsService.create(clientData, request.user);
  }

  // Endpoint para actualizar un cliente existente por su ID
  @Patch(':id')
  update(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
    @Body() clientData: UpdateClientDto,
  ) {
    return this.clientsService.update(id, clientData, request.user);
  }

  @Post(':id/invitation')
  createInvitation(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.clientsService.createInvitation(id, request.user);
  }

  // Endpoint para activar un cliente por su ID
  @Patch(':id/activate')
  activate(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.clientsService.activate(id, request.user);
  }

  // Endpoint para desactivar un cliente por su ID
  @Patch(':id/deactivate')
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
