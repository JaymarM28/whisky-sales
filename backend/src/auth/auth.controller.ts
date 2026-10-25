import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPinDto } from './dto/forgot-pin.dto';
import { ResetPinDto } from './dto/reset-pin.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Iniciar sesión con cédula y PIN' })
  @ApiBody({ type: LoginDto })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Solicitar enlace de recuperación de PIN' })
  @Post('forgot-pin')
  forgotPin(@Body() dto: ForgotPinDto) {
    return this.authService.forgotPin(dto);
  }

  @ApiOperation({ summary: 'Restablecer PIN con token de recuperación' })
  @Post('reset-pin')
  resetPin(@Body() dto: ResetPinDto) {
    return this.authService.resetPin(dto);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req) {
    return this.authService.getMe(req.user.id);
  }
}
