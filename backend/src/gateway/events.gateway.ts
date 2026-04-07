import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/',
})
export class EventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('EventsGateway');

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake auth or cookie
      const token =
        client.handshake.auth?.token ||
        this.extractTokenFromCookie(client.handshake.headers.cookie);

      if (!token) {
        this.logger.warn(`Client ${client.id} rejected — no token`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      (client as any).user = payload;

      this.logger.log(
        `Client connected: ${client.id} (${payload.email}, ${payload.role})`,
      );
    } catch (error) {
      this.logger.warn(
        `Client ${client.id} rejected — invalid token: ${error.message}`,
      );
      client.emit('error', { message: 'Invalid authentication token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Emit task events to all connected clients
  emitTaskCreated(task: any) {
    this.server?.emit('task:created', task);
  }

  emitTaskUpdated(task: any) {
    this.server?.emit('task:updated', task);
  }

  emitTaskDeleted(taskId: string) {
    this.server?.emit('task:deleted', { taskId });
  }

  private extractTokenFromCookie(cookieHeader: string | undefined): string | null {
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(';').map((c) => c.trim());
    const tokenCookie = cookies.find((c) => c.startsWith('access_token='));
    return tokenCookie ? tokenCookie.split('=')[1] : null;
  }
}
