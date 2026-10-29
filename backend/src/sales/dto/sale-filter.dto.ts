import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SaleStatus } from '@prisma/client';
import { ListFilterDto } from '../../common/dto/list-filter.dto';

/** Filtros del listado de ventas: los comunes más el estado. */
export class SaleFilterDto extends ListFilterDto {
  @ApiPropertyOptional({ enum: SaleStatus })
  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;
}
