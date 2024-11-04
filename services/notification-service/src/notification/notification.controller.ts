import { Controller } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { CreateNotification } from 'src/interfaces/createNotification.interface';
import { Log } from 'src/decorators/log.decorator';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern('user_create_verification_email')
  @Log()
  async sendVerificationEmailUserCreate(@Payload('email') email: string, @Payload('token') token: string, @Payload('logId') logId: string, @Ctx() context: RmqContext) {
    await this.notificationService.sendVerificationEmailUserCreate(email, token);
  }

  @EventPattern('reset_password_varification_email')
  @Log()
  async sendVerificationEmailResetPassword(@Payload('email') email: string, @Payload('token') token: string, @Payload('logId') logId: string, @Ctx() context: RmqContext) {
    await this.notificationService.sendVerificationEmailResetPassword(email, token);
  }

  @EventPattern('create_notification')
  @Log()
  async createNotification(@Payload('createNotificationData') createNotificationData: CreateNotification, @Ctx() context: RmqContext) {
    await this.notificationService.createNotification(createNotificationData);
  }

  @EventPattern('delete_notification')
  @Log()
  async deleteNotification(@Payload('meetingId') meetingId: string, @Payload('logId') logId: string, @Ctx() context: RmqContext) {
    await this.notificationService.deleteNotification(meetingId);
  }
}
