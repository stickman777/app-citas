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
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityExceptionDto } from './dto/create-availability-exception.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityExceptionDto } from './dto/update-availability-exception.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.GESTOR)
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
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
  create(
    @Req() request: { user: { id: number; role: UserRole } },
    @Body() availabilityData: CreateAvailabilityDto,
  ) {
    return this.availabilityService.create(availabilityData, request.user);
  }

  @Post('exceptions')
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
  removeException(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.availabilityService.removeException(id, request.user);
  }

  @Delete(':id')
  remove(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.availabilityService.remove(id, request.user);
  }

  @Patch('exceptions/:id')
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
