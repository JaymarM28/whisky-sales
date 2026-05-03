import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secreto',
    });
  }

  async validate(payload: { sub: string; role: string; tenantId: string; isAdmin: boolean }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('Usuario no autorizado');
    }

    return {
      id: user.id,
      name: user.name,
      role: user.role,
      tenantId: payload.tenantId,
      isAdmin: user.isAdmin,
      canTransfer: user.canTransfer,
    };
  }
}
