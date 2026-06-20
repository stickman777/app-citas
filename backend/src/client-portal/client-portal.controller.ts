import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseIntPipe,
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
import { CreateAppointmentRequestDto } from '../appointment-requests/dto/create-appointment-request.dto';
import { ClientPortalService } from './client-portal.service';
import { CreateClientPortalAppointmentDto } from './dto/create-client-portal-appointment.dto';
import { UpdateClientPortalProfileDto } from './dto/update-client-portal-profile.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CLIENT)
@Controller('client-portal')
@ApiTags('Portal cliente')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido.' })
@ApiForbiddenResponse({ description: 'Acceso permitido solo a CLIENT.' })
export class ClientPortalController {
  constructor(private readonly clientPortalService: ClientPortalService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Consultar perfil de cliente',
    description: 'Rol permitido: CLIENT.',
  })
  @ApiOkResponse({ description: 'Perfil del cliente autenticado.' })
  @ApiForbiddenResponse({ description: 'El cliente no está activo o el rol no está permitido.' })
  @ApiNotFoundResponse({ description: 'No existe cliente vinculado al usuario.' })
  me(@Req() request: { user: { id: number } }) {
    return this.clientPortalService.getProfile(request.user.id);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Actualizar perfil de cliente',
    description: 'Rol permitido: CLIENT.',
  })
  @ApiOkResponse({ description: 'Perfil de cliente actualizado.' })
  @ApiBadRequestResponse({ description: 'Datos no válidos.' })
  @ApiForbiddenResponse({ description: 'El cliente no está activo o el rol no está permitido.' })
  @ApiNotFoundResponse({ description: 'No existe cliente vinculado al usuario.' })
  updateMe(
    @Req() request: { user: { id: number } },
    @Body() profileData: UpdateClientPortalProfileDto,
  ) {
    return this.clientPortalService.updateProfile(request.user.id, profileData);
  }

  @Get('appointments')
  @ApiOperation({
    summary: 'Listar citas del cliente',
    description: 'Rol permitido: CLIENT.',
  })
  @ApiOkResponse({ description: 'Listado de citas propias.' })
  @ApiForbiddenResponse({ description: 'El cliente no está activo o el rol no está permitido.' })
  @ApiNotFoundResponse({ description: 'No existe cliente vinculado al usuario.' })
  appointments(@Req() request: { user: { id: number } }) {
    return this.clientPortalService.getAppointments(request.user.id);
  }

  @Patch('appointments/:id/cancel')
  @ApiOperation({
    summary: 'Cancelar cita propia',
    description: 'Cancela una cita programada del cliente autenticado. Rol permitido: CLIENT.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador de la cita.' })
  @ApiOkResponse({ description: 'Cita cancelada correctamente.' })
  @ApiBadRequestResponse({ description: 'La cita no está programada.' })
  @ApiForbiddenResponse({ description: 'El cliente no está activo o el rol no está permitido.' })
  @ApiNotFoundResponse({ description: 'Cita no encontrada.' })
  cancelAppointment(
    @Req() request: { user: { id: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.clientPortalService.cancelAppointment(request.user.id, id);
  }

  @Get('appointment-requests')
  @ApiOperation({
    summary: 'Listar solicitudes de cita del cliente',
    description: 'Rol permitido: CLIENT.',
  })
  @ApiOkResponse({ description: 'Listado de solicitudes propias.' })
  @ApiForbiddenResponse({ description: 'El cliente no está activo o el rol no está permitido.' })
  @ApiNotFoundResponse({ description: 'No existe cliente vinculado al usuario.' })
  appointmentRequests(@Req() request: { user: { id: number } }) {
    return this.clientPortalService.getAppointmentRequests(request.user.id);
  }

  @Patch('appointment-requests/:id/cancel')
  @ApiOperation({
    summary: 'Cancelar solicitud propia',
    description: 'Cancela una solicitud pendiente del cliente autenticado. Rol permitido: CLIENT.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador de la solicitud.' })
  @ApiOkResponse({ description: 'Solicitud cancelada correctamente.' })
  @ApiBadRequestResponse({ description: 'La solicitud no está pendiente.' })
  @ApiForbiddenResponse({ description: 'El cliente no está activo o el rol no está permitido.' })
  @ApiNotFoundResponse({ description: 'Solicitud no encontrada.' })
  cancelAppointmentRequest(
    @Req() request: { user: { id: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.clientPortalService.cancelAppointmentRequest(
      request.user.id,
      id,
    );
  }

  @Get('services')
  @ApiOperation({
    summary: 'Listar servicios reservables',
    description: 'Devuelve servicios activos del centro del cliente. Rol permitido: CLIENT.',
  })
  @ApiOkResponse({ description: 'Listado de servicios reservables.' })
  @ApiBadRequestResponse({ description: 'La ficha de cliente no tiene centro asignado.' })
  @ApiForbiddenResponse({ description: 'El cliente no está activo o el rol no está permitido.' })
  services(@Req() request: { user: { id: number } }) {
    return this.clientPortalService.getServices(request.user.id);
  }

  @Get('specialists')
  @ApiOperation({
    summary: 'Listar especialistas reservables',
    description: 'Puede filtrarse por servicio. Rol permitido: CLIENT.',
  })
  @ApiQuery({ name: 'serviceId', required: false, type: Number, description: 'Filtra especialistas por servicio.' })
  @ApiOkResponse({ description: 'Listado de especialistas reservables.' })
  @ApiBadRequestResponse({ description: 'Servicio no válido o no disponible.' })
  @ApiForbiddenResponse({ description: 'El cliente no está activo o el rol no está permitido.' })
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
  @ApiOperation({
    summary: 'Consultar huecos disponibles para cliente',
    description: 'Calcula horas disponibles para reservar. Rol permitido: CLIENT.',
  })
  @ApiQuery({ name: 'date', required: true, type: String, example: '2026-06-15', description: 'Fecha en formato YYYY-MM-DD.' })
  @ApiQuery({ name: 'serviceId', required: true, type: Number, description: 'Identificador del servicio.' })
  @ApiQuery({ name: 'specialistId', required: true, type: Number, description: 'Identificador del especialista.' })
  @ApiOkResponse({ description: 'Listado de horas disponibles en formato HH:mm.' })
  @ApiBadRequestResponse({ description: 'Fecha inválida, servicio/especialista no disponible o selección incompatible.' })
  @ApiForbiddenResponse({ description: 'El cliente no está activo o el rol no está permitido.' })
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
  @ApiOperation({
    summary: 'Crear cita como cliente',
    description: 'Crea una cita usando la ficha vinculada al usuario autenticado. Rol permitido: CLIENT.',
  })
  @ApiCreatedResponse({ description: 'Cita creada correctamente.' })
  @ApiBadRequestResponse({ description: 'Datos no válidos, fuera de horario, solape o selección no disponible.' })
  @ApiForbiddenResponse({ description: 'El cliente no está activo o el rol no está permitido.' })
  @ApiNotFoundResponse({ description: 'No existe cliente vinculado al usuario.' })
  createAppointment(
    @Req() request: { user: { id: number } },
    @Body() appointmentData: CreateClientPortalAppointmentDto,
  ) {
    return this.clientPortalService.createAppointment(
      request.user.id,
      appointmentData,
    );
  }

  @Post('appointment-requests')
  @ApiOperation({
    summary: 'Solicitar una cita fuera de horario u ocupada',
    description:
      'Crea una solicitud cuando el horario deseado no es auto-reservable, ' +
      'para que la revise un gestor. Rol permitido: CLIENT.',
  })
  @ApiCreatedResponse({ description: 'Solicitud de cita creada correctamente.' })
  @ApiBadRequestResponse({ description: 'Datos no válidos, horario en el pasado o disponible para reserva directa.' })
  @ApiForbiddenResponse({ description: 'El cliente no está activo o el rol no está permitido.' })
  @ApiNotFoundResponse({ description: 'No existe cliente vinculado al usuario.' })
  createAppointmentRequest(
    @Req() request: { user: { id: number } },
    @Body() requestData: CreateAppointmentRequestDto,
  ) {
    return this.clientPortalService.createAppointmentRequest(
      request.user.id,
      requestData,
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
