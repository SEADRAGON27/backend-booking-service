import { Injectable } from '@nestjs/common';
import { BuildingType, Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class BuildingTypeRepository {
  constructor(private prisma: PrismaService) {}

  async create(createBuildingTypeData: Prisma.BuildingTypeCreateInput): Promise<BuildingType> {
    return this.prisma.buildingType.create({ data: createBuildingTypeData });
  }

  async update(id: number, updateBuildingTypeData: Prisma.BuildingTypeUpdateInput): Promise<BuildingType> {
    return this.prisma.buildingType.update({ where: { id }, data: updateBuildingTypeData });
  }

  async delete(id: number) {
    await this.prisma.buildingType.delete({ where: { id } });
  }

  async findAll(): Promise<BuildingType[]> {
    return this.prisma.buildingType.findMany();
  }

  async findByName(name: string): Promise<BuildingType> {
    return this.prisma.buildingType.findUnique({ where: { name } });
  }

  async findById(id: number): Promise<BuildingType> {
    return this.prisma.buildingType.findUnique({ where: { id } });
  }
}
