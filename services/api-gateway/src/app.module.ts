import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserController } from './user/user.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './starategy/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getJWTConfig } from './configs/jwt.config';
import { JwtAuthGuard } from './guard/jwtAuth.guard';
import { NestjsFingerprintModule } from 'nestjs-fingerprint';
import { GoogleStrategy } from './starategy/google.strategy';
import { GoogleGuard } from './guard/google.guard';
import { HttpModule } from '@nestjs/axios';
import { RoomController } from './room/room.controller';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { BuildingTypeController } from './buildingType/buildingType.controller';
import { MeetingController } from './meetings/meeting.controller';
import { PaymentController } from './payment/payment.controller';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MulterModule.register({
      storage: memoryStorage(),
    }),
    ClientsModule.register([
      {
        name: 'MEETING_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'meetings_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: 'USER_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'users_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: 'ROOM_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'rooms_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: 'PAYMENT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'payments_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getJWTConfig,
    }),
    PassportModule.register({ defaultStrategy: 'google' }),
    NestjsFingerprintModule.forRoot({
      params: ['headers', 'userAgent'],
    }),
    HttpModule,
  ],
  controllers: [UserController, RoomController, BuildingTypeController, MeetingController, PaymentController],
  providers: [JwtStrategy, ConfigService, JwtAuthGuard, GoogleStrategy, GoogleGuard],
})
export class AppModule {}
