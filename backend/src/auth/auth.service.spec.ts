import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { MailService } from '../mail/mail.service';

describe('AuthService', () => {
  const jwt = { sign: jest.fn().mockReturnValue('token-jwt') };
  const mail = { sendPinResetEmail: jest.fn() };
  let prisma: any;
  let service: AuthService;
  let usuario: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    usuario = {
      id: 'u1', name: 'Ana', cedula: '123', pin: await bcrypt.hash('1234', 4),
      role: 'PARTNER', tenantId: 't1', isAdmin: false, active: true, email: 'ana@test.com',
      resetToken: null, resetTokenExp: null,
    };
    prisma = {
      user: {
        findUnique: jest.fn(async ({ where }) => (where.cedula === usuario.cedula || where.id === usuario.id ? usuario : null)),
        findFirst: jest.fn(async ({ where }) => (where.resetToken && where.resetToken === usuario.resetToken ? usuario : null)),
        update: jest.fn(async ({ data }) => Object.assign(usuario, data)),
      },
    };
    service = new AuthService(prisma, jwt as unknown as JwtService, mail as unknown as MailService);
  });

  describe('login', () => {
    it('devuelve token y usuario sin el PIN', async () => {
      const { data } = await service.login({ cedula: '123', pin: '1234' });
      expect(data.token).toBe('token-jwt');
      expect(data.user).not.toHaveProperty('pin');
      expect(jwt.sign).toHaveBeenCalledWith({ sub: 'u1', role: 'PARTNER', tenantId: 't1', isAdmin: false });
    });

    it('rechaza PIN incorrecto', async () => {
      await expect(service.login({ cedula: '123', pin: '0000' })).rejects.toThrow(UnauthorizedException);
    });

    it('rechaza cédula inexistente', async () => {
      await expect(service.login({ cedula: '999', pin: '1234' })).rejects.toThrow(UnauthorizedException);
    });

    it('rechaza usuarios inactivos', async () => {
      usuario.active = false;
      await expect(service.login({ cedula: '123', pin: '1234' })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPin', () => {
    it('responde igual exista o no la cédula', async () => {
      const existe = await service.forgotPin({ cedula: '123' });
      const noExiste = await service.forgotPin({ cedula: '999' });
      expect(existe.message).toBe(noExiste.message);
    });

    it('genera un token que vence en 30 minutos y envía el correo', async () => {
      await service.forgotPin({ cedula: '123' });
      expect(usuario.resetToken).toMatch(/^[a-f0-9]{64}$/);
      const minutos = (usuario.resetTokenExp.getTime() - Date.now()) / 60_000;
      expect(minutos).toBeGreaterThan(29);
      expect(minutos).toBeLessThanOrEqual(30);
      expect(mail.sendPinResetEmail).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'ana@test.com', resetUrl: expect.stringContaining(usuario.resetToken) }),
      );
    });

    it('no envía correo si el usuario no tiene email', async () => {
      usuario.email = null;
      await service.forgotPin({ cedula: '123' });
      expect(mail.sendPinResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPin', () => {
    it('cambia el PIN y anula el token', async () => {
      await service.forgotPin({ cedula: '123' });
      const token = usuario.resetToken;

      await service.resetPin({ token, newPin: '5678' });

      expect(await bcrypt.compare('5678', usuario.pin)).toBe(true);
      expect(usuario.resetToken).toBeNull();
      await expect(service.resetPin({ token, newPin: '9999' })).rejects.toThrow(BadRequestException);
    });

    it('rechaza tokens vencidos', async () => {
      usuario.resetToken = 'abc';
      usuario.resetTokenExp = new Date(Date.now() - 1000);
      await expect(service.resetPin({ token: 'abc', newPin: '5678' })).rejects.toThrow(BadRequestException);
    });
  });
});
