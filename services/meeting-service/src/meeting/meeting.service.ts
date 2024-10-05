/* eslint-disable @typescript-eslint/no-unused-vars */

import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CreateMeeting } from 'src/interfaces/createMeeting.interface';
import { MeetingRepository } from './repositories/meeting.repository';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, timeout } from 'rxjs';
import { ParsedQs } from 'qs';
import { Meeting, MeetingUser } from '@prisma/client';
import { MeetingUserRepository } from './repositories/meetingUser.repository';
import { WinstonLoggerService } from 'src/logs/logger';
import { UserData } from 'src/interfaces/userData.interface';

@Injectable()
export class MeetingService {
  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly meetingUserRepository: MeetingUserRepository,
    private readonly logger: WinstonLoggerService,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
  ) {}

  async createMeeting(user: UserData, createMeetingData: CreateMeeting, logId: string) {
    const { title, roomId, startTime, endTime } = createMeetingData;

    const isRoomAvailable = await this.meetingRepository.checkAvailability(startTime, endTime, roomId);

    if (isRoomAvailable.length > 0) throw new RpcException({ message: 'Room is not available for the selected time', statusCode: HttpStatus.FORBIDDEN });

    const meetingUser = await this.meetingUserRepository.findById(user.id);

    const { email, username, ...userWitoutEmail } = user;

    if (!meetingUser) await this.meetingUserRepository.create(userWitoutEmail);

    const meetingData = {
      title,
      roomId,
      startTime,
      endTime,
      meetingUser: {
        connect: { id: meetingUser.id },
      },
    };

    const meeting = await this.meetingRepository.create(meetingData);
    this.notificationClient.emit('create_notification', { startTime, endTime, email, title, userId: meetingUser.id, meetingId: meeting.id, logId }).pipe(
      timeout(5000),
      catchError(async () => this.logger.error('Notification service is unavailable!')),
    );

    return meeting;
  }

  async deleteMeeting(id: string, user: MeetingUser, logId: string) {
    const meeting = await this.meetingRepository.findById(id);

    if (!meeting) throw new HttpException("Meeting doesn't exist", HttpStatus.NOT_FOUND);

    if (meeting.meetingUser.id !== user.id && meeting.meetingUser.role !== 'admin') throw new HttpException('You are not the meeting organizer', HttpStatus.FORBIDDEN);

    await this.meetingRepository.delete(id);
    this.notificationClient.emit('delete_notification', { id, logId }).pipe(
      timeout(5000),
      catchError(async () => this.logger.error('Notification service is unavailable!')),
    );
  }

  async allUserMeetings(query: ParsedQs, userId: string) {
    const conditions = {
      ...this.addEarliestMeetings(query),
      ...this.addLatestMeeting(query),
      ...this.addStatusConfirmed(query),
      ...this.addStatusPending(query),
      userId,
    };

    const meetings = await this.meetingRepository.findUserMeetings(conditions);

    return this.pagination(meetings);
  }

  pagination(meetings: Meeting[]) {
    const pageSize = 20;
    const hasNextPage = meetings.length > pageSize;

    if (hasNextPage) meetings.pop();

    const nextCursor = hasNextPage ? meetings[meetings.length - 1].id : null;

    return { meetings, nextCursor };
  }

  async allMeetings(query: ParsedQs) {
    const conditions = {
      ...this.addEarliestMeetings(query),
      ...this.addLatestMeeting(query),
      ...this.addStatusConfirmed(query),
      ...this.addStatusPending(query),
    };

    const meetings = await this.meetingRepository.findAll(conditions);

    return this.pagination(meetings);
  }

  addEarliestMeetings(query: ParsedQs) {
    if (query.typeMeetings === 'earliest') {
      return { orderBy: { startTime: 'asc' } };
    }

    return {};
  }

  addLatestMeeting(query: ParsedQs) {
    if (query.typeMeetings === 'last') {
      return { orderBy: { startTime: 'desc' } };
    }

    return {};
  }

  addStatusConfirmed(query: ParsedQs) {
    if (query.status === 'confirmed') {
      return { where: { status: query.status } };
    }

    return {};
  }

  addStatusPending(query: ParsedQs) {
    if (query.status === 'pending') {
      return { where: { status: query.status } };
    }

    return {};
  }

  async confirmMeeting(id: string) {
    const meeting = await this.meetingRepository.findById(id);

    if (!meeting) return;

    await this.meetingRepository.update(id, { status: 'confirmed' });
  }

  async deleteMeetingUser(userId: string) {
    await this.meetingUserRepository.delete(userId);
  }

  async getMeeting(id: string) {
    return await this.meetingRepository.findById(id);
  }
}
