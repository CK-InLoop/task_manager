export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'member';
  createdAt?: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  user: {
    _id: string;
    username: string;
    email: string;
  };
  assignedTo: {
    _id: string;
    username: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: 'todo' | 'in-progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  assignedTo?: string;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
}
