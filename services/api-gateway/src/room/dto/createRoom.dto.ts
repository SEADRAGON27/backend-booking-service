import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateRoomDto {
  @IsNotEmpty()
  type: string;

  @IsNumber()
  @Type(() => Number)
  capacity: number;

  @IsNotEmpty()
  location: string;

  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Type(() => Number)
  originalPrice: number;

  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Type(() => Number)
  buildingTypeId: number;
}
