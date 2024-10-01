import { Controller, Inject,  } from '@nestjs/common';
import { Logger } from 'winston';
import { NotificationService } from './notification.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { CreateNotification } from 'src/interfaces/createNotification.interface';
import { rmqAck } from 'src/utils/rmqAck';
import { rmqNack } from 'src/utils/rmqNack';
import { WinstonLoggerService } from 'src/logs/logger';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService,private readonly logger: WinstonLoggerService ) {}

  @EventPattern('user_create_verification_email')
  async sendVerificationEmailUserCreate(
    @Payload('email') email:string,@Payload('token') 
    token:string,@Payload('logId') logId:string,@Ctx() context: RmqContext) {
    try{
    
    await this.notificationService.sendVerificationEmailUserCreate(email,token);
    rmqAck(context);
    this.logger.log(`Verification email has been sent to user's email:${email} , logId:${logId}`);
    
    }catch(error){
     
      rmqNack(context);
      this.logger.log(`Error sending verification email to user's email:${email} , logId:${logId}, error:${error.message}`)
    
    }
  }
  
  @EventPattern('reset_password_varification_email')
  async sendVerificationEmailResetPassword(
    @Payload('email') email:string,@Payload('token') token:string,
    @Payload('logId') logId:string, @Ctx() context: RmqContext){
    try{
    
    await this.notificationService.sendVerificationEmailResetPassword(email,token);
    rmqAck(context);
    
    this.logger.log(`Reset password email has been sent to user's email: ${email}, logId: ${logId}`);
    
    }catch(error){
      
      rmqNack(context);
      this.logger.error(`Error sending reset password email to user's email: ${email}, logId: ${logId}, error: ${error.message}`);
    
    }
  }

  @EventPattern('create_notification')
  async createNotification(@Payload() createNotificationData:CreateNotification,@Payload('logId') logId:string , @Ctx() context: RmqContext){
    try{
      
    await this.notificationService.createNotification(createNotificationData);
    rmqAck(context);
    
    this.logger.log(`Notification created successfully for data: ${JSON.stringify(createNotificationData)},logId:${logId}`);
    
    }catch(error){
      
      rmqNack(context);
      this.logger.error(`Error creating notification for data: ${JSON.stringify(createNotificationData)},logId:${logId}, error:${error.message}`);
    
    }
   
  }
  
  @EventPattern('delete_notification')
  async deleteNotification(@Payload() meetingId:string,@Payload('logId') logId:string, @Ctx() context: RmqContext){
    try{
    
    await this.notificationService.deleteNotification(meetingId);
    rmqAck(context);
    
    this.logger.log(`Notification deleted successfully for meetingId: ${meetingId},logId:${logId}`);
    
    }catch(error){

      rmqNack(error);
      this.logger.log(`Error deleting notification for meetingId: ${meetingId},logId:${logId}, error: ${error.message}`);
    
    }
  }

}