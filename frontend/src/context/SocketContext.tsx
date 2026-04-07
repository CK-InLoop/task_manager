'use client';

import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { Task } from '@/lib/types';
import toast from 'react-hot-toast';

interface SocketContextType {
  onTaskCreated: (callback: (task: Task) => void) => void;
  onTaskUpdated: (callback: (task: Task) => void) => void;
  onTaskDeleted: (callback: (data: { taskId: string }) => void) => void;
  removeAllListeners: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
    });

    socket.on('error', (data: { message: string }) => {
      console.error('WebSocket error:', data.message);
    });

    // Show toast notifications for real-time events
    socket.on('task:created', (task: Task) => {
      if (task.user?._id !== user.id) {
        toast.success(`New task created: "${task.title}"`, { duration: 4000 });
      }
    });

    socket.on('task:updated', (task: Task) => {
      if (task.user?._id !== user.id) {
        toast(`Task updated: "${task.title}"`, { icon: '📝', duration: 3000 });
      }
    });

    socket.on('task:deleted', () => {
      toast('A task was deleted', { icon: '🗑️', duration: 3000 });
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, token]);

  const onTaskCreated = useCallback((callback: (task: Task) => void) => {
    socketRef.current?.on('task:created', callback);
  }, []);

  const onTaskUpdated = useCallback((callback: (task: Task) => void) => {
    socketRef.current?.on('task:updated', callback);
  }, []);

  const onTaskDeleted = useCallback((callback: (data: { taskId: string }) => void) => {
    socketRef.current?.on('task:deleted', callback);
  }, []);

  const removeAllListeners = useCallback(() => {
    socketRef.current?.off('task:created');
    socketRef.current?.off('task:updated');
    socketRef.current?.off('task:deleted');
  }, []);

  return (
    <SocketContext.Provider value={{ onTaskCreated, onTaskUpdated, onTaskDeleted, removeAllListeners }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
