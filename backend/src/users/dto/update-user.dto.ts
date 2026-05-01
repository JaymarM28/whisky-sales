import { IsString, IsOptional, IsNumber, IsBoolean, Min, Max, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Juan Pérez' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '1234567890', description: 'Número de cédula' })
  @IsString()
  @IsOptional()
  cedula?: string;

  @ApiPropertyOptional({ example: '5678', description: 'Nuevo PIN' })
  @IsString()
  @IsOptional()
  pin?: string;

  @ApiPropertyOptional({ example: 25 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  commissionPct?: number;

  @ApiPropertyOptional({ example: 'juan@email.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
