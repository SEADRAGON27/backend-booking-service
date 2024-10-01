import { Type } from "class-transformer"
import { IsDate, IsNotEmpty } from "class-validator"


export class CreateMeetingDto {
    @IsNotEmpty()
    title:string
    
    @Type(() => Date)
    @IsDate()
    startTime: Date
    
    @Type(() => Date)
    @IsDate()
    endTime: Date
    
    @IsNotEmpty()
    roomId:string
}
