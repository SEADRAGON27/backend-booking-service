import { RmqContext } from "@nestjs/microservices";

export function rmqNack(context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();
    channel.nack(originalMessage, false, false);
}