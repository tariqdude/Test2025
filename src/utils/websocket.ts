/**
 * WebSocket Manager Utilities
 * @module utils/websocket
 * @description WebSocket connection manager with auto-reconnect,
 * heartbeat, message queuing, and event handling.
 */

import { isBrowser } from './dom';

/**
 * WebSocket connection states
 */
export type WebSocketState =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting';

/**
 * WebSocket message types
 */
export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp?: number;
  id?: string;
}

/**
 * WebSocket manager options
 */
export interface WebSocketManagerOptions {
  /** WebSocket URL */
  url: string;
  /** WebSocket protocols */
  protocols?: string | string[];
  /** Auto reconnect on disconnect */
  autoReconnect?: boolean;
  /** Maximum reconnection attempts */
  maxReconnectAttempts?: number;
  /** Initial reconnect delay in ms */
  reconnectDelay?: number;
  /** Maximum reconnect delay in ms */
  maxReconnectDelay?: number;
  /** Reconnect delay multiplier */
  reconnectMultiplier?: number;
  /** Heartbeat interval in ms (0 to disable) */
  heartbeatInterval?: number;
  /** Heartbeat message */
  heartbeatMessage?: string | (() => string);
  /** Expected pong timeout in ms */
  pongTimeout?: number;
  /** Queue messages when disconnected */
  queueOfflineMessages?: boolean;
  /** Maximum queue size */
  maxQueueSize?: number;
  /** Binary type for messages */
  binaryType?: BinaryType;
  /** Debug logging */
  debug?: boolean;
}

/**
 * WebSocket event handlers
 */
export interface WebSocketEventHandlers {
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (data: unknown) => void;
  onStateChange?: (state: WebSocketState) => void;
  onReconnect?: (attempt: number) => void;
}

/**
 * WebSocket manager instance
 */
export interface WebSocketManager {
  /** Current connection state */
  readonly state: WebSocketState;
  /** Raw WebSocket instance */
  readonly socket: WebSocket | null;
  /** Connect to server */
  connect(): void;
  /** Disconnect from server */
  disconnect(code?: number, reason?: string): void;
  /** Send message */
  send(data: string | ArrayBuffer | Blob): boolean;
  /** Send JSON message */
  sendJson<T>(message: T): boolean;
  /** Subscribe to message type */
  on<T>(type: string, handler: (payload: T) => void): () => void;
  /** Unsubscribe from message type */
  off(type: string, handler?: (payload: unknown) => void): void;
  /** Wait for connection */
  waitForConnection(timeout?: number): Promise<void>;
  /** Get queued message count */
  getQueueSize(): number;
  /** Clear message queue */
  clearQueue(): void;
  /** Destroy manager */
  destroy(): void;
}

/**
 * Create a WebSocket manager
 * @param options - Manager options
 * @param handlers - Event handlers
 * @returns WebSocket manager instance
 * @example
 * const ws = createWebSocket({
 *   url: 'wss://api.example.com/ws',
 *   autoReconnect: true,
 *   heartbeatInterval: 30000,
 * }, {
 *   onMessage: (data) => console.log('Received:', data),
 *   onStateChange: (state) => console.log('State:', state),
 * });
 *
 * ws.connect();
 * ws.sendJson({ type: 'subscribe', channel: 'updates' });
 */
