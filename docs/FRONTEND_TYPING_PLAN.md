# 📝 Plan de Tipado para Frontend - WebSocket y API

Este documento describe la estrategia completa para implementar tipado TypeScript robusto en el frontend, especialmente para eventos de WebSocket y comunicación con la API.

## 🎯 Objetivos

1. **Type Safety Completa**: Eliminar `any` y garantizar tipado en tiempo de compilación
2. **IntelliSense Óptimo**: Autocompletado y documentación inline  
3. **Detección Temprana de Errores**: Capturar inconsistencias antes del runtime
4. **Mantenibilidad**: Sincronización automática entre backend y frontend
5. **Developer Experience**: API predecible y fácil de usar

`★ Insight ─────────────────────────────────────`
**Shared Types Strategy**: La clave es generar tipos automáticamente desde el backend hacia el frontend, manteniendo una única fuente de verdad. Esto elimina desincronización manual y garantiza que cambios en el backend se reflejen inmediatamente en el frontend.
`─────────────────────────────────────────────────`

## 📁 Estructura de Archivos Propuesta

```
frontend/src/
├── types/
│   ├── api.ts                    # Tipos para tRPC endpoints
│   ├── websocket.ts             # Tipos para WebSocket eventos
│   ├── domain/                  # Tipos de dominio del negocio
│   │   ├── comment.ts
│   │   ├── insight.ts
│   │   ├── job.ts
│   │   └── processing.ts
│   └── generated/               # Tipos auto-generados
│       ├── trpc-types.ts
│       └── websocket-events.ts
├── lib/
│   ├── trpc.ts                  # Cliente tRPC tipado
│   ├── websocket.ts             # Cliente WebSocket tipado
│   └── api.ts                   # Utilidades de API
└── hooks/
    ├── useWebSocket.ts          # Hook personalizado para WS
    ├── useJobProgress.ts        # Hook para monitorear jobs
    └── useInsights.ts           # Hook para gestión de insights
```

## 🔧 Fase 1: Tipos Base de Dominio

### `/types/domain/comment.ts`
```typescript
import { z } from 'zod';

// Schema base del comentario
export const CommentSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Comment = z.infer<typeof CommentSchema>;

// Tipos para operaciones
export const CreateCommentInputSchema = z.object({
  content: z.string().min(1),
});

export type CreateCommentInput = z.infer<typeof CreateCommentInputSchema>;

// Tipos para listas con paginación
export const CommentListSchema = z.object({
  comments: z.array(CommentSchema),
  pagination: z.object({
    total: z.number(),
    limit: z.number(), 
    offset: z.number(),
    hasMore: z.boolean(),
  }),
});

export type CommentList = z.infer<typeof CommentListSchema>;

// Comentario con insights asociados
export const CommentWithInsightsSchema = z.object({
  comment: CommentSchema,
  insights: z.array(z.object({
    id: z.number(),
    name: z.string(),
    content: z.string(),
    description: z.string(),
    ai_generated: z.boolean(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  })),
});

export type CommentWithInsights = z.infer<typeof CommentWithInsightsSchema>;
```

### `/types/domain/insight.ts`
```typescript
import { z } from 'zod';

export const InsightSchema = z.object({
  id: z.number(),
  name: z.string(),
  content: z.string(),
  description: z.string(),
  ai_generated: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Insight = z.infer<typeof InsightSchema>;

// Insight con conteo de comentarios
export const InsightWithCountSchema = InsightSchema.extend({
  commentCount: z.number(),
});

export type InsightWithCount = z.infer<typeof InsightWithCountSchema>;

// Lista de insights
export const InsightListSchema = z.object({
  insights: z.array(InsightWithCountSchema),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(), 
    hasMore: z.boolean(),
  }),
});

export type InsightList = z.infer<typeof InsightListSchema>;

// Insight con comentarios asociados
export const InsightWithCommentsSchema = z.object({
  insight: InsightSchema,
  comments: z.array(z.object({
    id: z.string().uuid(),
    content: z.string(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  })),
});

export type InsightWithComments = z.infer<typeof InsightWithCommentsSchema>;

// Estadísticas de insights
export const InsightStatsSchema = z.object({
  totalInsights: z.number(),
  aiGeneratedInsights: z.number(),
  manualInsights: z.number(),
  avgCommentsPerInsight: z.number(),
  recentInsights: z.number(),
  aiGenerationRate: z.number(),
});

export type InsightStats = z.infer<typeof InsightStatsSchema>;
```

