import { RmqContext } from '@nestjs/microservices';

export function rmqAck(context: RmqContext) {
  const channel = context.getChannelRef();
  const originalMessage = context.getMessage();
  channel.ack(originalMessage);
}
