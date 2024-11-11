import { MessagePattern, Payload } from '@nestjs/microservices';
import { RoomService } from './services/room.service';
import { CreateRoom } from 'src/interfaces/createRoom.interface';
import { UpdateRoom } from 'src/interfaces/updateRoom.interface';
import { Controller, HttpException } from '@nestjs/common';
import { DeserializedFiles } from 'src/interfaces/deserializedFile.interface';
import { SerializedFiles } from 'src/interfaces/serializedFIle.interface';
import { ParsedQs } from 'qs';
import { Log } from 'src/decorators/log.decorator';

@Controller()
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @MessagePattern({ cmd: 'create_room' })
  @Log()
  async createRoom(@Payload('createRoomDto') createRoomData: CreateRoom, @Payload('serializedFiles') serializedFiles: SerializedFiles[]) {
    const deserializedFiles: DeserializedFiles[] = serializedFiles.map((file) => ({
      ...file,
      buffer: Buffer.from(file.buffer, 'base64'),
    }));

    const room = await this.roomService.createRoom(createRoomData, deserializedFiles);*/
  
    return room;
  }

  @MessagePattern({ cmd: 'update_room' })
  @Log()
  async updateRoom(@Payload('id') id: string, @Payload('updateRoomDto') updateRoomData: UpdateRoom) {
    const updatedRoom = await this.roomService.updateRoom(id, updateRoomData);

    return updatedRoom;
  }

  @MessagePattern({ cmd: 'delete_room' })
  @Log()
  async deleteRoom(@Payload() id: string) {
    await this.roomService.deleteRoom(id);

    return { message: 'Room has been deleted' };
  }

  @MessagePattern({ cmd: 'all_rooms' })
  @Log()
  async findAll(@Payload() query: ParsedQs) {
    const rooms = await this.roomService.findAll(query);

    return rooms;
  }

  @MessagePattern({ cmd: 'get_room' })
  @Log()
  async getRoom(@Payload() id: string) {
    const room = await this.roomService.getRoom(id);

    return room;
  }
}