### `/types/domain/job.ts`
```typescript
import { z } from 'zod';

// Estados del job
export const JobStateSchema = z.enum([
  'initializing',
  'fetching_data', 
  'analyzing',
  'creating_insights',
  'creating_relationships',
  'completed',
  'failed',
]);

export type JobState = z.infer<typeof JobStateSchema>;

// Resultado del procesamiento
export const ProcessingResultSchema = z.object({
  processedComments: z.number(),
  matchedInsights: z.number(),
  createdInsights: z.number(),
});

export type ProcessingResult = z.infer<typeof ProcessingResultSchema>;

// Metadata del job
export const JobMetadataSchema = z.object({
  batchIndex: z.number().optional(),
  totalBatches: z.number().optional(),
  totalComments: z.number().optional(),
  source: z.string().optional(),
  priority: z.string().optional(),
}).catchall(z.any()); // Permite propiedades adicionales

export type JobMetadata = z.infer<typeof JobMetadataSchema>;

// Información de lote
export const BatchInfoSchema = z.object({
  index: z.number(),
  size: z.number(),
  commentIds: z.array(z.string().uuid()),
});

export type BatchInfo = z.infer<typeof BatchInfoSchema>;

// Respuesta de categorización
export const CategorizeResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  details: z.object({
    totalComments: z.number(),
    batchSize: z.number(),
    jobsCreated: z.number(),
    batches: z.array(BatchInfoSchema),
  }),
});

export type CategorizeResponse = z.infer<typeof CategorizeResponseSchema>;
```

## 🌐 Fase 2: Tipos WebSocket

