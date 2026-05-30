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
import { CreateSpecialistDto } from './dto/create-specialist.dto';
import { UpdateSpecialistDto } from './dto/update-specialist.dto';
import { SpecialistsService } from './specialists.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.GESTOR)
@Controller('specialists')
export class SpecialistsController {
  constructor(private readonly specialistsService: SpecialistsService) {}

  @Get()
  findAll(
    @Req() request: { user: { id: number; role: UserRole } },
    @Query('centerId') centerId?: string,
  ) {
    return this.specialistsService.findAll(
      request.user,
      this.parseCenterId(centerId),
    );
  }

  @Get('all')
  findAllIncludingInactive(
    @Req() request: { user: { id: number; role: UserRole } },
    @Query('centerId') centerId?: string,
  ) {
    return this.specialistsService.findAllIncludingInactive(
      request.user,
      this.parseCenterId(centerId),
    );
  }

  @Get(':id')
  findOne(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.specialistsService.findOne(id, request.user);
  }

  @Post()
  create(
    @Req() request: { user: { id: number; role: UserRole } },
    @Body() specialistData: CreateSpecialistDto,
  ) {
    return this.specialistsService.create(specialistData, request.user);
  }

  @Patch(':id')
  update(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
    @Body() specialistData: UpdateSpecialistDto,
  ) {
    return this.specialistsService.update(id, specialistData, request.user);
  }

  @Patch(':id/activate')
  activate(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.specialistsService.activate(id, request.user);
  }

  @Patch(':id/deactivate')
  deactivate(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.specialistsService.deactivate(id, request.user);
  }

  private parseCenterId(centerId?: string): number | undefined {
    if (centerId === undefined) return undefined;

    const parsedCenterId = Number(centerId);

    if (!Number.isInteger(parsedCenterId) || parsedCenterId < 1)
      throw new BadRequestException('El centro no es valido');

    return parsedCenterId;
  }
}
