import { Injectable } from "@nestjs/common";
import { MeetingUser, Prisma } from "@prisma/client";
import { PrismaService } from "src/database/prisma.service";

@Injectable()
export class MeetingUserRepository {
  constructor(private prisma: PrismaService) {}
  
  async create(createUserMeetingData:Prisma.MeetingUserCreateInput):Promise<MeetingUser> {
    return this.prisma.meetingUser.create({data:createUserMeetingData});
  }
  
  async delete(id:string) {
    return this.prisma.meetingUser.delete({where:{id}})

  }

  async findById(id:string){
    return this.prisma.meetingUser.findUnique({where:{id}})
  }
}