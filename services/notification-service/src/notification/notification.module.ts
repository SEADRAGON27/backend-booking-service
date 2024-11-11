import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationRepository } from './notification.repository';
import { MailerModule } from '@nestjs-modules/mailer';
import { mailerConfig } from 'src/configs/mail.config';
import { DatabaseModule } from 'src/database/database.module';
import { WinstonLoggerService } from 'src/logs/logger';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    DatabaseModule,
    ScheduleModule.forRoot(),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: mailerConfig,
    }),
  ],
  controllers: [NotificationController],
  providers: [ConfigService, NotificationService, NotificationRepository, WinstonLoggerService],
  exports: [WinstonLoggerService],
})
export class NotificationModule {}
