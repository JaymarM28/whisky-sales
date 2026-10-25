import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPinDto {
  @ApiProperty({ example: '12345678' })
  @IsString()
  @IsNotEmpty()
  cedula: string;
}
