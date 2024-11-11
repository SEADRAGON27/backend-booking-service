import { HttpException } from '@nestjs/common';

export function exceptionType(exception) {
  const status = exception instanceof HttpException ? exception.getStatus() : false;

  const message = exception instanceof HttpException ? exception.getResponse() : false;

  if (message && status) return false;

  return true;
}
