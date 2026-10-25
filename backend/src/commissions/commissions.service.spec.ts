import { NotFoundException } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { MailService } from '../mail/mail.service';
import { crearFakePrisma } from '../../test/fake-prisma';
import { escenario, T } from '../../test/escenario';

describe('CommissionsService', () => {
  let service: CommissionsService;
  const mail = { notifyPartnerCommission: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CommissionsService(crearFakePrisma(escenario()), mail as unknown as MailService);
  });

  describe('getPendingForPartner', () => {
    it('calcula comisión con el precio de cada tipo de cliente', async () => {
      const { data } = await service.getPendingForPartner('p1', T);
      expect(data).toEqual({ generada: 90_000, pagada: 50_000, pendiente: 40_000 });
    });

    it('solo cuenta ventas confirmadas', async () => {
      const { data } = await service.getPendingForPartner('p2', T);
      expect(data).toEqual({ generada: 16_000, pagada: 0, pendiente: 16_000 });
    });

    it('no encuentra socios de otro negocio', async () => {
      await expect(service.getPendingForPartner('x1', T)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('registra el pago y notifica al socio si tiene email', async () => {
      const { data } = await service.create({ partnerId: 'p1', amount: 10_000, date: '2026-10-20' }, T);
      expect(data.amount).toBe(10_000);
      expect(mail.notifyPartnerCommission).toHaveBeenCalledWith(expect.objectContaining({ partnerEmail: 'ana@test.com' }));
    });

    it('no notifica si el socio no tiene email', async () => {
      await service.create({ partnerId: 'p2', amount: 10_000, date: '2026-10-20' }, T);
      expect(mail.notifyPartnerCommission).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('el socio solo ve sus pagos', async () => {
      const result = await service.findAll('p2', 'PARTNER', T);
      expect(result.total).toBe(0);
    });

    it('el dueño ve todos los pagos del negocio', async () => {
      const result = await service.findAll('owner', 'OWNER', T);
      expect(result.total).toBe(1);
    });
  });
});
