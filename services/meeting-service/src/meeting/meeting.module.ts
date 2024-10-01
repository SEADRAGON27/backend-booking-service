import { MeetingService } from './meeting.service';
import { MeetingController } from './meeting.controller';
import { Module } from '@nestjs/common';
import { MeetingRepository } from './repositories/meeting.repository';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MeetingUserRepository } from './repositories/meetingUser.repository';
import { DatabaseModule } from 'src/database/database.module';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from 'src/utils/exceptionFilter';
import { WinstonLoggerService } from 'src/logs/logger';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    DatabaseModule,
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'notification_queue',
          queueOptions: {
            durable: true,
            arguments: {
              'x-dead-letter-exchange': 'dlx_exchange',
              'x-dead-letter-routing-key': 'retry_queue',
            },
          },
        },
      },
    ]),
  ],
  controllers: [MeetingController],
  providers: [
    MeetingService,
    MeetingRepository,
    ConfigService,
    MeetingUserRepository,
    WinstonLoggerService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class MeetingModule {}
