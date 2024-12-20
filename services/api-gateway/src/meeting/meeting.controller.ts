import { Body, Controller, Delete, Get, HttpException, Inject, Param, Post, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateMeetingDto } from './dto/createMeeting.dto';
import { catchError, timeout } from 'rxjs';
import { ParsedQs } from 'qs';
import { CurrentUser } from 'src/decorators/currentUser.decorator';
import { JwtAuthGuard } from 'src/guards/jwtAuth.guard';
import { RolesGuard } from 'src/guards/checkRole.guard';
import { Roles } from 'src/decorators/role.decorator';
import { JwtPayload } from 'src/interfaces/jwtPayload.interface';
import { v4 as uuidv4 } from 'uuid';

@Controller('/meetings')
export class MeetingController {
  constructor(@Inject('MEETING_SERVICE') private readonly meetingClient: ClientProxy) {}

  @Post('/create')
  @UseGuards(new JwtAuthGuard())
  @UsePipes(new ValidationPipe())
  createMeeting(@Body() createMeetingDto: CreateMeetingDto, @CurrentUser() user: JwtPayload) {
    const logId = uuidv4();

    return this.meetingClient.send({ cmd: 'create_meeting' }, { createMeetingDto, user, logId }).pipe(
      timeout(5000),
      catchError((error) => {
        throw new HttpException(error.message, error.statusCode);
      }),
    );
  }

  @Delete('/:id')
  @UseGuards(new JwtAuthGuard())
  deleteMeeting(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const logId = uuidv4();

    this.meetingClient.send({ cmd: 'delete_meeting' }, { id, logId, user }).pipe(
      timeout(5000),
      catchError((error) => {
        throw new HttpException(error.message, error.statusCode);
      }),
    );
  }

  @Get('/all')
  @UseGuards(new JwtAuthGuard(), RolesGuard)
  @Roles('admin')
  findAll(@Query() query: ParsedQs) {
    return this.meetingClient.send({ cmd: 'all_meetings' }, query).pipe(
      timeout(5000),
      catchError((error) => {
        throw new HttpException(error.message, error.statusCode);
      }),
    );
  }

  @Get('/user')
  @UseGuards(new JwtAuthGuard())
  findUserMeetings(@Query() query: ParsedQs, @CurrentUser('id') id: string) {
    return this.meetingClient.send({ cmd: 'user_meetings' }, { query, id }).pipe(
      timeout(5000),
      catchError((error) => {
        throw new HttpException(error.message, error.statusCode);
      }),
    );
  }
}
