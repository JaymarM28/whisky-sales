import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AdminGuard } from '../auth/admin.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Socios')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'Listar socios del tenant (OWNER)' })
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  @Get()
  findAll(@Request() req) {
    return this.usersService.findAll(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Listar todos los OWNERs de la plataforma (solo ADMIN)' })
  @UseGuards(AdminGuard)
  @Get('owners')
  findAllOwners() {
    return this.usersService.findAllOwners();
  }

  @ApiOperation({ summary: 'Crear socio (OWNER crea PARTNER) o crear owner (ADMIN crea OWNER)' })
  @Post()
  create(@Body() dto: CreateUserDto, @Request() req) {
    return this.usersService.create(dto, {
      tenantId: req.user.tenantId,
      isAdmin: req.user.isAdmin,
      role: req.user.role,
    });
  }

  @ApiOperation({ summary: 'Cambiar PIN propio (cualquier usuario autenticado)' })
  @Patch('me/pin')
  updateMyPin(@Body('pin') pin: string, @Request() req) {
    return this.usersService.updateMyPin(req.user.id, pin);
  }

  @ApiOperation({ summary: 'Editar socio' })
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Request() req) {
    return this.usersService.update(id, dto, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Desactivar socio' })
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  @Delete(':id')
  deactivate(@Param('id') id: string, @Request() req) {
    return this.usersService.deactivate(id, req.user.tenantId);
  }
}
