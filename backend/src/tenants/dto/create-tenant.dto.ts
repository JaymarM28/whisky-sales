import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'J&L Liquors', description: 'Nombre del negocio' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'jl-liquors',
    description: 'Identificador único del negocio (solo letras, números y guiones)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'El slug solo puede contener letras minúsculas, números y guiones',
  })
  slug: string;
}
