import { Module } from '@nestjs/common';
import { RoomModule } from './room/room.module';
import { ConfigModule } from '@nestjs/config';
import { BuildingTypeModule } from './buildingType/buildingType.module';

@Module({
  imports: [
    RoomModule,
    BuildingTypeModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
