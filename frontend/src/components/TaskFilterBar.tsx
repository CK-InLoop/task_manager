'use client';

import { TaskFilters } from '@/lib/types';
import { useState } from 'react';

interface TaskFilterBarProps {
  filters: TaskFilters;
  setFilters: (filters: TaskFilters) => void;
}

export default function TaskFilterBar({ filters, setFilters }: TaskFilterBarProps) {
  const [search, setSearch] = useState(filters.search || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search });
  };

  const clearFilters = () => {
    setSearch('');
    setFilters({});
  };

  const hasActiveFilters = filters.status || filters.priority || filters.sortBy || filters.search;

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (!e.target.value) setFilters({ ...filters, search: undefined });
              }}
              placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--primary)] transition-all duration-200"
            />
          </div>
        </form>

        {/* Status Filter */}
        <select
          value={filters.status || ''}
          onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
          className="px-3 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-all duration-200 min-w-[130px]"
        >
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        {/* Priority Filter */}
        <select
          value={filters.priority || ''}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value || undefined })}
          className="px-3 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-all duration-200 min-w-[130px]"
        >
          <option value="">All Priority</option>
          <option value="high">🔴 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>

        {/* Sort */}
        <select
          value={filters.sortBy ? `${filters.sortBy}-${filters.sortOrder || 'desc'}` : ''}
          onChange={(e) => {
            if (!e.target.value) {
              setFilters({ ...filters, sortBy: undefined, sortOrder: undefined });
            } else {
              const [sortBy, sortOrder] = e.target.value.split('-');
              setFilters({ ...filters, sortBy, sortOrder });
            }
          }}
          className="px-3 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-all duration-200 min-w-[140px]"
        >
          <option value="">Sort By</option>
          <option value="createdAt-desc">Newest First</option>
          <option value="createdAt-asc">Oldest First</option>
          <option value="dueDate-asc">Due Date ↑</option>
          <option value="dueDate-desc">Due Date ↓</option>
          <option value="priority-desc">Priority ↓</option>
          <option value="priority-asc">Priority ↑</option>
        </select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2.5 rounded-xl bg-[var(--card-hover)] border border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all duration-200"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
