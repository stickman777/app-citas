import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
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
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // Endpoint para obtener todos los servicios disponibles
  @Get()
  findAll() {
    return this.servicesService.findAll();
  }

  // Endpoint para crear un nuevo servicio
  @Post()
  create(@Body() serviceData: CreateServiceDto) {
    return this.servicesService.create(serviceData);
  }

  // Endpoint para actualizar un servicio por su ID
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() serviceData: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, serviceData);
  }

  // Endpoint para desactivar un servicio por su ID
  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.deactivate(id);
  }
}
