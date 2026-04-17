import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @ApiOperation({ summary: 'Resumen general para el dueño' })
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  @Get('owner')
  getOwnerDashboard(@Request() req) {
    return this.dashboardService.getOwnerDashboard(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Resumen personal del socio autenticado' })
  @Get('partner')
  getPartnerDashboard(@Request() req) {
    return this.dashboardService.getPartnerDashboard(req.user.id, req.user.tenantId);
  }
}
