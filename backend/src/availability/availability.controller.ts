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
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityExceptionDto } from './dto/create-availability-exception.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityExceptionDto } from './dto/update-availability-exception.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.GESTOR)
@Controller('availability')
@ApiTags('Disponibilidad')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido.' })
@ApiForbiddenResponse({ description: 'Acceso permitido solo a ADMIN o GESTOR.' })
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar disponibilidad semanal',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiQuery({ name: 'centerId', required: false, type: Number, description: 'Filtra por centro.' })
  @ApiOkResponse({ description: 'Listado de franjas de disponibilidad.' })
  @ApiBadRequestResponse({ description: 'Centro no válido.' })
  findAll(
    @Req() request: { user: { id: number; role: UserRole } },
    @Query('centerId') centerId?: string,
  ) {
    return this.availabilityService.findAll(
      request.user,
      this.parseCenterId(centerId),
    );
  }

  @Get('day/:dayOfWeek')
  @ApiOperation({
    summary: 'Listar disponibilidad por día',
    description: 'El día de la semana se indica con valores 0-6. Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'dayOfWeek', type: Number, description: 'Día de la semana entre 0 y 6.' })
  @ApiQuery({ name: 'centerId', required: false, type: Number, description: 'Filtra por centro.' })
  @ApiOkResponse({ description: 'Listado de franjas del día indicado.' })
  @ApiBadRequestResponse({ description: 'Día de la semana o centro no válido.' })
  findByDay(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('dayOfWeek', ParseIntPipe) dayOfWeek: number,
    @Query('centerId') centerId?: string,
  ) {
    if (dayOfWeek < 0 || dayOfWeek > 6)
      throw new BadRequestException(
        'El dia de la semana debe estar entre el Lunes y el Domingo (0-6)',
      );

    return this.availabilityService.findByDay(
      dayOfWeek,
      request.user,
      this.parseCenterId(centerId),
    );
  }

  @Get('exceptions')
  @ApiOperation({
    summary: 'Listar excepciones de disponibilidad',
    description: 'Permite consultar bloqueos o disponibilidad extra. Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiQuery({ name: 'centerId', required: false, type: Number, description: 'Filtra por centro.' })
  @ApiQuery({ name: 'from', required: false, type: String, example: '2026-06-01', description: 'Fecha inicial en formato YYYY-MM-DD.' })
  @ApiQuery({ name: 'to', required: false, type: String, example: '2026-06-30', description: 'Fecha final en formato YYYY-MM-DD.' })
  @ApiOkResponse({ description: 'Listado de excepciones de disponibilidad.' })
  @ApiBadRequestResponse({ description: 'Rango de fechas o centro no válido.' })
  findExceptions(
    @Req() request: { user: { id: number; role: UserRole } },
    @Query('centerId') centerId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.availabilityService.findExceptions(
      request.user,
      this.parseCenterId(centerId),
      from,
      to,
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Crear franja de disponibilidad',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiCreatedResponse({ description: 'Franja creada correctamente.' })
  @ApiBadRequestResponse({ description: 'Datos no válidos, hora inicial posterior a la final o solape.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el centro indicado.' })
  create(
    @Req() request: { user: { id: number; role: UserRole } },
    @Body() availabilityData: CreateAvailabilityDto,
  ) {
    return this.availabilityService.create(availabilityData, request.user);
  }

  @Post('exceptions')
  @ApiOperation({
    summary: 'Crear excepción de disponibilidad',
    description: 'Permite crear bloqueos horarios o disponibilidad extra. Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiCreatedResponse({ description: 'Excepción creada correctamente.' })
  @ApiBadRequestResponse({ description: 'Datos no válidos, fecha inválida o solape.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el centro indicado.' })
  createException(
    @Req() request: { user: { id: number; role: UserRole } },
    @Body() exceptionData: CreateAvailabilityExceptionDto,
  ) {
    return this.availabilityService.createException(
      exceptionData,
      request.user,
    );
  }

  @Delete('exceptions/:id')
  @ApiOperation({
    summary: 'Eliminar excepción de disponibilidad',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador de la excepción.' })
  @ApiOkResponse({ description: 'Excepción eliminada correctamente.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el centro de la excepción.' })
  @ApiNotFoundResponse({ description: 'Excepción no encontrada.' })
  removeException(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.availabilityService.removeException(id, request.user);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar franja de disponibilidad',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador de la franja.' })
  @ApiOkResponse({ description: 'Franja eliminada correctamente.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el centro de la franja.' })
  @ApiNotFoundResponse({ description: 'Disponibilidad no encontrada.' })
  remove(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.availabilityService.remove(id, request.user);
  }

  @Patch('exceptions/:id')
  @ApiOperation({
    summary: 'Actualizar excepción de disponibilidad',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador de la excepción.' })
  @ApiOkResponse({ description: 'Excepción actualizada correctamente.' })
  @ApiBadRequestResponse({ description: 'Datos no válidos, fecha inválida o solape.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el centro de la excepción.' })
  @ApiNotFoundResponse({ description: 'Excepción no encontrada.' })
  updateException(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
    @Body() exceptionData: UpdateAvailabilityExceptionDto,
  ) {
    return this.availabilityService.updateException(
      id,
      exceptionData,
      request.user,
    );
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar franja de disponibilidad',
    description: 'Roles permitidos: ADMIN y GESTOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador de la franja.' })
  @ApiOkResponse({ description: 'Franja actualizada correctamente.' })
  @ApiBadRequestResponse({ description: 'Datos no válidos, hora inicial posterior a la final o solape.' })
  @ApiForbiddenResponse({ description: 'No se puede gestionar el centro de la franja.' })
  @ApiNotFoundResponse({ description: 'Disponibilidad no encontrada.' })
  update(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
    @Body() availabilityData: UpdateAvailabilityDto,
  ) {
    return this.availabilityService.update(id, availabilityData, request.user);
  }

  private parseCenterId(centerId?: string): number | undefined {
    if (centerId === undefined) return undefined;

    const parsedCenterId = Number(centerId);

    if (!Number.isInteger(parsedCenterId) || parsedCenterId < 1)
      throw new BadRequestException('El centro no es valido');

    return parsedCenterId;
  }
}
