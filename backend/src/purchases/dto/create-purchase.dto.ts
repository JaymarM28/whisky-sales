import { IsString, IsNotEmpty, IsInt, IsPositive, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePurchaseDto {
  @ApiProperty({ example: 'clxyz456', description: 'ID del producto comprado' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 24, description: 'Número de botellas compradas (unidades)' })
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiProperty({ example: 2000000, description: 'Total pagado por la compra (COP)' })
  @IsInt()
  @IsPositive()
  totalCost: number;

  @ApiProperty({ example: '2026-04-08', description: 'Fecha de compra (ISO 8601)' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'Distribuidora La 14' })
  @IsString()
  @IsOptional()
  supplier?: string;

  @ApiPropertyOptional({ example: 'Factura 1234' })
  @IsString()
  @IsOptional()
  notes?: string;
}
