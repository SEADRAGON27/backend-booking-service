import { Body, Controller, Delete, Get, HttpException, Inject, Param, Post, Put, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Roles } from 'src/decorators/role.decorator';
import { JwtAuthGuard } from 'src/guard/jwtAuth.guard';
import { CreateBuildingTypeDto } from './dto/createBuildingType.dto';
import { catchError, timeout } from 'rxjs';
import { UpdateBuildingTypeDto } from './dto/updateBuildingType.dto';
import { RolesGuard } from 'src/guard/checkRole.guard';

@Controller('/building-types')
export class BuildingTypeController {
  constructor(@Inject('ROOM_SERVICE') private readonly client: ClientProxy) {}

  @Post('/create')
  @UseGuards(new JwtAuthGuard(), RolesGuard)
  @Roles('admin')
  @UsePipes(new ValidationPipe())
  async create(@Body() createBuildingTypesDto: CreateBuildingTypeDto) {
    return this.client.send({ cmd: 'create_building_type' }, createBuildingTypesDto).pipe(
      timeout(5000),
      catchError((error) => {
        throw new HttpException(error.message, error.statusCode);
      }),
    );
  }

  @Put('/:ids')
  @UseGuards(new JwtAuthGuard(), RolesGuard)
  @Roles('admin')
  @UsePipes(new ValidationPipe())
  async update(@Body() updateBuildingTypesDto: UpdateBuildingTypeDto, @Param('ids') ids: number) {
    const id = +ids;

    return this.client.send({ cmd: 'update_building_type' }, { updateBuildingTypesDto, id }).pipe(
      timeout(5000),
      catchError((error) => {
        throw new HttpException(error.message, error.statusCode);
      }),
    );
  }

  @Delete('/:id')
  @UseGuards(new JwtAuthGuard(), RolesGuard)
  @Roles('admin')
  @UsePipes(new ValidationPipe())
  async delete(@Param('id') id: number) {
    return this.client.send({ cmd: 'delete_building_type' }, +id).pipe(
      timeout(5000),
      catchError((error) => {
        throw new HttpException(error.message, error.statusCode);
      }),
    );
  }

  @Get('/all')
  async findAll() {
    return this.client.send({ cmd: 'all_building_type' }, {}).pipe(
      timeout(5000),
      catchError((error) => {
        throw new HttpException(error.message, error.statusCode);
      }),
    );
  }
}
