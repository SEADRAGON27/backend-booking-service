import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DatabaseModule } from '../database/database.module';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RefreshSessionRepository } from './repositories/refreshSession.repository';
import { ResetPasswordRepository } from './repositories/resetPassword.repository';
import { UserRepository } from './repositories/user.repository';
import { APP_FILTER } from '@nestjs/core';
import { WinstonLoggerService } from 'src/logs/logger';
import { AllExceptionsFilter } from './utils/exceptionFilter';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({}),
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
      {
        name: 'MEETING_EVENTS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'meeting_queue_events',
          queueOptions: {
            durable: true,
          },
          noAck: false,
        },
      },
    ]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    ConfigService,
    RefreshSessionRepository,
    ResetPasswordRepository,
    UserRepository,
    WinstonLoggerService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class UserModule {}
