import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Productos')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @ApiOperation({ summary: 'Listar todos los productos' })
  @Get()
  findAll(@Request() req, @Query() pagination: PaginationDto) {
    return this.productsService.findAll(req.user.tenantId, pagination.page, pagination.limit);
  }

  @ApiOperation({ summary: 'Crear nuevo producto' })
  @Post()
  create(@Body() dto: CreateProductDto, @Request() req) {
    return this.productsService.create(dto, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Editar producto' })
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @Request() req) {
    return this.productsService.update(id, dto, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Eliminar producto (o desactivar si tiene registros asociados)' })
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.productsService.remove(id, req.user.tenantId);
  }
}
