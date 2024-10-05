import { Injectable } from '@nestjs/common';
import { RefreshSession } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class RefreshSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { userId: string; refreshToken: string; fingerprint: string }): Promise<RefreshSession> {
    return this.prisma.refreshSession.create({ data });
  }

  async findByToken(refreshToken: string): Promise<RefreshSession | null> {
    return this.prisma.refreshSession.findFirst({ where: { refreshToken } });
  }

  async findByFingerprint(fingerprint: string): Promise<Pick<RefreshSession, 'refreshToken'> | null> {
    return this.prisma.refreshSession.findFirst({
      where: { fingerprint },
      select: { refreshToken: true },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.refreshSession.delete({ where: { id } });
  }

  async deleteByToken(refreshToken: string): Promise<void> {
    const session = await this.findByToken(refreshToken);

    if (session) {
      await this.delete(session.id);
    }
  }
}
