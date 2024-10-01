import { Body, Controller, Get, HttpException, Inject, Param, Post, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, timeout } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Controller()
export class PaymentController {
  constructor(@Inject('PAYMENT_SERVICE') private readonly paymentClient: ClientProxy) {}

  @Get('/pay/:meetingId')
  generatePaymentForm(@Param('meetingId') meetingId: string, @Query('amount') amount: number) {
    const logId = uuidv4();

    return this.paymentClient.send({ cmd: 'generate_webform' }, { meetingId, amount, logId }).pipe(
      timeout(5000),
      catchError((error) => {
        throw new HttpException(error.message, error.statusCode);
      }),
    );
  }

  @Post('handle-webhook')
  handleLiqPayWebhook(@Body() webhookData) {
    this.paymentClient.send({ cmd: 'generate_webform' }, webhookData).pipe(timeout(5000));
  }
}
