import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReturnsService } from './returns.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { ListFilterDto } from '../common/dto/list-filter.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Devoluciones')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Controller('returns')
export class ReturnsController {
  constructor(private returnsService: ReturnsService) {}

  @ApiOperation({ summary: 'Listar devoluciones de socios a bodega' })
  @Get()
  findAll(@Request() req, @Query() filtros: ListFilterDto) {
    return this.returnsService.findAll(req.user.tenantId, filtros);
  }

  @ApiOperation({ summary: 'Registrar devolución de un socio a bodega' })
  @Post()
  create(@Body() dto: CreateReturnDto, @Request() req) {
    return this.returnsService.create(dto, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Eliminar devolución (solo si las unidades siguen en bodega)' })
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.returnsService.remove(id, req.user.tenantId);
  }
}
