'use client';

import { Task, User } from '@/lib/types';
import { useState } from 'react';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  'todo': { label: 'To Do', color: 'text-[var(--accent)]', bg: 'bg-[var(--accent)]/10 border-[var(--accent)]/20' },
  'in-progress': { label: 'In Progress', color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/10 border-[var(--warning)]/20' },
  'done': { label: 'Done', color: 'text-[var(--success)]', bg: 'bg-[var(--success)]/10 border-[var(--success)]/20' },
};

const priorityConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  'high': { label: 'High', color: 'text-[var(--danger)]', bg: 'bg-[var(--danger)]/10 border-[var(--danger)]/20', icon: '🔴' },
  'medium': { label: 'Medium', color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/10 border-[var(--warning)]/20', icon: '🟡' },
  'low': { label: 'Low', color: 'text-[var(--success)]', bg: 'bg-[var(--success)]/10 border-[var(--success)]/20', icon: '🟢' },
};

interface TaskCardProps {
  task: Task;
  index: number;
  currentUser: User;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: string) => void;
}

export default function TaskCard({ task, index, currentUser, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const status = statusConfig[task.status] || statusConfig['todo'];
  const priority = priorityConfig[task.priority] || priorityConfig['medium'];

  const isOwner = task.user?._id === currentUser.id;
  const isAdmin = currentUser.role === 'admin';
  const canModify = isOwner || isAdmin;

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date() && task.status !== 'done';

  return (
    <div
      className="glass rounded-xl p-5 hover:bg-[var(--card-hover)] transition-all duration-200 animate-fade-in group"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-2">
            <h3 className={`font-semibold text-[var(--foreground)] ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>
              {task.title}
            </h3>
          </div>

          {task.description && (
            <p className="text-sm text-[var(--muted-foreground)] mb-3 line-clamp-2">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {/* Status badge */}
            <div className="relative">
              <button
                onClick={() => canModify && setShowStatusMenu(!showStatusMenu)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border ${status.bg} ${status.color} ${canModify ? 'cursor-pointer hover:opacity-80' : 'cursor-default'} transition-opacity`}
              >
                {status.label}
                {canModify && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {showStatusMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
                  <div className="absolute left-0 top-full mt-1 w-40 glass rounded-xl shadow-2xl z-20 p-1 animate-scale-in">
                    {Object.entries(statusConfig).map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => {
                          onStatusChange(task._id, key);
                          setShowStatusMenu(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-[var(--card-hover)] transition-colors ${val.color} ${task.status === key ? 'bg-[var(--card-hover)]' : ''}`}
                      >
                        {val.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Priority badge */}
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border ${priority.bg} ${priority.color}`}>
              {priority.icon} {priority.label}
            </span>

            {/* Due date */}
            {dueDate && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border ${isOverdue ? 'bg-[var(--danger)]/10 border-[var(--danger)]/20 text-[var(--danger)]' : 'bg-[var(--card-hover)] border-[var(--border)] text-[var(--muted-foreground)]'}`}>
                📅 {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {isOverdue && ' (Overdue)'}
              </span>
            )}

            {/* Owner info */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-[var(--card-hover)] border border-[var(--border)] text-[var(--muted-foreground)]">
              👤 {task.user?.username || 'Unknown'}
            </span>

            {/* Assigned to */}
            {task.assignedTo && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-[var(--secondary)]/10 border border-[var(--secondary)]/20 text-[var(--secondary)]">
                → {task.assignedTo.username}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {canModify && (
          <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(task)}
              className="p-2 rounded-lg hover:bg-[var(--primary)]/10 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-all"
              title="Edit task"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="p-2 rounded-lg hover:bg-[var(--danger)]/10 text-[var(--muted-foreground)] hover:text-[var(--danger)] transition-all"
              title="Delete task"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {showConfirmDelete && (
        <div className="mt-4 p-3 rounded-xl bg-[var(--danger)]/5 border border-[var(--danger)]/20 flex items-center justify-between animate-scale-in">
          <p className="text-sm text-[var(--danger)]">Delete this task?</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="px-3 py-1.5 text-xs rounded-lg bg-[var(--card-hover)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { onDelete(task._id); setShowConfirmDelete(false); }}
              className="px-3 py-1.5 text-xs rounded-lg bg-[var(--danger)] text-white hover:bg-[var(--danger-hover)] transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
