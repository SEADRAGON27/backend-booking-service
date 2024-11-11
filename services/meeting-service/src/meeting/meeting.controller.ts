import { Controller } from '@nestjs/common';
import { MeetingService } from './meeting.service';
import { Ctx, EventPattern, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { CreateMeeting } from 'src/interfaces/createMeeting.interface';
import { ParsedQs } from 'qs';
import { MeetingUser } from '@prisma/client';
import { UserData } from 'src/interfaces/userData.interface';
import { Log } from 'src/decorators/log.decorator';

@Controller()
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @MessagePattern({ cmd: 'create_meeting' })
  @Log()
  async createMeeting(@Payload('user') user: UserData, @Payload('createMeetingDto') createMeetingData: CreateMeeting, @Payload('logId') logId: string) {
    const meeting = await this.meetingService.createMeeting(user, createMeetingData, logId);

    return meeting;
  }

  @MessagePattern({ cmd: 'delete_meeting' })
  @Log()
  async deleteMeeting(@Payload('user') user: MeetingUser, @Payload('id') id: string, @Payload('logId') logId: string) {
    await this.meetingService.deleteMeeting(id, user, logId);

    return { message: 'Meeting deleted' };
  }

  @MessagePattern({ cmd: 'all_meetings' })
  @Log()
  async findAll(@Payload() query: ParsedQs) {
    const meetings = await this.meetingService.allMeetings(query);

    return meetings;
  }

  @MessagePattern({ cmd: 'user_meetings' })
  @Log()
  async findUserMeetings(@Payload('query') query: ParsedQs, @Payload('id') id: string) {
    const meetings = await this.meetingService.allUserMeetings(query, id);

    return meetings;
  }

  @EventPattern('confirm_meeting')
  async confirmMeeting(@Payload() id: string, @Ctx() context: RmqContext) {
    await this.meetingService.confirmMeeting(id);
  }

  @EventPattern('delete_meeting_user')
  @Log()
  async deleteMeetingUser(@Payload() userId: string, @Ctx() context: RmqContext) {
    await this.meetingService.deleteMeetingUser(userId);
  }

  @MessagePattern({ cmd: 'get_meeting' })
  @Log()
  async getMeeting(@Payload() id: string) {
    const meeting = await this.meetingService.getMeeting(id);

    return meeting;
  }
}
