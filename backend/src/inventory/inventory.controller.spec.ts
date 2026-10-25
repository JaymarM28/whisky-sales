import { ForbiddenException } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

describe('InventoryController — acceso por rol', () => {
  const service = { getByPartner: jest.fn().mockResolvedValue({ data: [] }) };
  const controller = new InventoryController(service as unknown as InventoryService);

  beforeEach(() => jest.clearAllMocks());

  it('el socio puede consultar su propio inventario', async () => {
    await controller.getByPartner('partner-1', { user: { id: 'partner-1', role: 'PARTNER', tenantId: 't' } });
    expect(service.getByPartner).toHaveBeenCalledWith('partner-1', 't');
  });

  it('el socio no puede consultar el inventario de otro socio', () => {
    expect(() =>
      controller.getByPartner('partner-2', { user: { id: 'partner-1', role: 'PARTNER', tenantId: 't' } }),
    ).toThrow(ForbiddenException);
    expect(service.getByPartner).not.toHaveBeenCalled();
  });

  it('el dueño puede consultar el inventario de cualquier socio', async () => {
    await controller.getByPartner('partner-2', { user: { id: 'owner-1', role: 'OWNER', tenantId: 't' } });
    expect(service.getByPartner).toHaveBeenCalledWith('partner-2', 't');
  });
});
