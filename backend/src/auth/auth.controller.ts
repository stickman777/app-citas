import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
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
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UpdateActiveCenterDto } from './dto/update-active-center.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RegisterClientDto } from './dto/register-client.dto';

@Controller('auth')
@ApiTags('Autenticación')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión con email y contraseña' })
  @ApiCreatedResponse({ description: 'Token JWT generado correctamente.' })
  @ApiBadRequestResponse({ description: 'Datos de entrada no válidos.' })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas.' })
  login(@Body() loginData: LoginDto) {
    return this.authService.login(loginData.email, loginData.password);
  }

  @Post('register-client')
  @ApiOperation({
    summary: 'Registrar una cuenta de cliente mediante invitación',
  })
  @ApiCreatedResponse({ description: 'Cuenta de cliente registrada y token JWT generado.' })
  @ApiBadRequestResponse({
    description: 'Invitación inválida, caducada o datos de registro no válidos.',
  })
  registerClient(@Body() registerData: RegisterClientDto) {
    return this.authService.registerClient(registerData);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar el perfil del usuario autenticado' })
  @ApiOkResponse({ description: 'Perfil del usuario autenticado.' })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido.' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado.' })
  me(@Req() request: { user: { id: number } }) {
    return this.authService.getCurrentUser(request.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar el perfil del usuario autenticado' })
  @ApiOkResponse({ description: 'Perfil actualizado correctamente.' })
  @ApiBadRequestResponse({ description: 'Datos no válidos, email duplicado o contraseña actual incorrecta.' })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido.' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado.' })
  updateMe(
    @Req() request: { user: { id: number } },
    @Body() profileData: UpdateProfileDto,
  ) {
    return this.authService.updateCurrentUser(request.user.id, profileData);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('active-center')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar el centro activo del usuario autenticado' })
  @ApiOkResponse({ description: 'Centro activo actualizado correctamente.' })
  @ApiBadRequestResponse({ description: 'Centro no válido.' })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido.' })
  @ApiForbiddenResponse({ description: 'El usuario no puede seleccionar ese centro.' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado.' })
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
