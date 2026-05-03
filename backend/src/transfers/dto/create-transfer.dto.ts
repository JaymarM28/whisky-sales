import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTransferDto {
  @ApiPropertyOptional({ description: 'Solo necesario para OWNER que crea a nombre de un socio' })
  @IsString()
  @IsOptional()
  fromPartnerId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  toPartnerId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
