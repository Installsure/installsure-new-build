import { logger } from "./logger.js";

export interface WebSocketMessage {
  type:
    | "notification"
    | "project_update"
    | "file_upload"
    | "forge_status"
    | "qb_sync"
    | "ping"
    | "pong";
  payload: any;
  timestamp: string;
  userId?: number;
  companyId?: number;
}

export type WebSocketEventHandler = (message: WebSocketMessage) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: number | null = null;
  private eventHandlers: Map<string, WebSocketEventHandler[]> = new Map();
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem("installsure_token");
  }

  public connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsToken = token || this.token;
        if (!wsToken) {
          reject(new Error("No authentication token available"));
          return;
        }

        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws?token=${wsToken}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          logger.info("WebSocket connected");
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            logger.error("Failed to parse WebSocket message", error);
          }
        };

        this.ws.onclose = (event) => {
          logger.info("WebSocket disconnected", {
            code: event.code,
            reason: event.reason,
          });
          this.stopHeartbeat();

          if (
            !event.wasClean &&
            this.reconnectAttempts < this.maxReconnectAttempts
          ) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          logger.error("WebSocket error", error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }
    this.stopHeartbeat();
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  public send(message: Partial<WebSocketMessage>): void {
    if (!this.isConnected()) {
      logger.warn("Cannot send message: WebSocket not connected");
      return;
    }

    const fullMessage: WebSocketMessage = {
      type: message.type || "ping",
      payload: message.payload || {},
      timestamp: new Date().toISOString(),
      ...message,
    };

    this.ws!.send(JSON.stringify(fullMessage));
  }

  public on(eventType: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  public off(eventType: string, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    // Handle pong responses
    if (message.type === "pong") {
      return;
    }

    // Emit to specific event handlers
    const handlers = this.eventHandlers.get(message.type) || [];
    handlers.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        logger.error("WebSocket event handler error", error);
      }
    });

    // Emit to general handlers
    const generalHandlers = this.eventHandlers.get("*") || [];
    generalHandlers.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        logger.error("WebSocket general event handler error", error);
      }
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: "ping" });
      }
    }, 30000) as unknown as number; // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    logger.info(
      `Scheduling WebSocket reconnect attempt ${this.reconnectAttempts} in ${delay}ms`,
    );

    setTimeout(() => {
      this.connect().catch((error) => {
        logger.error("WebSocket reconnect failed", error);
      });
    }, delay);
  }

  public updateToken(token: string): void {
    this.token = token;
    if (this.isConnected()) {
      this.disconnect();
      this.connect(token);
    }
  }
}

// Create singleton instance
export const webSocketClient = new WebSocketClient();

// React hook for WebSocket integration
export const useWebSocket = () => {
  const connect = (token?: string) => webSocketClient.connect(token);
  const disconnect = () => webSocketClient.disconnect();
  const isConnected = () => webSocketClient.isConnected();
  const send = (message: Partial<WebSocketMessage>) =>
    webSocketClient.send(message);
  const on = (eventType: string, handler: WebSocketEventHandler) =>
    webSocketClient.on(eventType, handler);
  const off = (eventType: string, handler: WebSocketEventHandler) =>
    webSocketClient.off(eventType, handler);

  return {
    connect,
    disconnect,
    isConnected,
    send,
    on,
    off,
  };
};
