import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from './pagination.dto';

/**
 * Paginación + filtros opcionales para los listados.
 * Debe declarar cada filtro: la validación global rechaza parámetros de query no declarados.
 */
export class ListFilterDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  partnerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ example: '2026-10-01', description: 'Fecha inicial (inclusive)' })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ example: '2026-10-31', description: 'Fecha final (inclusive)' })
  @IsOptional()
  @IsDateString()
  hasta?: string;
}

/** Filtro Prisma por rango de fechas a partir de desde/hasta (YYYY-MM-DD), con hasta inclusive. */
export function rangoFechas(desde?: string, hasta?: string) {
  if (!desde && !hasta) return {};
  return {
    date: {
      ...(desde && { gte: new Date(desde) }),
      ...(hasta && { lte: new Date(hasta + 'T23:59:59.999Z') }),
    },
  };
}
