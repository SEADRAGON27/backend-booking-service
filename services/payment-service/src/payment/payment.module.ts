import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { WinstonLoggerService } from 'src/logs/logger';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from 'src/utils/exceptionFilter';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MEETING_EVENTS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'meeting_queue_events',
          queueOptions: {
            durable: true,
            arguments: {
              'x-dead-letter-exchange': 'dlx_exchange',
              'x-dead-letter-routing-key': 'retry_queue_meeting_events',
            },
          },
        },
      },
      {
        name: 'MEETING_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'meetings_event',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    ConfigService,
    WinstonLoggerService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class PaymentModule {}
