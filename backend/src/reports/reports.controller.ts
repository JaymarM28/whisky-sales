import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Reports')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @ApiOperation({ summary: 'Rentabilidad por producto' })
  @Get('rentabilidad')
  getRentabilidad(@Request() req) {
    return this.reportsService.getRentabilidad(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Resumen de ventas confirmadas con filtro de fechas' })
  @ApiQuery({ name: 'desde', required: false, example: '2024-01-01' })
  @ApiQuery({ name: 'hasta', required: false, example: '2024-12-31' })
  @Get('ventas')
  getVentas(
    @Request() req,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.reportsService.getVentas(req.user.tenantId, desde, hasta);
  }

  @ApiOperation({ summary: 'Rendimiento y comisiones por socio' })
  @Get('socios')
  getSocios(@Request() req) {
    return this.reportsService.getSocios(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Estado del inventario y rotación' })
  @Get('inventario')
  getInventario(@Request() req) {
    return this.reportsService.getInventario(req.user.tenantId);
  }
}
