import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
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
