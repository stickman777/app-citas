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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
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
@ApiTags('Citas')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido.' })
@ApiForbiddenResponse({ description: 'Acceso permitido solo a ADMIN o GESTOR.' })
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar citas',
    description: 'Permite filtrar por fecha y centro. Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiQuery({ name: 'date', required: false, type: String, example: '2026-06-15', description: 'Fecha en formato YYYY-MM-DD.' })
  @ApiQuery({ name: 'centerId', required: false, type: Number, description: 'Filtra por centro.' })
  @ApiOkResponse({ description: 'Listado de citas ordenado por fecha.' })
  @ApiBadRequestResponse({ description: 'Fecha o centro no válido.' })
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
  @ApiOperation({
    summary: 'Consultar huecos disponibles',
    description: 'Calcula horas disponibles para una fecha, servicio y especialista. Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiQuery({ name: 'date', required: true, type: String, example: '2026-06-15', description: 'Fecha en formato YYYY-MM-DD.' })
  @ApiQuery({ name: 'serviceId', required: true, type: Number, description: 'Identificador del servicio.' })
  @ApiQuery({ name: 'specialistId', required: true, type: Number, description: 'Identificador del especialista.' })
  @ApiOkResponse({ description: 'Listado de horas disponibles en formato HH:mm.' })
  @ApiBadRequestResponse({ description: 'Fecha inválida o selección no disponible.' })
  @ApiNotFoundResponse({ description: 'Servicio o especialista no encontrado.' })
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
  @ApiOperation({
    summary: 'Crear cita',
    description: 'Valida cliente, servicio, especialista, centro, solapamientos y disponibilidad. Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiCreatedResponse({ description: 'Cita creada correctamente.' })
  @ApiBadRequestResponse({ description: 'Datos no válidos, cita fuera de horario, solape o entidades incompatibles.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el centro de la cita.' })
  @ApiNotFoundResponse({ description: 'Cliente, servicio o especialista no encontrado.' })
  create(
    @Req() request: { user: { id: number; role: UserRole } },
    @Body()
    appointmentData: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(appointmentData, request.user);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar cita',
    description: 'Permite modificar datos de una cita existente. Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador de la cita.' })
  @ApiOkResponse({ description: 'Cita actualizada correctamente.' })
  @ApiBadRequestResponse({ description: 'Datos no válidos, solape, fuera de horario o estado no válido.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el centro de la cita.' })
  @ApiNotFoundResponse({ description: 'Cita o entidad relacionada no encontrada.' })
  update(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
    @Body() appointmentData: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(id, appointmentData, request.user);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar cita',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador de la cita.' })
  @ApiOkResponse({ description: 'Cita eliminada correctamente.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el centro de la cita.' })
  @ApiNotFoundResponse({ description: 'Cita no encontrada.' })
  remove(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.appointmentsService.remove(id, request.user);
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancelar cita',
    description: 'Solo se pueden cancelar citas programadas. Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador de la cita.' })
  @ApiOkResponse({ description: 'Cita cancelada correctamente.' })
  @ApiBadRequestResponse({ description: 'La cita no está programada.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el centro de la cita.' })
  @ApiNotFoundResponse({ description: 'Cita no encontrada.' })
  cancel(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.appointmentsService.cancel(id, request.user);
  }

  @Patch(':id/complete')
  @ApiOperation({
    summary: 'Completar cita',
    description: 'Solo se pueden completar citas programadas. Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador de la cita.' })
  @ApiOkResponse({ description: 'Cita completada correctamente.' })
  @ApiBadRequestResponse({ description: 'La cita no está programada.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el centro de la cita.' })
  @ApiNotFoundResponse({ description: 'Cita no encontrada.' })
  complete(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.appointmentsService.complete(id, request.user);
  }

  @Patch(':id/reschedule')
  @ApiOperation({
    summary: 'Reprogramar cita',
    description: 'Solo se pueden reprogramar citas programadas. Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador de la cita.' })
  @ApiOkResponse({ description: 'Cita reprogramada correctamente.' })
  @ApiBadRequestResponse({ description: 'La cita no está programada, el horario no está disponible o el servicio está inactivo.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el centro de la cita.' })
  @ApiNotFoundResponse({ description: 'Cita no encontrada.' })
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
