import { Module } from '@nestjs/common';
import { MeetingModule } from './meeting/meeting.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MeetingModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
