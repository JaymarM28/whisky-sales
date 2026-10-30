import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LossesService } from './losses.service';
import { CreateLossDto } from './dto/create-loss.dto';
import { ListFilterDto } from '../common/dto/list-filter.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Pérdidas')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Controller('losses')
export class LossesController {
  constructor(private lossesService: LossesService) {}

  @ApiOperation({ summary: 'Listar pérdidas de inventario' })
  @Get()
  findAll(@Request() req, @Query() filtros: ListFilterDto) {
    return this.lossesService.findAll(req.user.tenantId, filtros);
  }

  @ApiOperation({ summary: 'Registrar pérdida (bodega o socio)' })
  @Post()
  create(@Body() dto: CreateLossDto, @Request() req) {
    return this.lossesService.create(dto, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Eliminar pérdida (devuelve las unidades al inventario)' })
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.lossesService.remove(id, req.user.tenantId);
  }
}
