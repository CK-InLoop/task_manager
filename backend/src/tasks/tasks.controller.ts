import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTasksDto } from './dto/filter-tasks.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto, @Req() req: Request) {
    const user = req.user as { userId: string; email: string; role: string };
    return this.tasksService.create(createTaskDto, user.userId);
  }

  @Get()
  async findAll(@Query() filters: FilterTasksDto, @Req() req: Request) {
    const user = req.user as { userId: string; email: string; role: string };
    return this.tasksService.findAll(filters, user.userId, user.role);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { userId: string; email: string; role: string };
    return this.tasksService.findOne(id, user.userId, user.role);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: string; email: string; role: string };
    return this.tasksService.update(id, updateTaskDto, user.userId, user.role);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { userId: string; email: string; role: string };
    return this.tasksService.delete(id, user.userId, user.role);
  }
}
