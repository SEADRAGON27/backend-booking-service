import { ConfigService } from '@nestjs/config';
import { WinstonLoggerService } from 'src/logs/logger';
import { rmqAck } from 'src/utils/rmqAck';
import { rmqNack } from 'src/utils/rmqNack';

export function Log() {
  return function (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<any>) {
    const originalMethod = descriptor.value;
    const configService = new ConfigService();
    const winstonLoggerService = new WinstonLoggerService(configService);

    descriptor.value = async function (...args) {
      const context = args.pop();

      try {
        const result = await originalMethod.apply(this, args);
        rmqAck(context);
        winstonLoggerService.log(`Response from the function - ${propertyName} with data: ${JSON.stringify(args, null, 2)}`);

        return result;
      } catch (error) {
        rmqNack(context);
        winstonLoggerService.error(`Error in the function - ${propertyName} request : ${error.message} with data: ${JSON.stringify(args, null, 2)}`);

        //throw error;
      }
    };

    return descriptor;
  };
}
