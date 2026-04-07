import { IsOptional, IsEnum, IsString } from 'class-validator';

export class FilterTasksDto {
  @IsOptional()
  @IsEnum(['todo', 'in-progress', 'done'])
  status?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  priority?: string;

  @IsOptional()
  @IsString()
  sortBy?: string; // 'dueDate' | 'priority' | 'createdAt' | 'title'

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
