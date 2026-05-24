import { Body, Controller, Get, Post, UseGuards, Param, ParseIntPipe, Delete, Patch, } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/user.entity';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.GESTOR)
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // Endpoint obtener todas las franjas de disponibilidad
  @Get()
  findAll() {
    return this.availabilityService.findAll();
  }

  // Endpoint para obtener franjas de disponibilidad de un día
  @Get('day/:dayOfWeek')
  findByDay(
    @Param('dayOfWeek', ParseIntPipe)
    dayOfWeek: number,
  ) {
    return this.availabilityService.findByDay(dayOfWeek);
  }

  // Endpoint crear nueva disponibilidad
  @Post()
  create(
    @Body()
    availabilityData: CreateAvailabilityDto,
  ) {
    return this.availabilityService.create(availabilityData);
  }

  // Endpoint eliminar una franja de disponibilidad por su ID
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.availabilityService.remove(id);
  }

  // Endpoint actualizar una franja de disponibilidad por su ID
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() availabilityData: UpdateAvailabilityDto,
  ) {
    return this.availabilityService.update(id, availabilityData);
  }
}
