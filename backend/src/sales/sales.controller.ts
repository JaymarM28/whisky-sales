import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { PaginationDto } from '../common/dto/pagination.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleStatusDto } from './dto/update-sale-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

const fileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
    return cb(new BadRequestException('Solo se permiten imágenes JPEG o PNG'), false);
  }
  cb(null, true);
};

@ApiTags('Ventas')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(
    private salesService: SalesService,
    private cloudinaryService: CloudinaryService,
  ) {}

  @ApiOperation({ summary: 'Listar ventas (OWNER: todas | PARTNER: las suyas)' })
  @Get()
  findAll(@Request() req, @Query() pagination: PaginationDto) {
    return this.salesService.findAll(req.user.id, req.user.role, req.user.tenantId, pagination.page, pagination.limit);
  }

  @ApiOperation({ summary: 'Reportar venta con comprobante (multipart/form-data)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productId: { type: 'string' },
        quantity: { type: 'integer' },
        date: { type: 'string', format: 'date' },
        notes: { type: 'string' },
        receiptImage: { type: 'string', format: 'binary' },
      },
      required: ['productId', 'quantity', 'date'],
    },
  })
  @Post()
  @UseInterceptors(
    FileInterceptor('receiptImage', {
      storage: memoryStorage(),
      fileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async create(
    @Body() dto: CreateSaleDto,
    @Request() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let receiptImage: string | undefined;
    if (file) {
      receiptImage = await this.cloudinaryService.uploadImage(file.buffer);
    }
    return this.salesService.create(dto, req.user.id, req.user.tenantId, receiptImage);
  }

  @ApiOperation({ summary: 'Confirmar o rechazar venta (solo OWNER)' })
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateSaleStatusDto, @Request() req) {
    return this.salesService.updateStatus(id, dto, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Eliminar venta (solo OWNER)' })
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.salesService.remove(id, req.user.tenantId);
  }
}
