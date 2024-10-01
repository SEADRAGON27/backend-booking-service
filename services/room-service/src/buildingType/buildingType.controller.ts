import { Controller } from '@nestjs/common';
import { BuildingTypeService } from './buildingType.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateBuildingType } from './interfaces/createBuildingType.interface';
import { UpdateBuildingType } from './interfaces/updateBuildingType.interfacce';
import { WinstonLoggerService } from 'src/logs/logger';
import { exceptionType } from 'utils/exceptionType';

@Controller()
export class BuildingTypeController {
  constructor(
    private readonly buildingTypeService: BuildingTypeService,
    private readonly logger: WinstonLoggerService,
  ) {}

  @MessagePattern({ cmd: 'create_building_type' })
  async create(@Payload() createBuildingTypeData: CreateBuildingType) {
    try {
      const buildingType = await this.buildingTypeService.create(createBuildingTypeData);
      this.logger.log(`Building type created successfully: ${JSON.stringify(buildingType)}`);

      return buildingType;
    } catch (error) {
      if (exceptionType(error)) this.logger.error(`Error creating building type:${JSON.stringify(createBuildingTypeData)}, ${error.message}`);

      throw error;
    }
  }

  @MessagePattern({ cmd: 'update_building_type' })
  async update(@Payload('updateBuildingTypeDto') updateBuildingTypeData: UpdateBuildingType, @Payload('id') id: number) {
    try {
      const buildingType = await this.buildingTypeService.update(id, updateBuildingTypeData);
      this.logger.log(`Building type updated successfully: ${JSON.stringify(buildingType)}`);

      return buildingType;
    } catch (error) {
      this.logger.error(`Error updating building type with: ${updateBuildingTypeData}: ${error.message}`);
      throw error;
    }
  }

  @MessagePattern({ cmd: 'delete_building_type' })
  async delete(@Payload() id: number) {
    try {
      await this.buildingTypeService.delete(id);
      this.logger.log(`Building type with ID: ${id} deleted successfully`);

      return { message: 'Building type has been deleted' };
    } catch (error) {
      this.logger.error(`Error deleting building type with ID: ${id}: ${error.message}`);
      throw error;
    }
  }

  @MessagePattern({ cmd: 'all_building_types' })
  async findAll() {
    try {
      const result = await this.buildingTypeService.findAll();
      this.logger.log(`Retrieved building types: ${JSON.stringify(result)}`);

      return result;
    } catch (error) {
      this.logger.error(`Error retrieving building types: ${error.message}`);
      throw error;
    }
  }
}
