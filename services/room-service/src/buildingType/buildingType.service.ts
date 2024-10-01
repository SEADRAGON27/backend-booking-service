import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BuildingTypeRepository } from './buildingType.repository';
import { CreateBuildingType } from './interfaces/createBuildingType.interface';
import { UpdateBuildingType } from './interfaces/updateBuildingType.interfacce';

@Injectable()
export class BuildingTypeService {
  constructor(private readonly buildingTypeRepository: BuildingTypeRepository) {}

  async create(createBuildingTypeData: CreateBuildingType) {
    const buildingType = await this.buildingTypeRepository.findByName(createBuildingTypeData.name);

    if (buildingType) throw new HttpException('Name is taken', HttpStatus.UNPROCESSABLE_ENTITY);

    return await this.buildingTypeRepository.create(createBuildingTypeData);
  }

  async update(id: number, updateBuildingTypeData: UpdateBuildingType) {
    const buildingType = await this.buildingTypeRepository.findById(id);

    if (!buildingType) throw new HttpException("BuildingType doesn't exist", HttpStatus.UNPROCESSABLE_ENTITY);

    return await this.buildingTypeRepository.update(id, updateBuildingTypeData);
  }

  async delete(id: number) {
    const buildingType = await this.buildingTypeRepository.findById(id);

    if (!buildingType) throw new HttpException("BuildingType doesn't exist", HttpStatus.UNPROCESSABLE_ENTITY);

    await this.buildingTypeRepository.delete(id);
  }

  async findAll() {
    return await this.buildingTypeRepository.findAll();
  }
}
