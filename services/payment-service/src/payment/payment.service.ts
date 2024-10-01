import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { getHtmlForm } from 'src/utils/getHtmlForm';
import * as crypto from 'crypto';
import { catchError, timeout } from 'rxjs';
import { WinstonLoggerService } from 'src/logs/logger';

@Injectable()
export class PaymentService {
  private liqPayPrivateKey: string;
  constructor(
    @Inject('MEETING_EVENTS_SERVICE') private readonly meetingClient: ClientProxy,
    private readonly logger: WinstonLoggerService,
    private readonly configService: ConfigService,
  ) {
    this.liqPayPrivateKey = this.configService.get<string>('LIQ_PAY_PRIVATE_KEY');
  }

  generatePaymentForm(meetingId: string, amount: number) {
    const paymentData = {
      version: 3,
      public_key: this.configService.get<string>('LIQ_PAY_PUBLIC_KEY'),
      action: 'pay',
      amount: amount,
      currency: 'USD',
      description: 'Payment',
      order_id: meetingId,
      server_url: this.configService.get<string>('SERVER_CALLBACK'),
    };

    const data = Buffer.from(JSON.stringify(paymentData)).toString('base64');

    const signature = this.strToSign(this.liqPayPrivateKey + data + this.liqPayPrivateKey);

    const htmlForm = getHtmlForm(signature, data);

    return htmlForm;
  }

  strToSign(str: string) {
    const sha1 = crypto.createHash('sha1');
    sha1.update(str);

    return sha1.digest('base64');
  }

  async handleLiqPayWebhook(webHookData) {
    const data = webHookData.data;
    const signature = webHookData.signature;

    const calculatedSignature = this.strToSign(this.liqPayPrivateKey + data + this.liqPayPrivateKey);

    if (signature === calculatedSignature) {
      const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
      const meetingId: string = decodedData.order_id;

      if (decodedData.status === 'success') {
        this.meetingClient.emit('confirm_meeting', meetingId).pipe(
          timeout(5000),
          catchError(async () => this.logger.error('Meeting service is unavailable!')),
        );

        return meetingId;
      }

      return false;
    }

    return false;
  }
}
