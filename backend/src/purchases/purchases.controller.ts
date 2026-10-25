import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { ListFilterDto } from '../common/dto/list-filter.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Compras')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Controller('purchases')
export class PurchasesController {
  constructor(private purchasesService: PurchasesService) {}

  @ApiOperation({ summary: 'Listar compras (filtros opcionales por producto y fechas)' })
  @Get()
  findAll(@Request() req, @Query() filtros: ListFilterDto) {
    return this.purchasesService.findAll(req.user.tenantId, filtros);
  }

  @ApiOperation({ summary: 'Stock por producto: comprado, invertido, entregado y en bodega' })
  @Get('stock')
  getStock(@Request() req) {
    return this.purchasesService.getStock(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Registrar compra de inventario' })
  @Post()
  create(@Body() dto: CreatePurchaseDto, @Request() req) {
    return this.purchasesService.create(dto, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Eliminar compra (solo si sus unidades siguen en bodega)' })
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.purchasesService.remove(id, req.user.tenantId);
  }
}
