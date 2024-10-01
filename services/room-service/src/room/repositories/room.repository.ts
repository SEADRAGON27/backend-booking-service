/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { Room } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { ImageLinks } from 'src/interface/imageLinks.interface';
import { CreateRoom } from 'src/interface/createRoom.interface';

@Injectable()
export class RoomRepository {
  constructor(private prisma: PrismaService) {}

  async create(createRoomData: CreateRoom): Promise<Room> {
    const { buildingTypeId, originalPrice, discountedPrice, ...rest } = createRoomData;

    const originalPriceDecimal = new Prisma.Decimal(createRoomData.originalPrice as number);
    const discountedPriceDecimal = createRoomData.discountedPrice ? new Prisma.Decimal(createRoomData.discountedPrice as number) : null;

    return this.prisma.room.create({
      data: {
        ...rest,
        originalPrice: originalPriceDecimal,
        discountedPrice: discountedPriceDecimal,
        buildingType: {
          connect: { id: +buildingTypeId },
        },
      },
    });
  }

  async findByName(name: string): Promise<Room> {
    return this.prisma.room.findUnique({ where: { name } });
  }

  async findById(id: string): Promise<Room & ImageLinks> {
    return this.prisma.room.findUnique({
      where: { id },
      include: {
        imageLinks: {
          select: {
            imageLink: {
              select: {
                link: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, roomData: Prisma.RoomUpdateInput): Promise<Room> {
    return this.prisma.room.update({ where: { id }, data: roomData });
  }

  async delete(id: string) {
    await this.prisma.room.delete({ where: { id } });
  }

  async findAll(conditions) {
    return this.prisma.room.findMany({
      where: conditions,
      include: {
        imageLinks: {
          select: {
            imageLink: {
              select: {
                link: true,
              },
            },
          },
        },
      },
    });
  }
}
