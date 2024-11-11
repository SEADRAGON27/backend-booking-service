/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateNotification } from 'src/interfaces/createNotification.interface';
import { NotificationRepository } from './notification.repository';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class NotificationService {
  private readonly host: string;
  private readonly fromEmail: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationRepository: NotificationRepository,
    private readonly mailerService: MailerService,
  ) {
    this.host = this.configService.get<string>('HOST');
    this.fromEmail = this.configService.get<string>('FROM_EMAIL');
  }

  async sendVerificationEmailUserCreate(email: string, token: string) {
    const mailOptions = {
      from: this.fromEmail,
      to: email,
      subject: 'Confirm Email Address',
      text: `Please click on the link to confirm email ${this.host}confirm-email?token=${token}`,
    };

    await this.mailerService.sendMail(mailOptions);
  }

  async sendVerificationEmailResetPassword(email: string, token: string) {
    const mailOptions = {
      from: this.fromEmail,
      to: email,
      subject: 'Confirm Email Address',
      text: `To reset your password, please click the following link: 
             ${this.host}reset-password?token=${token}`,
    };

    await this.mailerService.sendMail(mailOptions);
  }

  async createNotification(createNotificationData: CreateNotification) {
    const notificationData = {
      ...createNotificationData,
      message: `
          Meeting Reminder

          You have a meeting title \`${createNotificationData.title}\` starting in 1 hour.

         Start time: \`${createNotificationData.startTime}\`
         End time: \`${createNotificationData.endTime}\`
         `,
    };

    const { endTime, ...rest } = notificationData;
    await this.notificationRepository.create(rest);
  }

  async deleteNotification(meetingId: string) {
    const notification = await this.notificationRepository.findByMeetingId(meetingId);

    if (!notification) return;

    await this.notificationRepository.delete(meetingId);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async sendRemainder() {
    const currentTime = new Date();
    const twelveHoursFromNow = new Date();
    twelveHoursFromNow.setHours(currentTime.getHours() + 12);

    const notifications = await this.notificationRepository.findAll();

    const upcomingMeetings = notifications.filter((meeting) => {
      const meetingStartTime = new Date(meeting.startTime);

      return meetingStartTime >= currentTime && meetingStartTime <= twelveHoursFromNow;
    });

    for (const meeting of upcomingMeetings) {
      const mailOptions = {
        from: this.fromEmail,
        to: meeting.email,
        subject: 'Meeting Remainder',
        text: meeting.message,
      };

      await this.mailerService.sendMail(mailOptions);
      const meetingId = meeting.meetingId;
      await this.notificationRepository.delete(meetingId);
    }
  }
}
