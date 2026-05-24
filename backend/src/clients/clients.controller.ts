import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
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

  // Endpoint para obtener todos los clientes
  @Get()
  findAll() {
    return this.clientsService.findAll();
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

  // Endpoint para eliminar un cliente por su ID, verificando que no tenga citas asociadas
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.clientsService.remove(id);
  }
}
