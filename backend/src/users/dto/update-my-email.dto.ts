import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMyEmailDto {
  @ApiProperty({ example: 'juan@email.com' })
  @IsEmail({}, { message: 'Correo inválido' })
  email: string;
}
