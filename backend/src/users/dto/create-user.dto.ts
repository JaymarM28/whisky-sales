import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Max, IsEnum, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '1234567890', description: 'Número de cédula' })
  @IsString()
  @IsNotEmpty()
  cedula: string;

  @ApiProperty({ example: '1234', description: 'PIN de acceso (mínimo 4 dígitos)' })
  @IsString()
  @IsNotEmpty()
  pin: string;

  @ApiPropertyOptional({ enum: Role, default: 'PARTNER' })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({ example: 20, description: 'Porcentaje de comisión (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  commissionPct?: number;

  @ApiPropertyOptional({ example: 'juan@email.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  /** Solo para admins: asignar el usuario a un tenant específico */
  @ApiPropertyOptional({ example: 'clxxx...', description: 'ID del tenant (solo admin)' })
  @IsString()
  @IsOptional()
  tenantId?: string;
}
