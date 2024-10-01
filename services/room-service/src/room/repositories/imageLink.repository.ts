import { Injectable } from '@nestjs/common';
import { ImageLink, Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { DeserializedFiles } from 'src/interface/deserializedFile.interface';

@Injectable()
export class ImageLinkRepository {
  constructor(private prisma: PrismaService) {}

  async createMany(imageLinkData: Prisma.ImageLinkCreateManyInput[]) {
    return this.prisma.imageLink.createManyAndReturn({ data: imageLinkData });
  }

  async findMatches(files: DeserializedFiles[]): Promise<ImageLink[]> {
    return this.prisma.imageLink.findMany({
      where: {
        OR: files.map((file) => ({
          link: {
            contains: file.originalname,
          },
        })),
      },
    });
  }
}
