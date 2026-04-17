import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: '1234567890', description: 'Cédula del usuario' })
  @IsString()
  @IsNotEmpty()
  cedula: string;

  @ApiProperty({ example: '1234', description: 'PIN numérico del usuario' })
  @IsString()
  @IsNotEmpty()
  pin: string;
}
