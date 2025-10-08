import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { logger } from './logger.js';
import { verifyToken } from '../api/middleware/auth.js';

export interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  userEmail?: string;
  userRole?: string;
  companyId?: number;
  isAlive?: boolean;
}

export interface WebSocketMessage {
  type:
    | 'notification'
    | 'project_update'
    | 'file_upload'
    | 'forge_status'
    | 'qb_sync'
    | 'ping'
    | 'pong';
  payload: any;
  timestamp: string;
  userId?: number;
  companyId?: number;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private connections: Map<number, Set<AuthenticatedWebSocket>> = new Map();
  private companyConnections: Map<number, Set<AuthenticatedWebSocket>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({
      server,
      path: '/ws',
    });

    this.setupWebSocketServer();
    this.startHeartbeat();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: AuthenticatedWebSocket, request) => {
      logger.debug('WebSocket connection attempt', {
        ip: request.socket.remoteAddress,
        userAgent: request.headers['user-agent'],
      });

      // Handle authentication
      const token = this.extractTokenFromRequest(request);
      if (!token) {
        logger.warn('WebSocket connection rejected: No token provided');
        ws.close(1008, 'Authentication required');
        return;
      }

      try {
        const decoded = verifyToken(token);
        ws.userId = decoded.userId;
        ws.userEmail = decoded.email;
        ws.userRole = decoded.role;
        ws.companyId = decoded.companyId;
        ws.isAlive = true;

        // Add to connection maps
        this.addConnection(ws);

        logger.info('WebSocket connection established', {
          userId: ws.userId,
          email: ws.userEmail,
          companyId: ws.companyId,
        });

        // Send welcome message
        this.sendMessage(ws, {
          type: 'notification',
          payload: {
            message: 'Connected to InstallSure real-time updates',
            userId: ws.userId,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.warn('WebSocket authentication failed', {
          error: (error as Error).message,
          ip: request.socket.remoteAddress,
        });
        ws.close(1008, 'Authentication failed');
        return;
      }

      // Handle messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          logger.error('Invalid WebSocket message', {
            error: (error as Error).message,
            userId: ws.userId,
          });
        }
      });

      // Handle pong responses
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Handle connection close
      ws.on('close', () => {
        this.removeConnection(ws);
        logger.info('WebSocket connection closed', {
          userId: ws.userId,
          email: ws.userEmail,
        });
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.error('WebSocket error', {
          error: error.message,
          userId: ws.userId,
        });
        this.removeConnection(ws);
      });
    });
  }

  private extractTokenFromRequest(request: any): string | null {
    // Try to get token from query parameter
    const url = new URL(request.url, `http://${request.headers.host}`);
    let token = url.searchParams.get('token');

    if (!token) {
      // Try to get token from Authorization header
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    return token;
  }

  private addConnection(ws: AuthenticatedWebSocket): void {
    if (!ws.userId) return;

    // Add to user connections
    if (!this.connections.has(ws.userId)) {
      this.connections.set(ws.userId, new Set());
    }
    this.connections.get(ws.userId)!.add(ws);

    // Add to company connections
    if (ws.companyId) {
      if (!this.companyConnections.has(ws.companyId)) {
        this.companyConnections.set(ws.companyId, new Set());
      }
      this.companyConnections.get(ws.companyId)!.add(ws);
    }
  }

  private removeConnection(ws: AuthenticatedWebSocket): void {
    if (!ws.userId) return;

    // Remove from user connections
    const userConnections = this.connections.get(ws.userId);
    if (userConnections) {
      userConnections.delete(ws);
      if (userConnections.size === 0) {
        this.connections.delete(ws.userId);
      }
    }

    // Remove from company connections
    if (ws.companyId) {
      const companyConnections = this.companyConnections.get(ws.companyId);
      if (companyConnections) {
        companyConnections.delete(ws);
        if (companyConnections.size === 0) {
          this.companyConnections.delete(ws.companyId);
        }
      }
    }
  }

  private handleMessage(ws: AuthenticatedWebSocket, message: any): void {
    switch (message.type) {
      case 'ping':
        this.sendMessage(ws, {
          type: 'pong',
          payload: { timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString(),
        });
        break;
      default:
        logger.debug('Unknown WebSocket message type', {
          type: message.type,
          userId: ws.userId,
        });
    }
  }

  private sendMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Public methods for broadcasting messages

  public sendToUser(userId: number, message: Omit<WebSocketMessage, 'userId' | 'companyId'>): void {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      const fullMessage: WebSocketMessage = {
        ...message,
        userId,
        timestamp: new Date().toISOString(),
      };

      userConnections.forEach((ws) => {
        this.sendMessage(ws, fullMessage);
      });
    }
  }

  public sendToCompany(
    companyId: number,
    message: Omit<WebSocketMessage, 'userId' | 'companyId'>,
  ): void {
    const companyConnections = this.companyConnections.get(companyId);
    if (companyConnections) {
      const fullMessage: WebSocketMessage = {
        ...message,
        companyId,
        timestamp: new Date().toISOString(),
      };

      companyConnections.forEach((ws) => {
        this.sendMessage(ws, fullMessage);
      });
    }
  }

  public broadcastToAll(message: Omit<WebSocketMessage, 'userId' | 'companyId'>): void {
    const fullMessage: WebSocketMessage = {
      ...message,
      timestamp: new Date().toISOString(),
    };

    this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
      this.sendMessage(ws, fullMessage);
    });
  }

  public sendProjectUpdate(projectId: number, update: any, companyId?: number): void {
    const message = {
      type: 'project_update' as const,
      payload: {
        projectId,
        update,
        message: 'Project has been updated',
      },
    };

    if (companyId) {
      this.sendToCompany(companyId, message);
    } else {
      this.broadcastToAll(message);
    }
  }

  public sendFileUploadStatus(fileId: number, status: string, userId: number): void {
    this.sendToUser(userId, {
      type: 'file_upload',
      payload: {
        fileId,
        status,
        message: `File upload ${status}`,
      },
    });
  }

  public sendForgeProcessingStatus(urn: string, status: string, userId: number): void {
    this.sendToUser(userId, {
      type: 'forge_status',
      payload: {
        urn,
        status,
        message: `Forge processing ${status}`,
      },
    });
  }

  public sendQuickBooksSyncStatus(syncId: number, status: string, companyId: number): void {
    this.sendToCompany(companyId, {
      type: 'qb_sync',
      payload: {
        syncId,
        status,
        message: `QuickBooks sync ${status}`,
      },
    });
  }

  public sendNotification(userId: number, notification: any): void {
    this.sendToUser(userId, {
      type: 'notification',
      payload: notification,
    });
  }

  private startHeartbeat(): void {
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (!ws.isAlive) {
          logger.debug('Terminating inactive WebSocket connection', {
            userId: ws.userId,
          });
          this.removeConnection(ws);
          ws.terminate();
          return;
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  public getConnectionStats(): {
    totalConnections: number;
    userConnections: number;
    companyConnections: number;
  } {
    return {
      totalConnections: this.wss.clients.size,
      userConnections: this.connections.size,
      companyConnections: this.companyConnections.size,
    };
  }
}

export let webSocketManager: WebSocketManager | null = null;

export const initializeWebSocket = (server: Server): WebSocketManager => {
  webSocketManager = new WebSocketManager(server);
  return webSocketManager;
};



