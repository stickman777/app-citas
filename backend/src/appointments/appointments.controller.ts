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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/user.entity';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.GESTOR)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // Endpoint para obtener todas las citas, con opción de filtrar por fecha
  @Get()
  findAll(
    @Req() request: { user: { id: number; role: UserRole } },
    @Query('date') date?: string,
    @Query('centerId') centerId?: string,
  ) {
    if (date !== undefined) {
      if (!date) throw new BadRequestException('Debe indicar una fecha');

      this.validateDateQuery(date);
    }
    return this.appointmentsService.findAll(
      request.user,
      date,
      this.parseCenterId(centerId),
    );
  }

  // Endpoint para obtener los horarios disponibles para un servicio en una fecha determinada
  @Get('available-slots')
  findAvailableSlots(
    @Req() request: { user: { id: number; role: UserRole } },
    @Query('date') date: string,
    @Query('serviceId', ParseIntPipe)
    serviceId: number,
  ) {
    if (!date)
      throw new BadRequestException('Debe indicar una fecha');

    this.validateDateQuery(date);

    return this.appointmentsService.findAvailableSlots(
      date,
      serviceId,
      request.user,
    );
  }

  // Endpoint para crear una nueva cita
  @Post()
  create(
    @Req() request: { user: { id: number; role: UserRole } },
    @Body()
    appointmentData: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(appointmentData, request.user);
  }

  // Endpoint para actualizar una cita existente por su ID
  @Patch(':id')
  update(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
    @Body() appointmentData: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(id, appointmentData, request.user);
  }

  // Endpoint para eliminar una cita existente por su ID
  @Delete(':id')
  remove(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.appointmentsService.remove(id, request.user);
  }

  // Endpoint para cancelar una cita existente
  @Patch(':id/cancel')
  cancel(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.appointmentsService.cancel(id, request.user);
  }

  // Endpoint para marcar una cita como completada
  @Patch(':id/complete')
  complete(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.appointmentsService.complete(id, request.user);
  }

  // Endpoint para reprogramar una cita existente
  @Patch(':id/reschedule')
  reschedule(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
    @Body() appointmentData: RescheduleAppointmentDto,
  ) {
    return this.appointmentsService.reschedule(
      id,
      appointmentData,
      request.user,
    );
  }

  // Validación del formato de fecha
  private validateDateQuery(date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      throw new BadRequestException('La fecha debe tener formato YYYY-MM-DD');

    const [year, month, day] = date.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);

    if (
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() !== month - 1 ||
      parsedDate.getDate() !== day
    )
      throw new BadRequestException('Fecha no válida');
  }

  private parseCenterId(centerId?: string): number | undefined {
    if (centerId === undefined) return undefined;

    const parsedCenterId = Number(centerId);

    if (!Number.isInteger(parsedCenterId) || parsedCenterId < 1)
      throw new BadRequestException('El centro no es valido');

    return parsedCenterId;
  }
}
