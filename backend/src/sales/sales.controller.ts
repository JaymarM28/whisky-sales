import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleStatusDto } from './dto/update-sale-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

const storage = diskStorage({
  destination: join(__dirname, '..', '..', '..', 'uploads'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `receipt-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
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
  constructor(private salesService: SalesService) {}

  @ApiOperation({ summary: 'Listar ventas (OWNER: todas | PARTNER: las suyas)' })
  @Get()
  findAll(@Request() req) {
    return this.salesService.findAll(req.user.id, req.user.role, req.user.tenantId);
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
      storage,
      fileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  create(
    @Body() dto: CreateSaleDto,
    @Request() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const receiptImage = file ? `/uploads/${file.filename}` : undefined;
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
