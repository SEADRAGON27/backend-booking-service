import { Module } from '@nestjs/common';
import { RoomService } from './services/room.service';
import { RoomRepository } from './repositories/room.repository';
import { RoomController } from './room.controller';
import { DatabaseModule } from 'src/database/database.module';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from 'src/utils/exceptionFilter';
import { ImageLinkRepository } from './repositories/imageLink.repository';
import { ConfigService } from '@nestjs/config';
import { RoomImageLinkRepository } from './repositories/roomIMageLink.repository';
import { S3Service } from './services/s3.service';
import { WinstonLoggerService } from 'src/logs/logger';

@Module({
  imports: [DatabaseModule],
  controllers: [RoomController],
  providers: [
    RoomService,
    RoomRepository,
    ImageLinkRepository,
    RoomImageLinkRepository,
    S3Service,
    ConfigService,
    WinstonLoggerService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class RoomModule {}
