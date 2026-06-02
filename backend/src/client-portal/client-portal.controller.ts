import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/user.entity';
import { ClientPortalService } from './client-portal.service';

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
}
