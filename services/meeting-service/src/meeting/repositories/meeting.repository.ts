import { Injectable } from '@nestjs/common';
import { Meeting, MeetingUser, Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class MeetingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMeetingData: Prisma.MeetingCreateInput): Promise<Meeting> {
    return this.prisma.meeting.create({ data: createMeetingData });
  }

  async update(id: string, updateMeetingData: Prisma.MeetingUpdateInput) {
    this.prisma.meeting.update({ where: { id }, data: updateMeetingData });
  }

  async checkAvailability(startTime: string, endTime: string, roomId: string) {
    return this.prisma.meeting.findMany({
      where: {
        roomId,
        startTime: {
          lte: new Date(startTime),
        },
        endTime: {
          gte: new Date(endTime),
        },
      },
    });
  }

  async findById(id: string): Promise<Meeting & { meetingUser: MeetingUser }> {
    return this.prisma.meeting.findUnique({
      where: { id },
      include: {
        meetingUser: true,
      },
    });
  }

  async delete(id: string) {
    await this.prisma.meeting.delete({ where: { id } });
  }

  async findAll(conditions) {
    return this.prisma.meeting.findMany({
      where: conditions,
    });
  }

  async findUserMeetings(conditions) {
    return this.prisma.meeting.findMany({
      where: conditions,
    });
  }
}
