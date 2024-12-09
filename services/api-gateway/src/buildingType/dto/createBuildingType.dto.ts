import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBuildingTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
