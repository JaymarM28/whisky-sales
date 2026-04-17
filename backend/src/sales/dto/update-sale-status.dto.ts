import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SaleStatus } from '@prisma/client';

export class UpdateSaleStatusDto {
  @ApiProperty({ enum: SaleStatus, example: 'CONFIRMED' })
  @IsEnum(SaleStatus)
  status: SaleStatus;
}
