/* eslint-disable prefer-const */
import { Controller } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { WinstonLoggerService } from 'src/logs/logger';
import { Log } from 'src/decorators/log.decorator';

@Controller()
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly logger: WinstonLoggerService,
  ) {}

  @MessagePattern({ cmd: 'generate_webform' })
  @Log()
  async generatePaymentForm(@Payload('meetingId') meetingId: string, @Payload('amount') amount: number, @Payload('logId') logId: string) {
    const paymentForm = this.paymentService.generatePaymentForm(meetingId, amount);
    this.logger.log(`Payment form generated successfully,meetingId: ${meetingId}, amount:${amount},  logId:${logId}`);

    return paymentForm;
  }

  @MessagePattern({ cmd: 'handle_liqPay_webhook' })
  @Log()
  async handleLiqPayWebook(webhookData) {
    let meetingId: string | boolean;

    meetingId = await this.handleLiqPayWebook(webhookData);

    if (!meetingId) {
      return false;
    }

    return true;
  }
}
