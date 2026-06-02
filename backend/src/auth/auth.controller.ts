import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UpdateActiveCenterDto } from './dto/update-active-center.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginData: LoginDto) {
    return this.authService.login(loginData.email, loginData.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() request: { user: { id: number } }) {
    return this.authService.getCurrentUser(request.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(
    @Req() request: { user: { id: number } },
    @Body() profileData: UpdateProfileDto,
  ) {
    return this.authService.updateCurrentUser(request.user.id, profileData);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('active-center')
  updateActiveCenter(
    @Req() request: { user: { id: number } },
    @Body() activeCenterData: UpdateActiveCenterDto,
  ) {
    return this.authService.updateActiveCenter(
      request.user.id,
      activeCenterData.centerId,
    );
  }
}
