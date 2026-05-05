import { IsString, IsNotEmpty, IsInt, IsPositive, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSaleDto {
  @ApiProperty({ example: 'clxyz456', description: 'ID del producto vendido' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2, description: 'Cantidad de botellas vendidas' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiProperty({ example: '2026-04-08', description: 'Fecha de la venta (ISO 8601)' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ enum: ['CONSUMER', 'BUSINESS', 'BUSINESS_2', 'BUSINESS_3'], default: 'CONSUMER' })
  @IsEnum(['CONSUMER', 'BUSINESS', 'BUSINESS_2', 'BUSINESS_3'])
  @IsOptional()
  clientType?: 'CONSUMER' | 'BUSINESS' | 'BUSINESS_2' | 'BUSINESS_3';

  @ApiPropertyOptional({ example: 'Venta a cliente VIP' })
  @IsString()
  @IsOptional()
  notes?: string;
}
