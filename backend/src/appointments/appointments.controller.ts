import { Body, Controller, Get, Post, UseGuards, Param, Patch, ParseIntPipe, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/user.entity';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.GESTOR)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // Endpoint para obtener todas las citas, con opción de filtrar por fecha
  @Get()
  findAll(@Query('date') date?: string) {
    return this.appointmentsService.findAll(date);
  }

  // Endpoint para crear una nueva cita
  @Post()
  create(
    @Body()
    appointmentData: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(appointmentData);
  }

  // Endpoint para cancelar una cita existente
  @Patch(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.cancel(id);
  }

  // Endpoint para marcar una cita como completada
  @Patch(':id/complete')
  complete(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.complete(id);
  }
}
