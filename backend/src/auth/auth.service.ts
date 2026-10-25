import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPinDto } from './dto/forgot-pin.dto';
import { ResetPinDto } from './dto/reset-pin.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mail: MailService,
  ) {}

  async login(dto: LoginDto) {
    // La cédula es única globalmente — el usuario pertenece a un solo negocio
    const user = await this.prisma.user.findUnique({
      where: { cedula: dto.cedula },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('Cédula o PIN incorrecto');
    }

    const pinValido = await bcrypt.compare(dto.pin, user.pin);
    if (!pinValido) {
      throw new UnauthorizedException('Cédula o PIN incorrecto');
    }

    const payload = { sub: user.id, role: user.role, tenantId: user.tenantId, isAdmin: user.isAdmin };
    const token = this.jwtService.sign(payload);

    const { pin: _, ...userData } = user;

    return {
      data: { token, user: userData },
      error: null,
      message: 'Inicio de sesión exitoso',
    };
  }

  async forgotPin(dto: ForgotPinDto) {
    const respuesta = { data: null, error: null, message: 'Si la cédula tiene un email registrado, recibirás un enlace.' };
    const user = await this.prisma.user.findUnique({ where: { cedula: dto.cedula } });
    // Siempre responde igual para no revelar si la cédula existe o tiene email
    if (!user || !user.active || !user.email) {
      return respuesta;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const exp = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExp: exp },
    });

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:4200';
    void this.mail.sendPinResetEmail({
      email: user.email!,
      name: user.name,
      resetUrl: `${frontendUrl}/login/reset-pin?token=${token}`,
    });

    return respuesta;
  }

  async resetPin(dto: ResetPinDto) {
    const user = await this.prisma.user.findFirst({
      where: { resetToken: dto.token },
    });

    if (!user || !user.resetTokenExp || user.resetTokenExp < new Date()) {
      throw new BadRequestException('El enlace es inválido o ha expirado');
    }

    const pinHash = await bcrypt.hash(dto.newPin, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { pin: pinHash, resetToken: null, resetTokenExp: null },
    });

    return { data: null, error: null, message: 'PIN actualizado correctamente' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        cedula: true,
        role: true,
        isAdmin: true,
        commissionPct: true,
        active: true,
        tenantId: true,
        createdAt: true,
      },
    });

    return { data: user, error: null, message: null };
  }
}
