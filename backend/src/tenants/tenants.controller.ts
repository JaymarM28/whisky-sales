import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('Negocios')
@Controller('tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @ApiOperation({ summary: 'Registrar un nuevo negocio (solo ADMIN)' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @ApiOperation({ summary: 'Listar todos los negocios (solo ADMIN)' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  findAll() {
    return this.tenantsService.findAll();
  }

  @ApiOperation({ summary: 'Verificar que un negocio existe por slug (público)' })
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.tenantsService.findBySlug(slug);
  }
}