export function createWebSocket(
  options: WebSocketManagerOptions,
  handlers: WebSocketEventHandlers = {}
): WebSocketManager {
  const {
    url,
    protocols,
    autoReconnect = true,
    maxReconnectAttempts = 10,
    reconnectDelay = 1000,
    maxReconnectDelay = 30000,
    reconnectMultiplier = 1.5,
    heartbeatInterval = 0,
    heartbeatMessage = 'ping',
    pongTimeout = 5000,
    queueOfflineMessages = true,
    maxQueueSize = 100,
    binaryType = 'blob',
    debug = false,
  } = options;

  let socket: WebSocket | null = null;
  let state: WebSocketState = 'disconnected';
  let reconnectAttempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let pongTimer: ReturnType<typeof setTimeout> | null = null;
  let isDestroyed = false;
  const messageQueue: Array<string | ArrayBuffer | Blob> = [];
  const typeHandlers = new Map<string, Set<(payload: unknown) => void>>();

  const log = (message: string, ...args: unknown[]): void => {
    if (debug) {
      console.log(`[WebSocket] ${message}`, ...args);
    }
  };

  const setState = (newState: WebSocketState): void => {
    if (state !== newState) {
      state = newState;
      log(`State changed: ${newState}`);
      handlers.onStateChange?.(newState);
    }
  };

  const clearTimers = (): void => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (pongTimer) {
      clearTimeout(pongTimer);
      pongTimer = null;
    }
  };

  const flushQueue = (): void => {
    while (messageQueue.length > 0 && socket?.readyState === WebSocket.OPEN) {
      const message = messageQueue.shift();
      if (message) {
        socket.send(message);
        log('Sent queued message');
      }
    }
  };

  const startHeartbeat = (): void => {
    if (heartbeatInterval <= 0) return;

    heartbeatTimer = setInterval(() => {
      if (socket?.readyState === WebSocket.OPEN) {
        const message =
          typeof heartbeatMessage === 'function'
            ? heartbeatMessage()
            : heartbeatMessage;

        socket.send(message);
        log('Sent heartbeat');

        // Start pong timeout
        pongTimer = setTimeout(() => {
          log('Pong timeout - reconnecting');
          socket?.close(4000, 'Heartbeat timeout');
        }, pongTimeout);
      }
    }, heartbeatInterval);
  };

  const handlePong = (): void => {
    if (pongTimer) {
      clearTimeout(pongTimer);
      pongTimer = null;
    }
  };

  const calculateReconnectDelay = (): number => {
    const delay =
      reconnectDelay * Math.pow(reconnectMultiplier, reconnectAttempts);
    return Math.min(delay, maxReconnectDelay);
  };

  const scheduleReconnect = (): void => {
    if (!autoReconnect || isDestroyed) return;
    if (reconnectAttempts >= maxReconnectAttempts) {
      log('Max reconnect attempts reached');
      setState('disconnected');
      return;
    }

    setState('reconnecting');
    const delay = calculateReconnectDelay();
    log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1})`);

    reconnectTimer = setTimeout(() => {
      reconnectAttempts++;
      handlers.onReconnect?.(reconnectAttempts);
      connect();
    }, delay);
  };

  const connect = (): void => {
    if (isDestroyed) return;
    if (socket?.readyState === WebSocket.OPEN) {
      log('Already connected');
      return;
    }

    clearTimers();
    setState('connecting');

    try {
      socket = new WebSocket(url, protocols);
      socket.binaryType = binaryType;

      socket.onopen = (event): void => {
        log('Connected');
        setState('connected');
        reconnectAttempts = 0;
        startHeartbeat();
        flushQueue();
        handlers.onOpen?.(event);
      };

      socket.onclose = (event): void => {
        log(`Closed: ${event.code} ${event.reason}`);
        clearTimers();
        handlers.onClose?.(event);

        if (!isDestroyed && autoReconnect && !event.wasClean) {
          scheduleReconnect();
        } else {
          setState('disconnected');
        }
      };

      socket.onerror = (event): void => {
        log('Error:', event);
        handlers.onError?.(event);
      };

      socket.onmessage = (event): void => {
        const data = event.data;

        // Handle pong
        if (data === 'pong' || data === heartbeatMessage) {
          handlePong();
          return;
        }

        // Try to parse as JSON
        let parsed: unknown = data;
        if (typeof data === 'string') {
          try {
            parsed = JSON.parse(data);
          } catch {
            // Not JSON, use raw data
          }
        }

        // Dispatch to type handlers
        if (parsed && typeof parsed === 'object' && 'type' in parsed) {
          const message = parsed as WebSocketMessage;
          const typeHandler = typeHandlers.get(message.type);
          if (typeHandler) {
            typeHandler.forEach(handler => handler(message.payload));
          }
        }

        handlers.onMessage?.(parsed);
      };
    } catch (error) {
      log('Connection error:', error);
      scheduleReconnect();
    }
  };

  const disconnect = (code = 1000, reason = 'Client disconnect'): void => {
    clearTimers();
    reconnectAttempts = maxReconnectAttempts; // Prevent auto-reconnect

    if (socket) {
      socket.close(code, reason);
      socket = null;
    }

    setState('disconnected');
  };

  const send = (data: string | ArrayBuffer | Blob): boolean => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(data);
      return true;
    }

    if (queueOfflineMessages && messageQueue.length < maxQueueSize) {
      messageQueue.push(data);
      log('Message queued');
      return true;
    }

    return false;
  };

  const sendJson = <T>(message: T): boolean => {
    return send(JSON.stringify(message));
  };

  const on = <T>(type: string, handler: (payload: T) => void): (() => void) => {
    if (!typeHandlers.has(type)) {
      typeHandlers.set(type, new Set());
    }
    typeHandlers.get(type)!.add(handler as (payload: unknown) => void);

    return () => off(type, handler as (payload: unknown) => void);
  };

  const off = (type: string, handler?: (payload: unknown) => void): void => {
    if (handler) {
      typeHandlers.get(type)?.delete(handler);
    } else {
      typeHandlers.delete(type);
    }
  };

  const waitForConnection = (timeout = 10000): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (state === 'connected') {
        resolve();
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, timeout);

      const checkState = (newState: WebSocketState): void => {
        if (newState === 'connected') {
          clearTimeout(timeoutId);
          resolve();
        }
      };

      const originalHandler = handlers.onStateChange;
      handlers.onStateChange = (newState): void => {
        originalHandler?.(newState);
        checkState(newState);
      };
    });
  };

  const destroy = (): void => {
    isDestroyed = true;
    disconnect();
    typeHandlers.clear();
    messageQueue.length = 0;
  };

  return {
    get state() {
      return state;
    },
    get socket() {
      return socket;
    },
    connect,
    disconnect,
    send,
    sendJson,
    on,
    off,
    waitForConnection,
    getQueueSize: () => messageQueue.length,
    clearQueue: () => {
      messageQueue.length = 0;
    },
    destroy,
  };
}

// ============================================================================
// Pub/Sub WebSocket
// ============================================================================

/**
 * Subscription options
 */
export interface SubscriptionOptions {
  /** Channel/topic to subscribe to */
  channel: string;
  /** Subscription handler */
  handler: (data: unknown) => void;
  /** Auto-resubscribe on reconnect */
  autoResubscribe?: boolean;
}

/**
 * Pub/Sub WebSocket manager
 */
export interface PubSubWebSocket extends WebSocketManager {
  /** Subscribe to a channel */
  subscribe(channel: string, handler: (data: unknown) => void): () => void;
  /** Unsubscribe from a channel */
  unsubscribe(channel: string): void;
  /** Publish to a channel */
  publish(channel: string, data: unknown): boolean;
}

/**
 * Create a Pub/Sub WebSocket
 * @param options - WebSocket options
 * @param handlers - Event handlers
 */
export function createPubSubWebSocket(
  options: WebSocketManagerOptions,
  handlers: WebSocketEventHandlers = {}
): PubSubWebSocket {
  const subscriptions = new Map<string, Set<(data: unknown) => void>>();
  const channelsToResubscribe = new Set<string>();

  const originalOnOpen = handlers.onOpen;
  handlers.onOpen = (event): void => {
    // Resubscribe to channels
    channelsToResubscribe.forEach(channel => {
      ws.sendJson({ type: 'subscribe', channel });
    });
    originalOnOpen?.(event);
  };

  const originalOnMessage = handlers.onMessage;
  handlers.onMessage = (data): void => {
    // Handle publish messages
    if (
      data &&
      typeof data === 'object' &&
      'channel' in data &&
      'data' in data
    ) {
      const { channel, data: payload } = data as {
        channel: string;
        data: unknown;
      };
      subscriptions.get(channel)?.forEach(handler => handler(payload));
    }
    originalOnMessage?.(data);
  };

  const ws = createWebSocket(options, handlers);

  return {
    ...ws,

    subscribe(channel: string, handler: (data: unknown) => void): () => void {
      if (!subscriptions.has(channel)) {
        subscriptions.set(channel, new Set());
        channelsToResubscribe.add(channel);

        // Send subscription message
        if (ws.state === 'connected') {
          ws.sendJson({ type: 'subscribe', channel });
        }
      }

      subscriptions.get(channel)!.add(handler);

      return () => {
        subscriptions.get(channel)?.delete(handler);
        if (subscriptions.get(channel)?.size === 0) {
          subscriptions.delete(channel);
          channelsToResubscribe.delete(channel);
          ws.sendJson({ type: 'unsubscribe', channel });
        }
      };
    },

    unsubscribe(channel: string): void {
      subscriptions.delete(channel);
      channelsToResubscribe.delete(channel);
      ws.sendJson({ type: 'unsubscribe', channel });
    },

    publish(channel: string, data: unknown): boolean {
      return ws.sendJson({ type: 'publish', channel, data });
    },
  };
}

// ============================================================================
// RPC WebSocket
// ============================================================================

/**
 * RPC request
 */
interface RPCRequest {
  id: string;
  method: string;
  params?: unknown;
}

/**
 * RPC response
 */
interface RPCResponse {
  id: string;
  result?: unknown;
  error?: { code: number; message: string };
}

/**
 * RPC WebSocket options
 */
export interface RPCWebSocketOptions extends WebSocketManagerOptions {
  /** Default RPC timeout */
  rpcTimeout?: number;
}

/**
 * RPC WebSocket manager
 */
export interface RPCWebSocket extends WebSocketManager {
  /** Call a remote method */
  call<T>(method: string, params?: unknown, timeout?: number): Promise<T>;
  /** Register a method handler */
  registerMethod(
    method: string,
    handler: (params: unknown) => unknown | Promise<unknown>
  ): void;
  /** Unregister a method handler */
  unregisterMethod(method: string): void;
}

/**
 * Create an RPC WebSocket
 * @param options - WebSocket options
 * @param handlers - Event handlers
 */
export function createRPCWebSocket(
  options: RPCWebSocketOptions,
  handlers: WebSocketEventHandlers = {}
): RPCWebSocket {
  const { rpcTimeout = 30000, ...wsOptions } = options;

  const pendingCalls = new Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();

  const methodHandlers = new Map<
    string,
    (params: unknown) => unknown | Promise<unknown>
  >();

  let idCounter = 0;
  const generateId = (): string => `${Date.now()}-${++idCounter}`;

  const originalOnMessage = handlers.onMessage;
  handlers.onMessage = async (data): Promise<void> => {
    if (data && typeof data === 'object') {
      // Handle RPC response
      if ('id' in data && ('result' in data || 'error' in data)) {
        const response = data as RPCResponse;
        const pending = pendingCalls.get(response.id);

        if (pending) {
          clearTimeout(pending.timer);
          pendingCalls.delete(response.id);

          if (response.error) {
            pending.reject(new Error(response.error.message));
          } else {
            pending.resolve(response.result);
          }
        }
      }

      // Handle RPC request
      if ('method' in data && 'id' in data) {
        const request = data as RPCRequest;
        const handler = methodHandlers.get(request.method);

        if (handler) {
          try {
            const result = await handler(request.params);
            ws.sendJson({ id: request.id, result });
          } catch (error) {
            ws.sendJson({
              id: request.id,
              error: {
                code: -1,
                message:
                  error instanceof Error ? error.message : 'Unknown error',
              },
            });
          }
        } else {
          ws.sendJson({
            id: request.id,
            error: {
              code: -32601,
              message: `Method not found: ${request.method}`,
            },
          });
        }
      }
    }

    originalOnMessage?.(data);
  };

  const ws = createWebSocket(wsOptions, handlers);

  return {
    ...ws,

    call<T>(
      method: string,
      params?: unknown,
      timeout: number = rpcTimeout
    ): Promise<T> {
      return new Promise((resolve, reject) => {
        const id = generateId();

        const timer = setTimeout(() => {
          pendingCalls.delete(id);
          reject(new Error(`RPC timeout: ${method}`));
        }, timeout);

        pendingCalls.set(id, {
          resolve: resolve as (value: unknown) => void,
          reject,
          timer,
        });

        const sent = ws.sendJson({ id, method, params });
        if (!sent) {
          clearTimeout(timer);
          pendingCalls.delete(id);
          reject(new Error('Failed to send RPC request'));
        }
      });
    },

    registerMethod(
      method: string,
      handler: (params: unknown) => unknown | Promise<unknown>
    ): void {
      methodHandlers.set(method, handler);
    },

    unregisterMethod(method: string): void {
      methodHandlers.delete(method);
    },
  };
}

/**
 * Check if WebSocket is supported
 */
export function isWebSocketSupported(): boolean {
  return isBrowser() && 'WebSocket' in window;
}

/**
 * Get WebSocket ready state name
 */
export function getReadyStateName(readyState: number): string {
  switch (readyState) {
    case WebSocket.CONNECTING:
      return 'connecting';
    case WebSocket.OPEN:
      return 'open';
    case WebSocket.CLOSING:
      return 'closing';
    case WebSocket.CLOSED:
      return 'closed';
    default:
      return 'unknown';
  }
}
