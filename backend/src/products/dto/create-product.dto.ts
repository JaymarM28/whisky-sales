import { IsString, IsNotEmpty, IsInt, IsPositive, IsOptional, Min, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: "Buchanan's 18" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'BUCH18' })
  @IsString()
  @IsNotEmpty()
  reference: string;

  @ApiProperty({ example: 12, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  unitsPerBox?: number;

  @ApiProperty({ example: 1000000, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  boxCost?: number;

  @ApiProperty({ example: 124250 })
  @IsInt()
  @IsPositive()
  costPrice: number;

  @ApiProperty({ example: 140000 })
  @IsInt()
  @IsPositive()
  partnerPrice: number;

  @ApiProperty({ example: 180000 })
  @IsInt()
  @IsPositive()
  salePrice: number;

  @ApiProperty({ example: 160000, description: 'Precio negocio 1 (0 = no aplica)', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  businessPrice?: number;

  @ApiProperty({ example: 155000, description: 'Precio negocio 2 (0 = no aplica)', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  businessPrice2?: number;

  @ApiProperty({ example: 150000, description: 'Precio negocio 3 (0 = no aplica)', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  businessPrice3?: number;
}
