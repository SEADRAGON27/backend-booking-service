import { Controller } from '@nestjs/common';
import { MeetingService } from './meeting.service';
import { Ctx, EventPattern, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { CreateMeeting } from 'src/interfaces/createMeeting.interface';
import { ParsedQs } from 'qs';
import { rmqAck } from 'src/utils/rmqAck';
import { MeetingUser } from '@prisma/client';
import { WinstonLoggerService } from 'src/logs/logger';
import { UserData } from 'src/interfaces/userData.interface';
import { exceptionType } from 'src/utils/exceptionType';

@Controller()
export class MeetingController {
  constructor(
    private readonly meetingService: MeetingService,
    private readonly logger: WinstonLoggerService,
  ) {}

  @MessagePattern({ cmd: 'create_meeting' })
  async createMeeting(@Payload('user') user: UserData, @Payload('createMeetingDto') createMeetingData: CreateMeeting, @Payload('logId') logId: string) {
    try {
      const meeting = await this.meetingService.createMeeting(user, createMeetingData, logId);
      this.logger.log(`Meeting created: ${JSON.stringify(meeting)}`);

      return meeting;
    } catch (error) {
      if (exceptionType(error)) this.logger.error(`Error creating meeting for user: ${user.id}, error: ${error.message}`);

      throw error;
    }
  }

  @MessagePattern({ cmd: 'delete_meeting' })
  async deleteMeeting(@Payload('user') user: MeetingUser, @Payload('id') id: string, @Payload('logId') logId: string) {
    try {
      await this.meetingService.deleteMeeting(id, user, logId);
      this.logger.log(`Meeting with Id: ${id} deleted`);

      return { message: 'Meeting deleted' };
    } catch (error) {
      if (exceptionType(error)) this.logger.error(`Error deleting meeting with ID: ${id}, error: ${error.message}`);

      throw error;
    }
  }

  @MessagePattern({ cmd: 'all_meetings' })
  async findAll(@Payload() query: ParsedQs) {
    try {
      const meetings = await this.meetingService.allMeetings(query);
      this.logger.log(`Found meetings with query: ${query}`);

      return meetings;
    } catch (error) {
      this.logger.error(`Error fetching meetings with query:${query}, error: ${error.message}`);
      throw error;
    }
  }

  @MessagePattern({ cmd: 'user_meetings' })
  async findUserMeetings(@Payload('query') query: ParsedQs, @Payload('id') id: string) {
    try {
      const meetings = await this.meetingService.allUserMeetings(query, id);
      this.logger.log(`Found meetings for user: ${id} with query:${query}`);

      return meetings;
    } catch (error) {
      this.logger.error(`Error fetching meetings for user: ${id} with query:${query}, error: ${error.message}`);
      throw error;
    }
  }

  @EventPattern('confirm_meeting')
  async confirmMeeting(@Payload() id: string, @Ctx() context: RmqContext) {
    try {
      await this.meetingService.confirmMeeting(id);

      rmqAck(context);

      this.logger.log(`Meeting with ID: ${id} confirmed`);
    } catch (error) {
      this.logger.error(`Error confirming meeting with id: ${id}, error: ${error.message}`);
      throw error;
    }
  }

  @EventPattern('delete_meeting_user')
  async deleteMeetingUser(@Payload() userId: string) {
    try {
      await this.meetingService.deleteMeetingUser(userId);
      this.logger.log(`Meetings for user with ID: ${userId} deleted`);
    } catch (error) {
      this.logger.error(`Error deleting meetings for user: ${userId}, error: ${error.message}`);
      throw error;
    }
  }

  @MessagePattern({ cmd: 'get_meeting' })
  async getMeeting(@Payload() id: string) {
    try {
      const meeting = await this.meetingService.getMeeting(id);
      this.logger.log(`Meeting fetched with id:${id}`);

      return meeting;
    } catch (error) {
      this.logger.error(`Error fetching meeting wuth id:${id}`);
      throw error;
    }
  }
}
