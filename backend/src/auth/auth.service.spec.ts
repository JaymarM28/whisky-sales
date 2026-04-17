import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  user: { findUnique: jest.fn(), findMany: jest.fn() },
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mocked-jwt-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ── login ────────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('lanza UnauthorizedException si el usuario no existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login({ userId: 'no-existe', pin: '1234' })).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si el usuario está inactivo', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', active: false, pin: 'hash' });
      await expect(service.login({ userId: 'u1', pin: '1234' })).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si el PIN es incorrecto', async () => {
      const hash = await bcrypt.hash('1234', 10);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', active: true, pin: hash, role: 'PARTNER' });
      await expect(service.login({ userId: 'u1', pin: '0000' })).rejects.toThrow(UnauthorizedException);
    });

    it('retorna token y datos del usuario con PIN correcto', async () => {
      const pin = '1234';
      const hash = await bcrypt.hash(pin, 10);
      const user = { id: 'u1', name: 'Leo', role: 'PARTNER', active: true, pin: hash, commissionPct: 20, createdAt: new Date() };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('jwt-abc');

      const result = await service.login({ userId: 'u1', pin });

      expect(result.data.token).toBe('jwt-abc');
      expect(result.data.user).not.toHaveProperty('pin'); // PIN no debe exponerse
      expect(result.data.user.name).toBe('Leo');
    });

    it('genera token con payload correcto (sub + role)', async () => {
      const pin = '9999';
      const hash = await bcrypt.hash(pin, 10);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'owner-1', name: 'Jay', role: 'OWNER', active: true, pin: hash });

      await service.login({ userId: 'owner-1', pin });

      expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: 'owner-1', role: 'OWNER' });
    });
  });

  // ── getProfiles ──────────────────────────────────────────────────────────────

  describe('getProfiles', () => {
    it('retorna solo usuarios activos', async () => {
      const profiles = [
        { id: 'u1', name: 'Leo', role: 'PARTNER' },
        { id: 'u2', name: 'Jay', role: 'OWNER' },
      ];
      mockPrisma.user.findMany.mockResolvedValue(profiles);

      const result = await service.getProfiles();
      expect(result.data).toHaveLength(2);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { active: true } }),
      );
    });

    it('retorna solo id, name, role (no PIN ni datos sensibles)', async () => {
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'u1', name: 'Leo', role: 'PARTNER' }]);

      const result = await service.getProfiles();
      const profile = result.data[0];
      expect(profile).toHaveProperty('id');
      expect(profile).toHaveProperty('name');
      expect(profile).toHaveProperty('role');
      expect(profile).not.toHaveProperty('pin');
    });
  });
});
