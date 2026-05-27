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
  findAll(@Query('centerId') centerId?: string) {
    return this.clientsService.findAll(this.parseCenterId(centerId));
  }

  // Endpoint para obtener todos los clientes, incluyendo los inactivos
  @Get('all')
  findAllIncludingInactive(@Query('centerId') centerId?: string) {
    return this.clientsService.findAllIncludingInactive(
      this.parseCenterId(centerId),
    );
  }

  // Endpoint para crear un nuevo cliente
  @Post()
  create(@Body() clientData: CreateClientDto) {
    return this.clientsService.create(clientData);
  }

  // Endpoint para actualizar un cliente existente por su ID
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() clientData: UpdateClientDto,
  ) {
    return this.clientsService.update(id, clientData);
  }

  // Endpoint para activar un cliente por su ID
  @Patch(':id/activate')
  activate(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.clientsService.activate(id);
  }

  // Endpoint para desactivar un cliente por su ID
  @Patch(':id/deactivate')
  deactivate(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.clientsService.deactivate(id);
  }

  private parseCenterId(centerId?: string): number | undefined {
    if (centerId === undefined) return undefined;

    const parsedCenterId = Number(centerId);

    if (!Number.isInteger(parsedCenterId) || parsedCenterId < 1)
      throw new BadRequestException('El centro no es valido');

    return parsedCenterId;
  }
}
