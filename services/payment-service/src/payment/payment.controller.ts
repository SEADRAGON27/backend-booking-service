/* eslint-disable prefer-const */
import { Controller } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { WinstonLoggerService } from 'src/logs/logger';

@Controller()
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly logger: WinstonLoggerService,
  ) {}

  @MessagePattern({ cmd: 'generate_webform' })
  async generatePaymentForm(@Payload('meetingId') meetingId: string, @Payload('amount') amount: number, @Payload('logId') logId: string) {
    const paymentForm = this.paymentService.generatePaymentForm(meetingId, amount);
    this.logger.log(`Payment form generated successfully,meetingId: ${meetingId}, amount:${amount},  logId:${logId}`);

    return paymentForm;
  }

  @MessagePattern({ cmd: 'handle_liqPay_weebHook' })
  async handleLiqPayWebook(webhookData) {
    let orderId: string | boolean;

    orderId = await this.handleLiqPayWebook(webhookData);

    if (!orderId) {
      this.logger.error(`Webhook handling failed for data: ${orderId}`);

      return false;
    }

    this.logger.log(`Webhook handled successfully for ${orderId}`);

    return true;
  }
}