### `/types/websocket.ts`
```typescript
import { z } from 'zod';
import type { JobState, ProcessingResult } from './domain/job';

// Mensajes del cliente al servidor
export const ClientMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('subscribe:jobs'),
    jobIds: z.array(z.string()).optional(),
  }),
  z.object({
    type: z.literal('unsubscribe:jobs'),
    jobIds: z.array(z.string()).optional(),
  }),
  z.object({
    type: z.literal('ping'),
  }),
]);

export type ClientMessage = z.infer<typeof ClientMessageSchema>;

// Schema base para mensajes del servidor
const ServerMessageBaseSchema = z.object({
  type: z.string(),
  timestamp: z.string().datetime(),
  data: z.any().optional(),
});

// Tipos específicos de mensajes del servidor
export const ConnectionEstablishedMessageSchema = ServerMessageBaseSchema.extend({
  type: z.literal('connection:established'),
  data: z.object({
    message: z.string(),
    stats: z.object({
      totalConnections: z.number(),
      totalSubscriptions: z.number(),
      subscriptionDetails: z.array(z.object({
        jobId: z.string(),
        subscribers: z.number(),
      })),
    }),
  }),
});

export const SubscriptionConfirmedMessageSchema = ServerMessageBaseSchema.extend({
  type: z.literal('subscription:confirmed'),
  data: z.object({
    jobIds: z.array(z.string()),
  }),
});

export const JobStartedMessageSchema = ServerMessageBaseSchema.extend({
  type: z.literal('job:started'),
  data: z.object({
    jobId: z.string(),
    commentIds: z.array(z.string()),
    timestamp: z.string().datetime(),
  }),
});

export const JobCompletedMessageSchema = ServerMessageBaseSchema.extend({
  type: z.literal('job:completed'),
  data: z.object({
    jobId: z.string(),
    result: z.object({
      processedComments: z.number(),
      matchedInsights: z.number(),
      createdInsights: z.number(),
    }),
    duration: z.number(),
    timestamp: z.string().datetime(),
  }),
});

export const JobFailedMessageSchema = ServerMessageBaseSchema.extend({
  type: z.literal('job:failed'),
  data: z.object({
    jobId: z.string(),
    error: z.string(),
    errorType: z.string(),
    errorContext: z.record(z.any()).optional(),
    timestamp: z.string().datetime(),
  }),
});

export const StateChangedMessageSchema = ServerMessageBaseSchema.extend({
  type: z.literal('state:changed'),
  data: z.object({
    jobId: z.string(),
    state: JobStateSchema,
    progress: z.number().min(0).max(100),
    details: z.record(z.any()).optional(),
    timestamp: z.string().datetime(),
  }),
});

export const AnalysisStartedMessageSchema = ServerMessageBaseSchema.extend({
  type: z.literal('analysis:started'),
  data: z.object({
    commentCount: z.number(),
    insightCount: z.number(),
    provider: z.string(),
    performance: z.string(),
    timestamp: z.string().datetime(),
  }),
});

export const AnalysisCompletedMessageSchema = ServerMessageBaseSchema.extend({
  type: z.literal('analysis:completed'),
  data: z.object({
    totalAnalyzed: z.number(),
    matchedExisting: z.number(),
    newInsightsFound: z.number(),
    averageConfidence: z.number(),
    timestamp: z.string().datetime(),
  }),
});

export const InsightCreatedMessageSchema = ServerMessageBaseSchema.extend({
  type: z.literal('insight:created'),
  data: z.object({
    insightId: z.number(),
    name: z.string(),
    aiGenerated: z.boolean(),
    timestamp: z.string().datetime(),
  }),
});

export const InsightMatchedMessageSchema = ServerMessageBaseSchema.extend({
  type: z.literal('insight:matched'),
  data: z.object({
    insightId: z.number(),
    name: z.string(),
    commentId: z.string(),
    confidence: z.number(),
    timestamp: z.string().datetime(),
  }),
});

export const ErrorMessageSchema = ServerMessageBaseSchema.extend({
  type: z.literal('error'),
  data: z.object({
    message: z.string(),
  }),
});

export const PongMessageSchema = ServerMessageBaseSchema.extend({
  type: z.literal('pong'),
  data: z.object({
    stats: z.object({
      totalConnections: z.number(),
      totalSubscriptions: z.number(),
    }),
  }),
});

// Union de todos los mensajes del servidor
export const ServerMessageSchema = z.discriminatedUnion('type', [
  ConnectionEstablishedMessageSchema,
  SubscriptionConfirmedMessageSchema,
  JobStartedMessageSchema,
  JobCompletedMessageSchema, 
  JobFailedMessageSchema,
  StateChangedMessageSchema,
  AnalysisStartedMessageSchema,
  AnalysisCompletedMessageSchema,
  InsightCreatedMessageSchema,
  InsightMatchedMessageSchema,
  ErrorMessageSchema,
  PongMessageSchema,
]);

export type ServerMessage = z.infer<typeof ServerMessageSchema>;

// Tipos específicos de mensajes
export type ConnectionEstablishedMessage = z.infer<typeof ConnectionEstablishedMessageSchema>;
export type JobStartedMessage = z.infer<typeof JobStartedMessageSchema>;
export type JobCompletedMessage = z.infer<typeof JobCompletedMessageSchema>;
export type JobFailedMessage = z.infer<typeof JobFailedMessageSchema>;
export type StateChangedMessage = z.infer<typeof StateChangedMessageSchema>;
export type InsightCreatedMessage = z.infer<typeof InsightCreatedMessageSchema>;
export type InsightMatchedMessage = z.infer<typeof InsightMatchedMessageSchema>;

// Tipos de eventos para handlers
export type WebSocketEventMap = {
  'connection:established': ConnectionEstablishedMessage;
  'job:started': JobStartedMessage;
  'job:completed': JobCompletedMessage;
  'job:failed': JobFailedMessage;
  'state:changed': StateChangedMessage;
  'analysis:started': z.infer<typeof AnalysisStartedMessageSchema>;
  'analysis:completed': z.infer<typeof AnalysisCompletedMessageSchema>;
  'insight:created': InsightCreatedMessage;
  'insight:matched': InsightMatchedMessage;
  'error': z.infer<typeof ErrorMessageSchema>;
  'pong': z.infer<typeof PongMessageSchema>;
};
```

