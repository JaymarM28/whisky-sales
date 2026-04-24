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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DeliveriesService } from './deliveries.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Entregas')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Controller('deliveries')
export class DeliveriesController {
  constructor(private deliveriesService: DeliveriesService) {}

  @ApiOperation({ summary: 'Listar entregas (filtros opcionales por socio y producto)' })
  @ApiQuery({ name: 'partnerId', required: false })
  @ApiQuery({ name: 'productId', required: false })
  @Get()
  findAll(
    @Request() req,
    @Query('partnerId') partnerId?: string,
    @Query('productId') productId?: string,
    @Query() pagination?: PaginationDto,
  ) {
    return this.deliveriesService.findAll(req.user.tenantId, partnerId, productId, pagination?.page, pagination?.limit);
  }

  @ApiOperation({ summary: 'Registrar entrega a un socio' })
  @Post()
  create(@Body() dto: CreateDeliveryDto, @Request() req) {
    return this.deliveriesService.create(dto, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Eliminar entrega' })
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.deliveriesService.remove(id, req.user.tenantId);
  }
}
