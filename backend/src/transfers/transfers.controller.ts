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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Traspasos')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('transfers')
export class TransfersController {
  constructor(private transfersService: TransfersService) {}

  @ApiOperation({ summary: 'Listar traspasos del tenant' })
  @Get()
  findAll(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.transfersService.findAll(
      req.user.id,
      req.user.role,
      req.user.tenantId,
      Number(page),
      Number(limit),
    );
  }

  @ApiOperation({ summary: 'Socios receptores disponibles para traspaso' })
  @Get('recipients')
  getRecipients(@Request() req) {
    return this.transfersService.getRecipients(req.user.id, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Registrar traspaso' })
  @Post()
  create(@Body() dto: CreateTransferDto, @Request() req) {
    return this.transfersService.create(
      dto,
      req.user.id,
      req.user.role,
      req.user.tenantId,
    );
  }

  @ApiOperation({ summary: 'Eliminar traspaso (OWNER)' })
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.transfersService.remove(id, req.user.tenantId, req.user.role);
  }
}
