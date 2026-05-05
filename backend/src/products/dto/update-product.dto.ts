import { IsString, IsOptional, IsInt, IsPositive, IsBoolean, Min } from 'class-validator';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  unitsPerBox?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  boxCost?: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  costPrice?: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  partnerPrice?: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  salePrice?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  businessPrice?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  businessPrice2?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  businessPrice3?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
