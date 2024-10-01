import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { Notification } from '@prisma/client';

@Injectable()
export class NotificationRepository {
  constructor(private prisma: PrismaService) {}

  async create(createNotificationData: Prisma.NotificationCreateInput) {
    await this.prisma.notification.create({ data: createNotificationData });
  }

  async findAll() {
    return await this.prisma.notification.findMany();
  }

  async delete(meetingId: string) {
    await this.prisma.notification.delete({ where: { meetingId } });
  }

  async findByMeetingId(meetingId: string): Promise<Notification> {
    return this.prisma.notification.findFirst({ where: { meetingId } });
  }
}
