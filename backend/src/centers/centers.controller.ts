import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/user.entity';
import { CentersService } from './centers.service';
import { CreateCenterDto } from './dto/create-center.dto';
import { UpdateCenterDto } from './dto/update-center.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.GESTOR)
@Controller('centers')
export class CentersController {
  constructor(private readonly centersService: CentersService) {}

  @Get()
  findAll(@Req() request: { user: { id: number; role: UserRole } }) {
    return this.centersService.findAll(request.user);
  }

  @Get('all')
  findAllIncludingInactive(
    @Req() request: { user: { id: number; role: UserRole } },
  ) {
    return this.centersService.findAllIncludingInactive(request.user);
  }

  @Get(':id')
  findOne(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.centersService.findOne(id, request.user);
  }

  @Post()
  create(
    @Req() request: { user: { id: number; role: UserRole } },
    @Body() centerData: CreateCenterDto,
  ) {
    return this.centersService.create(centerData, request.user);
  }

  @Patch(':id')
  update(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
    @Body() centerData: UpdateCenterDto,
  ) {
    return this.centersService.update(id, centerData, request.user);
  }

  @Patch(':id/activate')
  activate(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.centersService.activate(id, request.user);
  }

  @Patch(':id/deactivate')
  deactivate(
    @Req() request: { user: { id: number; role: UserRole } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.centersService.deactivate(id, request.user);
  }
}
