import { IsString, IsNotEmpty, IsInt, IsPositive, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReturnDto {
  @ApiProperty({ example: 'clxyz123', description: 'ID del socio que devuelve' })
  @IsString()
  @IsNotEmpty()
  partnerId: string;

  @ApiProperty({ example: 'clxyz456', description: 'ID del producto devuelto' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 3, description: 'Número de botellas devueltas a bodega' })
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiProperty({ example: '2026-10-24', description: 'Fecha de la devolución (ISO 8601)' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'Botellas sin vender del evento' })
  @IsString()
  @IsOptional()
  notes?: string;
}
