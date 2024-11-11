import { exceptionType } from 'src/utils/exceptionType';
import { ConfigService } from '@nestjs/config';
import { WinstonLoggerService } from 'src/logs/logger';

export function Log() {
  return function (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<any>) {
    const originalMethod = descriptor.value;
    const configService = new ConfigService();
    const winstonLoggerService = new WinstonLoggerService(configService);

    descriptor.value = async function (...args) {
      try {
        const result = await originalMethod.apply(this, args);

        winstonLoggerService.log(`Response from the function - ${propertyName} with data: ${JSON.stringify(args, null, 2)}`);

        return result;
      } catch (error) {
        if (exceptionType(error)) {
          winstonLoggerService.error(`Error in the function - ${propertyName} request : ${error.message} with data: ${JSON.stringify(args, null, 2)}`);
        }

        throw error;
      }
    };

    return descriptor;
  };
}
