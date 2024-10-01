import { Module } from '@nestjs/common';
import { MeetingModule } from './meeting/meeting.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), MeetingModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
