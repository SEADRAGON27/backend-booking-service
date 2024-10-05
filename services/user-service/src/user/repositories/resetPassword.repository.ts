import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { ResetPassword } from '@prisma/client';
import { ResetPasswordWithUser } from '../types/resetPassword.type';

@Injectable()
export class ResetPasswordRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { userId: string; token: string; expiresAt: Date }): Promise<ResetPassword> {
    return this.prisma.resetPassword.create({ data });
  }

  async findByToken(token: string): Promise<ResetPasswordWithUser> {
    return this.prisma.resetPassword.findFirst({
      where: { token },
      include: { user: true },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.resetPassword.delete({ where: { id } });
  }
}
