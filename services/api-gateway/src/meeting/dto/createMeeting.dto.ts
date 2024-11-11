import { IsNotEmpty } from 'class-validator';

export class CreateMeetingDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  startTime: Date;

  @IsNotEmpty()
  endTime: Date;

  @IsNotEmpty()
  roomId: string;
}
