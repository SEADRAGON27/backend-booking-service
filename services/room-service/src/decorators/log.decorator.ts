import { exceptionType } from 'utils/exceptionType';
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

        winstonLoggerService.log(`Response for FUNCTION - ${propertyName} with data: ${JSON.stringify(args, null, 2)}`);

        return result;
      } catch (error) {
        if (exceptionType(error)) {
          winstonLoggerService.error(`Error in request to FUNCTION - ${propertyName}: ${error.message} with data: ${JSON.stringify(args, null, 2)}`);
        }

        throw error;
      }
    };

    return descriptor;
  };
}
