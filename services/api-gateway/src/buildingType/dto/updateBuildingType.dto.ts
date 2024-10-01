import { PartialType } from '@nestjs/mapped-types';
import { CreateBuildingTypeDto } from './createBuildingType.dto';

export class UpdateBuildingTypeDto extends PartialType(CreateBuildingTypeDto) {}