## 🔌 Fase 3: Cliente WebSocket Tipado

### `/lib/websocket.ts`
```typescript
import { z } from 'zod';
import { 
  ClientMessage, 
  ServerMessageSchema, 
  type ServerMessage, 
  type WebSocketEventMap 
} from '@/types/websocket';

interface WebSocketManagerOptions {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

type EventHandler<K extends keyof WebSocketEventMap> = (
  message: WebSocketEventMap[K]
) => void;

export class TypedWebSocketManager {
  private ws: WebSocket | null = null;
  private readonly url: string;
  private readonly options: Required<WebSocketManagerOptions>;
  private readonly eventHandlers = new Map<string, Set<EventHandler<any>>>();
  private reconnectAttempts = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  
  constructor(options: WebSocketManagerOptions) {
    this.url = options.url;
    this.options = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      ...options,
    };
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const rawMessage = JSON.parse(event.data);
          
          // Validar el mensaje con Zod
          const validatedMessage = ServerMessageSchema.parse(rawMessage);
          
          // Emitir evento tipado
          this.emit(validatedMessage.type, validatedMessage);
          
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
          console.error('Raw message:', event.data);
        }
      };

      this.ws.onclose = (event) => {
        console.log('❌ WebSocket disconnected:', event.code, event.reason);
        this.stopHeartbeat();
        
        if (event.code !== 1000) { // No fue cierre normal
          this.handleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        reject(error);
      };
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Normal closure');
      this.ws = null;
    }
  }

  // Enviar mensaje tipado
  send<T extends ClientMessage>(message: T): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }
    
    this.ws.send(JSON.stringify(message));
  }

  // Suscribirse a jobs específicos
  subscribeToJobs(jobIds: string[]): void {
    this.send({
      type: 'subscribe:jobs',
      jobIds,
    });
  }

  // Desuscribirse de jobs
  unsubscribeFromJobs(jobIds: string[]): void {
    this.send({
      type: 'unsubscribe:jobs', 
      jobIds,
    });
  }

  // Ping para keep-alive
  ping(): void {
    this.send({ type: 'ping' });
  }

  // Sistema de eventos tipado
  on<K extends keyof WebSocketEventMap>(
    eventType: K, 
    handler: EventHandler<K>
  ): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    
    this.eventHandlers.get(eventType)!.add(handler);
    
    // Devolver función de desuscripción
    return () => {
      this.eventHandlers.get(eventType)?.delete(handler);
    };
  }

  private emit<K extends keyof WebSocketEventMap>(
    eventType: K,
    message: WebSocketEventMap[K]
  ): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error('❌ Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Reconnecting... Attempt ${this.reconnectAttempts}`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        console.error('❌ Reconnect failed:', error);
        this.handleReconnect();
      });
    }, this.options.reconnectInterval);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      try {
        this.ping();
      } catch (error) {
        console.error('❌ Heartbeat ping failed:', error);
      }
    }, this.options.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Getters para estado
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get connectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'open';
      case WebSocket.CLOSING: return 'closing'; 
      case WebSocket.CLOSED: return 'closed';
      default: return 'unknown';
    }
  }
}

// Instancia singleton (opcional)
let globalWebSocket: TypedWebSocketManager | null = null;

export function getWebSocketManager(url?: string): TypedWebSocketManager {
  if (!globalWebSocket) {
    if (!url) {
      throw new Error('WebSocket URL is required for first initialization');
    }
    globalWebSocket = new TypedWebSocketManager({ url });
  }
  return globalWebSocket;
}
```

## ⚛️ Fase 4: Hooks Personalizados

### `/hooks/useWebSocket.ts`
```typescript
import { useEffect, useRef, useState, useCallback } from 'react';
import { TypedWebSocketManager, getWebSocketManager } from '@/lib/websocket';
import type { WebSocketEventMap } from '@/types/websocket';

