import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

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
}
