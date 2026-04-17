import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Tests E2E — se conectan a la base de datos real (Neon).
 * Requieren que exista al menos un usuario activo con PIN 1234.
 *
 * Ejecutar con: npm run test:e2e
 */
describe('App E2E', () => {
  let app: INestApplication;
  let ownerToken: string;
  let partnerToken: string;
  let ownerId: string;
  let partnerId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Auth ─────────────────────────────────────────────────────────────────────

  describe('GET /api/auth/profiles', () => {
    it('retorna lista de perfiles activos (público, sin token)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/profiles')
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.error).toBeNull();

      if (res.body.data.length > 0) {
        const profile = res.body.data[0];
        expect(profile).toHaveProperty('id');
        expect(profile).toHaveProperty('name');
        expect(profile).toHaveProperty('role');
        expect(profile).not.toHaveProperty('pin');

        // Guardar IDs para los siguientes tests
        const owner = res.body.data.find((u: any) => u.role === 'OWNER');
        const partner = res.body.data.find((u: any) => u.role === 'PARTNER');
        if (owner) ownerId = owner.id;
        if (partner) partnerId = partner.id;
      }
    });
  });

  describe('POST /api/auth/login', () => {
    it('falla con PIN incorrecto (401)', async () => {
      if (!ownerId) return;
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ userId: ownerId, pin: '0000' })
        .expect(401);
    });

    it('devuelve token con PIN correcto (OWNER)', async () => {
      if (!ownerId) return;
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ userId: ownerId, pin: '1234' })
        .expect(201);

      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).not.toHaveProperty('pin');
      ownerToken = res.body.data.token;
    });

    it('devuelve token con PIN correcto (PARTNER)', async () => {
      if (!partnerId) return;
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ userId: partnerId, pin: '1234' })
        .expect(201);

      expect(res.body.data).toHaveProperty('token');
      partnerToken = res.body.data.token;
    });
  });

  // ── Protección de rutas ──────────────────────────────────────────────────────

  describe('Autenticación y autorización', () => {
    it('GET /api/products rechaza sin token (401)', async () => {
      await request(app.getHttpServer()).get('/api/products').expect(401);
    });

    it('GET /api/products acepta token OWNER', async () => {
      if (!ownerToken) return;
      await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
    });

    it('GET /api/products rechaza token PARTNER (403)', async () => {
      if (!partnerToken) return;
      await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${partnerToken}`)
        .expect(403);
    });

    it('GET /api/sales acepta token PARTNER (ve sus ventas)', async () => {
      if (!partnerToken) return;
      const res = await request(app.getHttpServer())
        .get('/api/sales')
        .set('Authorization', `Bearer ${partnerToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  // ── Inventario ───────────────────────────────────────────────────────────────

  describe('GET /api/inventory/partner/:partnerId', () => {
    it('retorna inventario del socio', async () => {
      if (!ownerToken || !partnerId) return;
      const res = await request(app.getHttpServer())
        .get(`/api/inventory/partner/${partnerId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      res.body.data.forEach((item: any) => {
        expect(item).toHaveProperty('available');
        expect(item.available).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // ── Comisiones ───────────────────────────────────────────────────────────────

  describe('GET /api/commissions/pending/:partnerId', () => {
    it('retorna comisión pendiente del socio', async () => {
      if (!ownerToken || !partnerId) return;
      const res = await request(app.getHttpServer())
        .get(`/api/commissions/pending/${partnerId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('pendiente');
      expect(res.body.data).toHaveProperty('generada');
      expect(res.body.data).toHaveProperty('pagada');
    });

    it('PARTNER no puede acceder a comisión pendiente de otro socio (403)', async () => {
      if (!partnerToken || !partnerId) return;
      await request(app.getHttpServer())
        .get(`/api/commissions/pending/${partnerId}`)
        .set('Authorization', `Bearer ${partnerToken}`)
        .expect(403);
    });
  });

  // ── Dashboard ────────────────────────────────────────────────────────────────

  describe('GET /api/dashboard/owner', () => {
    it('retorna métricas del dashboard para OWNER', async () => {
      if (!ownerToken) return;
      const res = await request(app.getHttpServer())
        .get('/api/dashboard/owner')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      const { data } = res.body;
      expect(data).toHaveProperty('ventasPendientes');
      expect(data).toHaveProperty('gananciaBruta');
      expect(data).toHaveProperty('gananciaNeta');
      expect(data).toHaveProperty('comisionesPendientes');
      expect(data.gananciaNeta).toBeLessThanOrEqual(data.gananciaBruta);
    });
  });

  describe('GET /api/dashboard/partner', () => {
    it('retorna métricas del dashboard para PARTNER', async () => {
      if (!partnerToken) return;
      const res = await request(app.getHttpServer())
        .get('/api/dashboard/partner')
        .set('Authorization', `Bearer ${partnerToken}`)
        .expect(200);

      const { data } = res.body;
      expect(data).toHaveProperty('inventario');
      expect(data).toHaveProperty('comisionPendiente');
      expect(data.inventario).toBeInstanceOf(Array);
    });
  });
});