interface UseWebSocketOptions {
  url: string;
  autoConnect?: boolean;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  connectionState: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribe: <K extends keyof WebSocketEventMap>(
    eventType: K,
    handler: (message: WebSocketEventMap[K]) => void
  ) => () => void;
  subscribeToJobs: (jobIds: string[]) => void;
  unsubscribeFromJobs: (jobIds: string[]) => void;
  ping: () => void;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');
  const wsRef = useRef<TypedWebSocketManager | null>(null);
  const subscriptionsRef = useRef<Set<() => void>>(new Set());

  // Inicializar WebSocket manager
  useEffect(() => {
    wsRef.current = getWebSocketManager(options.url);
    
    // Limpiar suscripciones al desmontar
    return () => {
      subscriptionsRef.current.forEach(unsub => unsub());
      subscriptionsRef.current.clear();
      
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, [options.url]);

  // Auto-conectar si está habilitado
  useEffect(() => {
    if (options.autoConnect && wsRef.current) {
      connect();
    }
  }, [options.autoConnect]);

  // Función para conectar
  const connect = useCallback(async () => {
    if (!wsRef.current) return;
    
    try {
      await wsRef.current.connect();
      setIsConnected(wsRef.current.isConnected);
      setConnectionState(wsRef.current.connectionState);
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setIsConnected(false);
      setConnectionState('error');
    }
  }, []);

  // Función para desconectar
  const disconnect = useCallback(() => {
    if (!wsRef.current) return;
    
    wsRef.current.disconnect();
    setIsConnected(false);
    setConnectionState('disconnected');
  }, []);

  // Función para suscribirse a eventos
  const subscribe = useCallback(<K extends keyof WebSocketEventMap>(
    eventType: K,
    handler: (message: WebSocketEventMap[K]) => void
  ) => {
    if (!wsRef.current) {
      throw new Error('WebSocket manager not initialized');
    }
    
    const unsubscribe = wsRef.current.on(eventType, handler);
    subscriptionsRef.current.add(unsubscribe);
    
    // Devolver función que también limpia la referencia
    return () => {
      unsubscribe();
      subscriptionsRef.current.delete(unsubscribe);
    };
  }, []);

  // Funciones de conveniencia
  const subscribeToJobs = useCallback((jobIds: string[]) => {
    if (!wsRef.current) return;
    wsRef.current.subscribeToJobs(jobIds);
  }, []);

  const unsubscribeFromJobs = useCallback((jobIds: string[]) => {
    if (!wsRef.current) return;
    wsRef.current.unsubscribeFromJobs(jobIds);
  }, []);

  const ping = useCallback(() => {
    if (!wsRef.current) return;
    wsRef.current.ping();
  }, []);

  // Monitorear estado de conexión
  useEffect(() => {
    if (!wsRef.current) return;

    const unsubscribeConnection = subscribe('connection:established', () => {
      setIsConnected(true);
      setConnectionState('open');
    });

    const unsubscribeError = subscribe('error', (message) => {
      console.error('WebSocket error:', message.data.message);
      setConnectionState('error');
    });

    return () => {
      unsubscribeConnection();
      unsubscribeError();
    };
  }, [subscribe]);

  return {
    isConnected,
    connectionState,
    connect,
    disconnect,
    subscribe,
    subscribeToJobs,
    unsubscribeFromJobs,
    ping,
  };
}
```

### `/hooks/useJobProgress.ts`
```typescript
import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import type { 
  JobState, 
  JobStartedMessage, 
  JobCompletedMessage, 
  JobFailedMessage,
  StateChangedMessage 
} from '@/types/websocket';

interface JobProgressState {
  jobId: string;
  state: JobState;
  progress: number;
  isCompleted: boolean;
  isFailed: boolean;
  error?: string;
  result?: {
    processedComments: number;
    matchedInsights: number;
    createdInsights: number;
  };
  duration?: number;
}

interface UseJobProgressOptions {
  jobIds: string[];
  onJobCompleted?: (jobId: string, result: any) => void;
  onJobFailed?: (jobId: string, error: string) => void;
}

interface UseJobProgressReturn {
  jobs: Map<string, JobProgressState>;
  overallProgress: number;
  isAnyJobRunning: boolean;
  isAllJobsCompleted: boolean;
  hasAnyJobFailed: boolean;
  subscribeToJobs: (jobIds: string[]) => void;
  unsubscribeFromJobs: (jobIds: string[]) => void;
  clearJobs: () => void;
}

export function useJobProgress(
  options: UseJobProgressOptions
): UseJobProgressReturn {
  const [jobs, setJobs] = useState<Map<string, JobProgressState>>(new Map());
  const { subscribe, subscribeToJobs, unsubscribeFromJobs } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3000/ws',
    autoConnect: true,
  });

