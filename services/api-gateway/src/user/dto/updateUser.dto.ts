import { IsEmail, IsNotEmpty } from 'class-validator';

export class UpdateUserDto {
  @IsNotEmpty()
  username: string;

  @IsEmail({}, { message: 'Email must be a valid.' })
  email: string;
}