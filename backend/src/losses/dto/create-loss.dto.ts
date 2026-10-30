import { IsString, IsNotEmpty, IsInt, IsPositive, IsDateString, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLossDto {
  @ApiProperty({ example: 'clxyz456', description: 'ID del producto perdido' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ example: 'clxyz123', description: 'Socio en cuyo poder estaba; vacío = bodega' })
  @IsString()
  @IsOptional()
  partnerId?: string;

  @ApiProperty({ example: 1, description: 'Número de botellas perdidas' })
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional({ example: 50, description: 'Porcentaje del costo que asume el socio (0-100)' })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  partnerSharePct?: number;

  @ApiProperty({ example: '2026-10-28', description: 'Fecha de la pérdida (ISO 8601)' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'Se quebró en el transporte' })
  @IsString()
  @IsOptional()
  notes?: string;
}
