import { IsNotEmpty } from 'class-validator';

export class CreateBuildingTypeDto {
  @IsNotEmpty()
  name: string;
}