  // Suscribirse a jobs iniciales
  useEffect(() => {
    if (options.jobIds.length > 0) {
      subscribeToJobs(options.jobIds);
    }
  }, [options.jobIds, subscribeToJobs]);

  // Handler para job iniciado
  const handleJobStarted = useCallback((message: JobStartedMessage) => {
    const { jobId } = message.data;
    
    setJobs(prev => new Map(prev).set(jobId, {
      jobId,
      state: 'initializing',
      progress: 0,
      isCompleted: false,
      isFailed: false,
    }));
  }, []);

  // Handler para cambio de estado
  const handleStateChanged = useCallback((message: StateChangedMessage) => {
    const { jobId, state, progress } = message.data;
    
    setJobs(prev => {
      const updated = new Map(prev);
      const existing = updated.get(jobId) || {
        jobId,
        state: 'initializing',
        progress: 0,
        isCompleted: false,
        isFailed: false,
      };
      
      updated.set(jobId, {
        ...existing,
        state,
        progress,
        isFailed: state === 'failed',
      });
      
      return updated;
    });
  }, []);

  // Handler para job completado
  const handleJobCompleted = useCallback((message: JobCompletedMessage) => {
    const { jobId, result, duration } = message.data;
    
    setJobs(prev => {
      const updated = new Map(prev);
      const existing = updated.get(jobId);
      
      if (existing) {
        updated.set(jobId, {
          ...existing,
          state: 'completed',
          progress: 100,
          isCompleted: true,
          result,
          duration,
        });
      }
      
      return updated;
    });

    options.onJobCompleted?.(jobId, result);
  }, [options.onJobCompleted]);

  // Handler para job fallido
  const handleJobFailed = useCallback((message: JobFailedMessage) => {
    const { jobId, error } = message.data;
    
    setJobs(prev => {
      const updated = new Map(prev);
      const existing = updated.get(jobId);
      
      if (existing) {
        updated.set(jobId, {
          ...existing,
          state: 'failed',
          isFailed: true,
          error,
        });
      }
      
      return updated;
    });

    options.onJobFailed?.(jobId, error);
  }, [options.onJobFailed]);

