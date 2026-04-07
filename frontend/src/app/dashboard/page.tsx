'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { Task, TaskFilters } from '@/lib/types';
import TaskCard from '@/components/TaskCard';
import TaskForm from '@/components/TaskForm';
import TaskFilterBar from '@/components/TaskFilterBar';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const { onTaskCreated, onTaskUpdated, onTaskDeleted, removeAllListeners } = useSocket();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({});

  const fetchTasks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
      if (filters.search) params.set('search', filters.search);

      const res = await api.get(`/tasks?${params.toString()}`);
      setTasks(res.data);
    } catch (err: any) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Real-time WebSocket updates
  useEffect(() => {
    onTaskCreated((task: Task) => {
      setTasks(prev => [task, ...prev]);
    });

    onTaskUpdated((updatedTask: Task) => {
      setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
    });

    onTaskDeleted((data: { taskId: string }) => {
      setTasks(prev => prev.filter(t => t._id !== data.taskId));
    });

    return () => {
      removeAllListeners();
    };
  }, [onTaskCreated, onTaskUpdated, onTaskDeleted, removeAllListeners]);

  const handleCreateTask = async (data: any) => {
    try {
      await api.post('/tasks', data);
      toast.success('Task created!');
      setShowForm(false);
      fetchTasks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (data: any) => {
    if (!editingTask) return;
    try {
      await api.patch(`/tasks/${editingTask._id}`, data);
      toast.success('Task updated!');
      setEditingTask(null);
      fetchTasks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      fetchTasks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleStatusChange = async (taskId: string, status: string) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status });
      fetchTasks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Task stats
  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Welcome back, <span className="gradient-text">{user?.username}</span>
          </h1>
          <p className="text-[var(--muted-foreground)] text-sm mt-1">
            {user?.role === 'admin' ? '👑 Admin — You can manage all tasks' : '📋 Member — Manage your tasks'}
          </p>
        </div>
        <button
          onClick={() => { setEditingTask(null); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-[var(--primary-glow)] active:scale-[0.98] w-fit"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          New Task
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 animate-fade-in" style={{ animationDelay: '0ms' }}>
          <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{stats.total}</p>
        </div>
        <div className="glass rounded-xl p-4 animate-fade-in" style={{ animationDelay: '50ms' }}>
          <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">To Do</p>
          <p className="text-2xl font-bold text-[var(--accent)] mt-1">{stats.todo}</p>
        </div>
        <div className="glass rounded-xl p-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">In Progress</p>
          <p className="text-2xl font-bold text-[var(--warning)] mt-1">{stats.inProgress}</p>
        </div>
        <div className="glass rounded-xl p-4 animate-fade-in" style={{ animationDelay: '150ms' }}>
          <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Done</p>
          <p className="text-2xl font-bold text-[var(--success)] mt-1">{stats.done}</p>
        </div>
      </div>

      {/* Filters */}
      <TaskFilterBar filters={filters} setFilters={setFilters} />

      {/* Task List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center animate-fade-in">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No tasks yet</h3>
          <p className="text-[var(--muted-foreground)] text-sm mb-6">Create your first task to get started</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium transition-all duration-200"
          >
            Create Task
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task, index) => (
            <TaskCard
              key={task._id}
              task={task}
              index={index}
              currentUser={user!}
              onEdit={(task) => { setEditingTask(task); setShowForm(true); }}
              onDelete={handleDeleteTask}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Task Form Modal */}
      {showForm && (
        <TaskForm
          task={editingTask}
          isAdmin={user?.role === 'admin'}
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
          onClose={() => { setShowForm(false); setEditingTask(null); }}
        />
      )}
    </div>
  );
}
