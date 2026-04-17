import { IsString, IsNotEmpty, IsInt, IsPositive, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommissionDto {
  @ApiProperty({ example: 'clxyz123', description: 'ID del socio al que se le paga' })
  @IsString()
  @IsNotEmpty()
  partnerId: string;

  @ApiProperty({ example: 150000, description: 'Monto del pago en pesos COP' })
  @IsInt()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ example: 'Transferencia Nequi 123456' })
  @IsString()
  @IsOptional()
  paymentReference?: string;

  @ApiProperty({ example: '2026-04-08', description: 'Fecha del pago (ISO 8601)' })
  @IsDateString()
  date: string;
}
