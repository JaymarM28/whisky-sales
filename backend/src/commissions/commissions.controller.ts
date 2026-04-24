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
import { PaginationDto } from '../common/dto/pagination.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';
import { CreateCommissionDto } from './dto/create-commission.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Comisiones')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('commissions')
export class CommissionsController {
  constructor(private commissionsService: CommissionsService) {}

  @ApiOperation({ summary: 'Listar pagos (OWNER: todos | PARTNER: los suyos)' })
  @Get()
  findAll(@Request() req, @Query() pagination: PaginationDto) {
    return this.commissionsService.findAll(req.user.id, req.user.role, req.user.tenantId, pagination.page, pagination.limit);
  }

  @ApiOperation({ summary: 'Comisión pendiente de un socio (solo OWNER)' })
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  @Get('pending/:partnerId')
  getPending(@Param('partnerId') partnerId: string, @Request() req) {
    return this.commissionsService.getPendingForPartner(partnerId, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Registrar pago de comisión (solo OWNER)' })
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  @Post()
  create(@Body() dto: CreateCommissionDto, @Request() req) {
    return this.commissionsService.create(dto, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Eliminar pago (solo OWNER)' })
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.commissionsService.remove(id, req.user.tenantId);
  }
}
