import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { BuildingTypeController } from './buildingType.controller';
import { BuildingTypeService } from './buildingType.service';
import { BuildingTypeRepository } from './buildingType.repository';
import { WinstonLoggerService } from 'src/logs/logger';

@Module({
  imports: [DatabaseModule],
  controllers: [BuildingTypeController],
  providers: [BuildingTypeService, BuildingTypeRepository, WinstonLoggerService],
})
export class BuildingTypeModule {}