  // Suscribirse a eventos WebSocket
  useEffect(() => {
    const unsubscribers = [
      subscribe('job:started', handleJobStarted),
      subscribe('state:changed', handleStateChanged),
      subscribe('job:completed', handleJobCompleted),
      subscribe('job:failed', handleJobFailed),
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [subscribe, handleJobStarted, handleStateChanged, handleJobCompleted, handleJobFailed]);

  // Calcular progreso general
  const overallProgress = Array.from(jobs.values()).reduce(
    (sum, job) => sum + job.progress,
    0
  ) / Math.max(jobs.size, 1);

  // Estados derivados
  const isAnyJobRunning = Array.from(jobs.values()).some(
    job => !job.isCompleted && !job.isFailed
  );

  const isAllJobsCompleted = jobs.size > 0 && Array.from(jobs.values()).every(
    job => job.isCompleted
  );

  const hasAnyJobFailed = Array.from(jobs.values()).some(
    job => job.isFailed
  );

  // Función para limpiar jobs
  const clearJobs = useCallback(() => {
    setJobs(new Map());
  }, []);

  return {
    jobs,
    overallProgress,
    isAnyJobRunning,
    isAllJobsCompleted,
    hasAnyJobFailed,
    subscribeToJobs,
    unsubscribeFromJobs,
    clearJobs,
  };
}
```

## 🚀 Fase 5: Integración tRPC Tipada

### `/lib/trpc.ts`
```typescript
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import { AppRouter } from '../../../apps/server/src/routers'; // Importar desde backend

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/trpc',
      
      // Opcional: headers personalizados
      headers() {
        return {
          authorization: `Bearer ${getAuthToken()}`,
        };
      },
    }),
  ],
});

function getAuthToken(): string {
  // Implementar lógica de autenticación
  return localStorage.getItem('auth-token') || '';
}
```

### Hook de uso combinado `/hooks/useInsights.ts`
```typescript
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useWebSocket } from './useWebSocket';
import type { Insight, InsightWithCount } from '@/types/domain/insight';
import type { InsightCreatedMessage, InsightMatchedMessage } from '@/types/websocket';

interface UseInsightsOptions {
  limit?: number;
  onlyAiGenerated?: boolean;
  realTimeUpdates?: boolean;
}

interface UseInsightsReturn {
  insights: InsightWithCount[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  stats: {
    totalInsights: number;
    aiGeneratedInsights: number;
    manualInsights: number;
    avgCommentsPerInsight: number;
    recentInsights: number;
    aiGenerationRate: number;
  } | null;
}

export function useInsights(options: UseInsightsOptions = {}): UseInsightsReturn {
  const [insights, setInsights] = useState<InsightWithCount[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const { subscribe } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3000/ws',
    autoConnect: options.realTimeUpdates,
  });

  // Query para lista de insights
  const {
    data,
    isLoading,
    error,
    refetch,
  } = trpc.insights.list.useQuery({
    limit: options.limit || 20,
    offset,
    onlyAiGenerated: options.onlyAiGenerated,
  });

  // Query para estadísticas
  const {
    data: stats,
    refetch: refetchStats,
  } = trpc.insights.stats.useQuery();

  // Actualizar datos cuando llegue respuesta
  useEffect(() => {
    if (data) {
      if (offset === 0) {
        setInsights(data.insights);
      } else {
        setInsights(prev => [...prev, ...data.insights]);
      }
      setHasMore(data.pagination.hasMore);
    }
  }, [data, offset]);

