/* eslint-disable prefer-const */
import { Controller } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { WinstonLoggerService } from 'src/logs/logger';
import { exceptionType } from 'src/utils/exceptionType';

@Controller()
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly logger: WinstonLoggerService,
  ) {}

  @MessagePattern({ cmd: 'generate_webform' })
  async generatePaymentForm(@Payload('meetingId') meetingId: string, @Payload('amount') amount: number, @Payload('logId') logId: string) {
    try {
      const paymentForm = this.paymentService.generatePaymentForm(meetingId, amount);
      this.logger.log(`Payment form generated successfully,meetingId: ${meetingId}, amount:${amount},  logId:${logId}`);

      return paymentForm;
    } catch (error) {
      if (exceptionType(error)) this.logger.error(`Error generating paymentform for data: ${meetingId}`);

      throw error;
    }
  }

  @MessagePattern({ cmd: 'handle_liqPay_weebHook' })
  async handleLiqPayWebook(webhookData) {
    let meetingId: string | boolean;

    meetingId = await this.handleLiqPayWebook(webhookData);

    if (!meetingId) {
      this.logger.error(`Webhook handling failed for data: ${meetingId}`);

      return false;
    }

    this.logger.log(`Webhook handled successfully for ${meetingId}`);

    return true;
  }
}
