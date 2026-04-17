import { IsString, IsNotEmpty, IsInt, IsPositive, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeliveryDto {
  @ApiProperty({ example: 'clxyz123', description: 'ID del socio receptor' })
  @IsString()
  @IsNotEmpty()
  partnerId: string;

  @ApiProperty({ example: 'clxyz456', description: 'ID del producto entregado' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 10, description: 'Número de botellas entregadas' })
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiProperty({ example: '2026-04-08', description: 'Fecha de entrega (ISO 8601)' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'Entrega para evento de fin de semana' })
  @IsString()
  @IsOptional()
  notes?: string;
}
