import {
  BadRequestException,
  Body,
  Controller,
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
import { CreateServiceDto } from './dto/create-service.dto';
import { ServicesService } from './services.service';
import { UpdateServiceDto } from './dto/update-service.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.GESTOR)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // Endpoint para obtener todos los servicios activos
  @Get()
  findAll(@Req() request, @Query('centerId') centerId?: string) {
    return this.servicesService.findAll(
      request.user,
      this.parseCenterId(centerId),
    );
  }

  // Endpoint para obtener todos los servicios, incluyendo los inactivos
  @Get('all')
  findAllIncludingInactive(@Req() request, @Query('centerId') centerId?: string) {
    return this.servicesService.findAllIncludingInactive(
      request.user,
      this.parseCenterId(centerId),
    );
  }

  @Get(':id')
  findOne(@Req() request, @Param('id', ParseIntPipe) id: number) {
    return this.servicesService.findOne(id, request.user);
  }

  // Endpoint para crear un nuevo servicio
  @Post()
  create(@Req() request, @Body() serviceData: CreateServiceDto) {
    return this.servicesService.create(serviceData, request.user);
  }

  // Endpoint para actualizar un servicio por su ID
  @Patch(':id')
  update(
    @Req() request,
    @Param('id', ParseIntPipe) id: number,
    @Body() serviceData: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, serviceData, request.user);
  }

  // Endpoint para activar un servicio por su ID
  @Patch(':id/activate')
  activate(
    @Req() request,
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.servicesService.activate(id, request.user);
  }

  // Endpoint para desactivar un servicio por su ID
  @Patch(':id/deactivate')
  deactivate(@Req() request, @Param('id', ParseIntPipe) id: number) {
    return this.servicesService.deactivate(id, request.user);
  }

  private parseCenterId(centerId?: string): number | undefined {
    if (centerId === undefined) return undefined;

    const parsedCenterId = Number(centerId);

    if (!Number.isInteger(parsedCenterId) || parsedCenterId < 1)
      throw new BadRequestException('El centro no es valido');

    return parsedCenterId;
  }
}
