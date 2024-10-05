import { Injectable } from '@nestjs/common';
import { ImageLink, Room } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class RoomImageLinkRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(room: Room, imageLink: ImageLink) {
    return this.prisma.roomImageLink.create({
      data: {
        roomId: room.id,
        imageLinkId: imageLink.id,
      },
    });
  }
}
