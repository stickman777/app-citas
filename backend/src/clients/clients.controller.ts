import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/user.entity';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.GESTOR)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  findAll() {
    return this.clientsService.findAll();
  }

  @Post()
  create(@Body() clientData: CreateClientDto) {
    return this.clientsService.create(clientData);
  }
}
