import { Body, Controller, Delete, Get, HttpException, Inject, Param, Post, Put, Query, UploadedFiles, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard } from '../guards/jwtAuth.guard';
import { CreateRoomDto } from './dto/createRoom.dto';
import { catchError, timeout } from 'rxjs';
import { RolesGuard } from 'src/guards/checkRole.guard';
import { Roles } from 'src/decorators/role.decorator';
import { UpdateRoomDto } from './dto/updateRoom.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/configs/multer.config';
import { ParsedQs } from 'qs';

@Controller('rooms')
export class RoomController {
  constructor(
    @Inject('ROOM_SERVICE') private readonly client: ClientProxy,
    private readonly configService: ConfigService,
  ) {}

  @Post('/create')
  @UseGuards(new JwtAuthGuard(), RolesGuard)
  @Roles('admin')
  @UseInterceptors(FilesInterceptor('images', 10, multerConfig))
  @UsePipes(new ValidationPipe({ transform: true }))
  async createRoom(@Body() createRoomDto: CreateRoomDto, @UploadedFiles() files: Express.Multer.File[]) {
    const serializedFiles = files.map((file) => ({
      originalname: file.originalname,
      mimetype: file.mimetype,
      buffer: file.buffer.toString('base64'),
    }));

    return this.client.send({ cmd: 'create_room' }, { createRoomDto, serializedFiles }).pipe(
      timeout(5000),
      catchError((error) => {
        throw new HttpException(error.message, error.statusCode);
      }),
    );
  }

  @Put('/:id')
  @UsePipes(new ValidationPipe())
  @UseGuards(new JwtAuthGuard(), RolesGuard)
  @Roles('admin')
  updateRoom(@Param('id') id: string, updateRoomDto: UpdateRoomDto) {
    return this.client.send({ cmd: 'update_room' }, { id, updateRoomDto }).pipe(
      timeout(5000),
      catchError((error) => {
        throw new HttpException(error.message, error.statusCode);
      }),
    );
  }

  @Delete('/:id')
  @UseGuards(new JwtAuthGuard(), RolesGuard)
  @Roles('admin')
  deleteRoom(@Param('id') id: string) {
    return this.client.send({ cmd: 'delete_room' }, id.trim()).pipe(
      timeout(5000),
      catchError((error) => {
        throw new HttpException(error.message, error.statusCode);
      }),
    );
  }

  @Get('/all')
  findAll(@Query() query: ParsedQs) {
    return this.client.send({ cmd: 'all_rooms' }, query).pipe(
      timeout(5000),
      catchError((error) => {
        throw new HttpException(error.message, error.statusCode);
      }),
    );
  }

  @Get('/:id')
  getRoom(@Param('id') id: string) {
    return this.client.send({ cmd: 'get_room' }, id.trim()).pipe(
      timeout(5000),
      catchError((error) => {
        throw new HttpException(error.message, error.statusCode);
      }),
    );
  }
}
