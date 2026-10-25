import { Controller, Get, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Inventario')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @ApiOperation({ summary: 'Stock global por socio y producto (solo OWNER)' })
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  @Get()
  getAll(@Request() req) {
    return this.inventoryService.getAll(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Stock de un socio (OWNER: cualquiera | PARTNER: solo el propio)' })
  @Get(':partnerId')
  getByPartner(@Param('partnerId') partnerId: string, @Request() req) {
    if (req.user.role === 'PARTNER' && partnerId !== req.user.id) {
      throw new ForbiddenException('Solo puedes consultar tu propio inventario');
    }
    return this.inventoryService.getByPartner(partnerId, req.user.tenantId);
  }
}
