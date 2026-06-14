import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
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
import { AppointmentRequestsService } from './appointment-requests.service';
import { ResolveAppointmentRequestDto } from './dto/resolve-appointment-request.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.GESTOR)
@Controller('appointment-requests')
@ApiTags('Solicitudes de cita')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido.' })
@ApiForbiddenResponse({ description: 'Acceso permitido solo a ADMIN o GESTOR.' })
export class AppointmentRequestsController {
  constructor(
    private readonly appointmentRequestsService: AppointmentRequestsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar solicitudes de cita pendientes',
    description:
      'Devuelve las solicitudes pendientes de los centros del gestor, con la ' +
      'prioridad del cliente. Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiQuery({ name: 'centerId', required: false, type: Number, description: 'Filtra por centro.' })
  @ApiOkResponse({ description: 'Listado de solicitudes pendientes.' })
  findPending(
    @Req() request: { user: { id: number; role: UserRole } },
    @Query('centerId') centerId?: string,
  ) {
    return this.appointmentRequestsService.findPending(
      request.user,
      this.parseOptionalId(centerId, 'El centro no es valido'),
    );
  }

  @Patch(':id/resolve')
  @ApiOperation({
    summary: 'Resolver una solicitud de cita',
    description:
      'APPROVE crea la cita (permitida fuera de horario); REJECT la descarta. ' +
      'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador de la solicitud.' })
  @ApiOkResponse({ description: 'Solicitud resuelta correctamente.' })
  @ApiBadRequestResponse({ description: 'La solicitud ya estaba resuelta o el horario no es válido.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el centro de la solicitud.' })
  @ApiNotFoundResponse({ description: 'Solicitud no encontrada.' })
  resolve(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
    @Body() resolveData: ResolveAppointmentRequestDto,
  ) {
    return this.appointmentRequestsService.resolve(
      id,
      resolveData,
      request.user,
    );
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
