import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateRoom } from 'src/interfaces/createRoom.interface';
import { RoomRepository } from '../repositories/room.repository';
import { Room } from '@prisma/client';
import { UpdateRoom } from 'src/interfaces/updateRoom.interface';
import { S3Service } from 'src/room/services/s3.service';
import { DeserializedFiles } from 'src/interfaces/deserializedFile.interface';
import { ImageLinkRepository } from '../repositories/imageLink.repository';
import { RoomImageLinkRepository } from '../repositories/roomIMageLink.repository';
import { PrismaService } from 'src/database/prisma.service';
import { ParsedQs } from 'qs';

@Injectable()
export class RoomService {
  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly imageLinkRepository: ImageLinkRepository,
    private readonly roomImageLinkRepository: RoomImageLinkRepository,
    private readonly s3Service: S3Service,
    private readonly prisma: PrismaService,
  ) {}

  async createRoom(createRoomData: CreateRoom, files: DeserializedFiles[]): Promise<Room> {
    const room = await this.roomRepository.findByName(createRoomData.name);

    if (room) throw new HttpException('Name is taken', HttpStatus.UNPROCESSABLE_ENTITY);

    const createdRoom = await this.roomRepository.create(createRoomData);

    const imageLinks = await this.s3Service.uploadImages(files);

    const createdImageLinks = await this.imageLinkRepository.createMany(imageLinks);

    const roomWithImages = createdImageLinks.map(async (link) => {
      const roomWithImages = await this.roomImageLinkRepository.create(createdRoom, link);

      return roomWithImages;
    });

    await Promise.all(roomWithImages);

    return await this.roomRepository.findById(createdRoom.id);
  }

  async updateRoom(id: string, updateRoomData: UpdateRoom): Promise<Room> {
    const room = await this.roomRepository.findById(id);

    if (!room) throw new HttpException("Room doesn't exist", HttpStatus.UNPROCESSABLE_ENTITY);

    return await this.roomRepository.update(id, updateRoomData);
  }

  async deleteRoom(id: string) {
    const room = await this.roomRepository.findById(id);

    if (!room) throw new HttpException("Room doesn't exist", HttpStatus.UNPROCESSABLE_ENTITY);

    const { imageLinks } = room;

    await this.s3Service.deleteImages(imageLinks);

    const imageLinksByRoomId = await this.imageLinkRepository.findImageLinksByRoomId(room.id);

    const imageLinkIds = imageLinksByRoomId.map((imageLink) => imageLink.id);

    await this.imageLinkRepository.deleteAll(imageLinkIds);

    await this.roomRepository.delete(id);
  }

  async findAll(query: ParsedQs) {
    const conditions = {
      ...this.addLocation(query),
      ...this.addType(query),
      ...this.addCapacity(query),
      ...this.addPrice(query),
    };

    const pageSize = 20;
    const rooms = await this.roomRepository.findAll(conditions);

    const hasNextPage = rooms.length > pageSize;

    if (hasNextPage) rooms.pop();

    const nextCursor = hasNextPage ? rooms[rooms.length - 1].id : null;

    return { rooms, nextCursor };
  }

  addLocation(query: ParsedQs) {
    if (query.location) {
      return { location: { contains: query.location, mode: 'insensitive' } };
    }

    return {};
  }

  addType(query: ParsedQs) {
    if (query.type) {
      return { type: query.type };
    }

    return {};
  }

  addCapacity(query: ParsedQs) {
    if (query.capacity) {
      const capacity = query.capacity as string;
      const capacitySorted = capacity.split('-');

      return {
        capacity: {
          gte: capacitySorted[0],
          lte: capacitySorted[1],
        },
      };
    }

    return {};
  }

  addPrice(query: ParsedQs) {
    if (query.price) {
      const price = query.price as string;
      const priceSorted = price.split('-');

      return {
        OR: [
          {
            originalPrice: {
              gte: priceSorted[0],
              lte: priceSorted[1],
            },
          },
          {
            discountedPrice: {
              gte: priceSorted[0],
              lte: priceSorted[1],
            },
          },
        ],
      };
    }

    return {};
  }

  async getRoom(id: string) {
    const room = await this.roomRepository.findById(id);

    if (!room) throw new HttpException("Room doesn't exist", HttpStatus.UNPROCESSABLE_ENTITY);

    return room;
  }
}
