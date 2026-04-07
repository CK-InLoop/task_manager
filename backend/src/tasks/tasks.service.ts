import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument } from './task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTasksDto } from './dto/filter-tasks.dto';
import { EventsGateway } from '../gateway/events.gateway';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    private eventsGateway: EventsGateway,
  ) {}

  async create(
    createTaskDto: CreateTaskDto,
    userId: string,
  ): Promise<TaskDocument> {
    const task = new this.taskModel({
      ...createTaskDto,
      user: new Types.ObjectId(userId),
      assignedTo: createTaskDto.assignedTo
        ? new Types.ObjectId(createTaskDto.assignedTo)
        : null,
    });

    const savedTask = await task.save();
    const populated = await savedTask.populate([
      { path: 'user', select: 'username email' },
      { path: 'assignedTo', select: 'username email' },
    ]);

    // Emit WebSocket event
    this.eventsGateway.emitTaskCreated(populated);

    return populated;
  }

  async findAll(
    filters: FilterTasksDto,
    userId: string,
    role: string,
  ): Promise<TaskDocument[]> {
    const query: any = {};

    // RBAC: Members see only their own tasks (created by them or assigned to them)
    if (role !== 'admin') {
      const userObjectId = new Types.ObjectId(userId);
      query.$or = [{ user: userObjectId }, { assignedTo: userObjectId }];
    }

    // Apply filters
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.priority) {
      query.priority = filters.priority;
    }
    if (filters.search) {
      query.title = { $regex: filters.search, $options: 'i' };
    }

    // Build sort
    const sortField = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortField]: sortOrder };

    // Priority sort mapping for logical ordering
    if (sortField === 'priority') {
      return this.taskModel
        .find(query)
        .populate('user', 'username email')
        .populate('assignedTo', 'username email')
        .sort(sort)
        .exec()
        .then((tasks) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return tasks.sort((a, b) => {
            const aOrder = priorityOrder[a.priority] ?? 1;
            const bOrder = priorityOrder[b.priority] ?? 1;
            return sortOrder === 1 ? aOrder - bOrder : bOrder - aOrder;
          });
        });
    }

    return this.taskModel
      .find(query)
      .populate('user', 'username email')
      .populate('assignedTo', 'username email')
      .sort(sort)
      .exec();
  }

  async findOne(
    id: string,
    userId: string,
    role: string,
  ): Promise<TaskDocument> {
    const task = await this.taskModel
      .findById(id)
      .populate('user', 'username email')
      .populate('assignedTo', 'username email')
      .exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // RBAC: Members can only view their own tasks
    if (role !== 'admin') {
      const isOwner = task.user._id.toString() === userId;
      const isAssigned = task.assignedTo?._id?.toString() === userId;
      if (!isOwner && !isAssigned) {
        throw new ForbiddenException('You do not have access to this task');
      }
    }

    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
    role: string,
  ): Promise<TaskDocument> {
    const task = await this.taskModel.findById(id).exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // RBAC: Members can only update their own tasks
    if (role !== 'admin') {
      const isOwner = task.user.toString() === userId;
      const isAssigned = task.assignedTo?.toString() === userId;
      if (!isOwner && !isAssigned) {
        throw new ForbiddenException(
          'You do not have permission to update this task',
        );
      }
      // Members cannot assign tasks to others
      if (updateTaskDto.assignedTo) {
        throw new ForbiddenException('Only admins can assign tasks to others');
      }
    }

    // Update assignedTo if provided
    const updateData: any = { ...updateTaskDto };
    if (updateData.assignedTo) {
      updateData.assignedTo = new Types.ObjectId(updateData.assignedTo);
    }

    const updatedTask = await this.taskModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('user', 'username email')
      .populate('assignedTo', 'username email')
      .exec();

    // Emit WebSocket event
    this.eventsGateway.emitTaskUpdated(updatedTask);

    return updatedTask;
  }

  async delete(
    id: string,
    userId: string,
    role: string,
  ): Promise<{ message: string }> {
    const task = await this.taskModel.findById(id).exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // RBAC: Members can only delete their own tasks
    if (role !== 'admin') {
      if (task.user.toString() !== userId) {
        throw new ForbiddenException(
          'You do not have permission to delete this task',
        );
      }
    }

    await this.taskModel.findByIdAndDelete(id).exec();

    // Emit WebSocket event
    this.eventsGateway.emitTaskDeleted(id);

    return { message: 'Task deleted successfully' };
  }
}
