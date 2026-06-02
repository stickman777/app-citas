import {
  BadRequestException,
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/user.entity';
import { ClientPortalService } from './client-portal.service';
import { CreateClientPortalAppointmentDto } from './dto/create-client-portal-appointment.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CLIENT)
@Controller('client-portal')
export class ClientPortalController {
  constructor(private readonly clientPortalService: ClientPortalService) {}

  @Get('me')
  me(@Req() request: { user: { id: number } }) {
    return this.clientPortalService.getProfile(request.user.id);
  }

  @Get('appointments')
  appointments(@Req() request: { user: { id: number } }) {
    return this.clientPortalService.getAppointments(request.user.id);
  }

  @Get('services')
  services(@Req() request: { user: { id: number } }) {
    return this.clientPortalService.getServices(request.user.id);
  }

  @Get('specialists')
  specialists(
    @Req() request: { user: { id: number } },
    @Query('serviceId') serviceId?: string,
  ) {
    return this.clientPortalService.getSpecialists(
      request.user.id,
      this.parseOptionalId(serviceId, 'El servicio no es valido'),
    );
  }

  @Get('available-slots')
  availableSlots(
    @Req() request: { user: { id: number } },
    @Query('date') date: string,
    @Query('serviceId', ParseIntPipe) serviceId: number,
    @Query('specialistId', ParseIntPipe) specialistId: number,
  ) {
    if (!date) throw new BadRequestException('Debe indicar una fecha');

    this.validateDateQuery(date);

    return this.clientPortalService.getAvailableSlots(
      request.user.id,
      date,
      serviceId,
      specialistId,
    );
  }

  @Post('appointments')
  createAppointment(
    @Req() request: { user: { id: number } },
    @Body() appointmentData: CreateClientPortalAppointmentDto,
  ) {
    return this.clientPortalService.createAppointment(
      request.user.id,
      appointmentData,
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
      throw new BadRequestException('Fecha no valida');
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