  // Manejar actualizaciones en tiempo real
  useEffect(() => {
    if (!options.realTimeUpdates) return;

    const unsubscribers = [
      subscribe('insight:created', (message: InsightCreatedMessage) => {
        // Agregar nuevo insight al principio de la lista
        const newInsight: InsightWithCount = {
          id: message.data.insightId,
          name: message.data.name,
          content: '', // Se actualizará con el próximo refresh
          description: '',
          ai_generated: message.data.aiGenerated,
          created_at: message.data.timestamp,
          updated_at: message.data.timestamp,
          commentCount: 0,
        };
        
        setInsights(prev => [newInsight, ...prev]);
        refetchStats(); // Actualizar estadísticas
      }),
      
      subscribe('insight:matched', (message: InsightMatchedMessage) => {
        // Actualizar conteo de comentarios del insight
        setInsights(prev => 
          prev.map(insight => 
            insight.id === message.data.insightId
              ? { ...insight, commentCount: insight.commentCount + 1 }
              : insight
          )
        );
        refetchStats(); // Actualizar estadísticas
      }),
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [options.realTimeUpdates, subscribe, refetchStats]);

  // Función para cargar más
  const loadMore = () => {
    if (!hasMore || isLoading) return;
    setOffset(prev => prev + (options.limit || 20));
  };

  // Función para refrescar
  const refresh = () => {
    setOffset(0);
    refetch();
    refetchStats();
  };

  return {
    insights,
    isLoading,
    error: error?.message || null,
    hasMore,
    loadMore,
    refresh,
    stats: stats || null,
  };
}
```

## 📋 Plan de Implementación

### **Sprint 1: Fundamentos (1 semana)**
1. ✅ Crear estructura de carpetas y archivos base
2. ✅ Implementar tipos de dominio (`/types/domain/`)
3. ✅ Configurar Zod schemas básicos
4. ✅ Setup inicial de tRPC cliente

### **Sprint 2: WebSocket Tipado (1 semana)**  
1. ✅ Implementar tipos WebSocket completos
2. ✅ Crear `TypedWebSocketManager` con validación
3. ✅ Desarrollar hook `useWebSocket` base
4. ✅ Testing de conexión y mensajes

### **Sprint 3: Hooks Avanzados (1 semana)**
1. ✅ Implementar `useJobProgress` con estado completo
2. ✅ Desarrollar `useInsights` con actualizaciones tiempo real
3. ✅ Integrar tRPC queries con WebSocket events
4. ✅ Manejo de errores y reconexión

### **Sprint 4: Optimización y Testing (1 semana)**
1. 🔄 Performance testing y optimizaciones
2. 🔄 Tests unitarios para todos los hooks
3. 🔄 Tests de integración WebSocket + tRPC
4. 🔄 Documentación y guías de uso

## 🛡️ Validación y Testing

### Estrategia de Testing
```typescript
// __tests__/websocket.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useWebSocket } from '@/hooks/useWebSocket';
import WS from 'jest-websocket-mock';

describe('useWebSocket', () => {
  let server: WS;
  
  beforeEach(() => {
    server = new WS('ws://localhost:3000/ws');
  });

  afterEach(() => {
    WS.clean();
  });

  it('should connect and receive typed messages', async () => {
    const { result } = renderHook(() => 
      useWebSocket({ 
        url: 'ws://localhost:3000/ws', 
        autoConnect: true 
      })
    );
    
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Simular mensaje del servidor
    server.send(JSON.stringify({
      type: 'job:started',
      timestamp: new Date().toISOString(),
      data: {
        jobId: 'test-job',
        commentIds: ['uuid-1'],
        timestamp: new Date().toISOString(),
      }
    }));

    // Verificar que el mensaje se procesó correctamente
    // (usar mock de handler para verificar)
  });
});
```

## 🔧 Herramientas de Desarrollo

### VS Code Extensions Recomendadas
- **TypeScript Hero**: Auto-import y organización
- **Error Lens**: Errores inline en tiempo real  
- **TypeScript Importer**: Import automático inteligente
- **Zod Snippets**: Snippets para schemas Zod

### Scripts de Desarrollo
```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    "generate-types": "node scripts/generate-types.js",
    "test:types": "jest --testPathPattern=types",
    "lint:types": "eslint --ext .ts,.tsx src/types/"
  }
}
```

`★ Insight ─────────────────────────────────────`
**Development Workflow**: La clave del éxito es la integración en el workflow de desarrollo. Los tipos deben generarse automáticamente en cada build, los tests deben validar contratos de API, y el linting debe capturar inconsistencias. Esto garantiza que el sistema de tipos sea una ayuda, no un obstáculo.
`─────────────────────────────────────────────────`

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Analizar la estructura de WebSocket y eventos en el backend", "status": "completed", "activeForm": "Analizando la estructura de WebSocket y eventos en el backend"}, {"content": "Documentar todos los endpoints y routers disponibles", "status": "completed", "activeForm": "Documentando todos los endpoints y routers disponibles"}, {"content": "Documentar el funcionamiento completo del WebSocket", "status": "completed", "activeForm": "Documentando el funcionamiento completo del WebSocket"}, {"content": "Crear plan de tipado para eventos de WebSocket en frontend", "status": "completed", "activeForm": "Creando plan de tipado para eventos de WebSocket en frontend"}]