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
      this.parseOptionalId(centerId, 'El centro no es valido'),
    );
  }

  @Get('available-slots')
  findAvailableSlots(
    @Req() request: { user: { id: number; role: UserRole } },
    @Query('date') date: string,
    @Query('serviceId', ParseIntPipe)
    serviceId: number,
    @Query('specialistId', ParseIntPipe)
    specialistId: number,
  ) {
    if (!date)
      throw new BadRequestException('Debe indicar una fecha');

    this.validateDateQuery(date);

    return this.appointmentsService.findAvailableSlots(
      date,
      serviceId,
      specialistId,
      request.user,
    );
  }

  @Post()
  create(
    @Req() request: { user: { id: number; role: UserRole } },
    @Body()
    appointmentData: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(appointmentData, request.user);
  }

  @Patch(':id')
  update(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
    @Body() appointmentData: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(id, appointmentData, request.user);
  }

  @Delete(':id')
  remove(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.appointmentsService.remove(id, request.user);
  }

  @Patch(':id/cancel')
  cancel(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.appointmentsService.cancel(id, request.user);
  }

  @Patch(':id/complete')
  complete(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.appointmentsService.complete(id, request.user);
  }

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

  private parseOptionalId(
    value: string | undefined,
    invalidMessage: string,
  ): number | undefined {
    if (value === undefined) return undefined;

    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue) || parsedValue < 1)
      throw new BadRequestException(invalidMessage);

    return parsedValue;
  }
}
