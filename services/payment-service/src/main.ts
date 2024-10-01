import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule,{
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'payments_queue',
      queueOptions: {
       durable:true,
       arguments: {
        'x-dead-letter-exchange': 'dlx_exchange',    
        'x-dead-letter-routing-key': 'retry_queue',  
      },
      },
 },
  });
  
  await app.listen();
}
bootstrap();
