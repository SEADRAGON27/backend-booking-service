import { MessagePattern, Payload } from '@nestjs/microservices';
import { RoomService } from './services/room.service';
import { CreateRoom } from 'src/interface/createRoom.interface';
import { UpdateRoom } from 'src/interface/updateRoom.interface';
import { Controller } from '@nestjs/common';
import { DeserializedFiles } from 'src/interface/deserializedFile.interface';
import { SerializedFiles } from 'src/interface/serializedFIle.interface';
import { ParsedQs } from 'qs';
import { WinstonLoggerService } from 'src/logs/logger';
import { exceptionType } from 'utils/exceptionType';

@Controller()
export class RoomController {
  constructor(
    private readonly roomService: RoomService,
    private readonly logger: WinstonLoggerService,
  ) {}

  @MessagePattern({ cmd: 'create_room' })
  async createRoom(@Payload('createRoomDto') createRoomData: CreateRoom, @Payload('serializedFiles') serializedFiles: SerializedFiles[]) {
    const deserializedFiles: DeserializedFiles[] = serializedFiles.map((file) => ({
      ...file,
      buffer: Buffer.from(file.buffer, 'base64'),
    }));

    try {
      const room = await this.roomService.createRoom(createRoomData, deserializedFiles);
      this.logger.log(`Room created: ${JSON.stringify(room)}`);

      return room;
    } catch (error) {
      if (exceptionType(error)) this.logger.error('Error creating room: ' + error.message);

      throw error;
    }
  }

  @MessagePattern({ cmd: 'update_room' })
  async updateRoom(@Payload('id') id: string, @Payload('updateRoomDto') updateRoomData: UpdateRoom) {
    try {
      const updatedRoom = await this.roomService.updateRoom(id, updateRoomData);
      this.logger.log(`Room updated: ${JSON.stringify(updatedRoom)}`);

      return updatedRoom;
    } catch (error) {
      if (exceptionType(error)) this.logger.error(`Error updating room with Id: ${id}, error: ${error.message}`);

      throw error;
    }
  }

  @MessagePattern({ cmd: 'delete_room' })
  async deleteRoom(@Payload() id: string) {
    try {
      await this.roomService.deleteRoom(id);
      this.logger.log(`Room deleted with Id: ${id}`);

      return { message: 'Room has been deleted' };
    } catch (error) {
      if (exceptionType(error)) this.logger.error(`Error deleting room with Id: ${id}, error: ${error.message}`);

      throw error;
    }
  }

  @MessagePattern({ cmd: 'all_rooms' })
  async findAll(@Payload() query: ParsedQs) {
    try {
      const rooms = await this.roomService.findAll(query);
      this.logger.log(`Found rooms with query:${query}`);

      return rooms;
    } catch (error) {
      this.logger.error(`Error fetching rooms with query:${query}, error:${error.message}`);
      throw error;
    }
  }

  @MessagePattern({ cmd: 'get_room' })
  async getRoom(@Payload() id: string) {
    try {
      console.log(id);
      const room = await this.roomService.getRoom(id);

      this.logger.log(`Room found :${room}`);

      return room;
    } catch (error) {
      if (exceptionType(error)) this.logger.error(`Error getting room with id:${id}`);

      throw error;
    }
  }
}
