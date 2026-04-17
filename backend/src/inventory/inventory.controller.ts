import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Inventario')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @ApiOperation({ summary: 'Stock global por socio y producto' })
  @Get()
  getAll(@Request() req) {
    return this.inventoryService.getAll(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Stock de un socio específico' })
  @Get(':partnerId')
  getByPartner(@Param('partnerId') partnerId: string, @Request() req) {
    return this.inventoryService.getByPartner(partnerId, req.user.tenantId);
  }
}
