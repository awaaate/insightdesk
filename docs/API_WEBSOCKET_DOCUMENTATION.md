# 📡 API y WebSocket - Sistema de Insights

Este documento describe la arquitectura completa de endpoints y WebSocket para el sistema de categorización de comentarios por insights.

## 🌐 Arquitectura General

El sistema está basado en:
- **tRPC** para endpoints tipados
- **WebSocket** en tiempo real con Bun
- **Bull Queue** para procesamiento asíncrono
- **Event Bus** para comunicación entre componentes

`★ Insight ─────────────────────────────────────`
**Event-Driven Architecture**: El sistema utiliza un bus de eventos centralizado que permite comunicación desacoplada entre workers, WebSocket y API. Cada operación emite eventos específicos que el WebSocket retransmite al frontend en tiempo real.
`─────────────────────────────────────────────────`

## 🔌 WebSocket Server

### Endpoint de Conexión
```
ws://localhost:3000/ws
```

### Estados de Conexión

#### 1. **Conexión Establecida**
```typescript
// Mensaje de bienvenida automático
{
  type: "connection:established",
  timestamp: "2024-08-24T10:30:00.000Z",
  data: {
    message: "Connected to Comment Categorization stream",
    stats: {
      totalConnections: 5,
      totalSubscriptions: 3,
      subscriptionDetails: [
        { jobId: "job-123", subscribers: 2 }
      ]
    }
  }
}
```

#### 2. **Mensajes del Cliente**

##### Suscribirse a Jobs Específicos
```typescript
// Cliente envía:
{
  type: "subscribe:jobs",
  jobIds: ["job-123", "job-456"]
}

// Servidor responde:
{
  type: "subscription:confirmed", 
  timestamp: "2024-08-24T10:30:01.000Z",
  data: { jobIds: ["job-123", "job-456"] }
}
```

##### Desuscribirse de Jobs
```typescript
// Cliente envía:
{
  type: "unsubscribe:jobs",
  jobIds: ["job-123"]
}

// Servidor responde:
{
  type: "unsubscription:confirmed",
  timestamp: "2024-08-24T10:30:02.000Z", 
  data: { jobIds: ["job-123"] }
}
```

##### Ping/Pong para Keep-Alive
```typescript
// Cliente envía:
{ type: "ping" }

// Servidor responde:
{
  type: "pong",
  timestamp: "2024-08-24T10:30:03.000Z",
  data: { 
    stats: {
      totalConnections: 5,
      totalSubscriptions: 3
    } 
  }
}
```

### 📨 Eventos en Tiempo Real

#### **Ciclo de Vida de Jobs**

##### Job Iniciado
```typescript
{
  type: "job:started",
  timestamp: "2024-08-24T10:30:04.000Z",
  data: {
    jobId: "job-123",
    commentIds: ["uuid-1", "uuid-2", "uuid-3"],
    timestamp: "2024-08-24T10:30:04.000Z"
  }
}
```

##### Job Completado
```typescript
{
  type: "job:completed",
  timestamp: "2024-08-24T10:35:15.000Z",
  data: {
    jobId: "job-123",
    result: {
      processedComments: 3,
      matchedInsights: 2,
      createdInsights: 1
    },
    duration: 311000, // ms
    timestamp: "2024-08-24T10:35:15.000Z"
  }
}
```

##### Job Fallido
```typescript
{
  type: "job:failed",
  timestamp: "2024-08-24T10:31:30.000Z",
  data: {
    jobId: "job-123",
    error: "AI generation failed after 3 attempts",
    errorType: "CommentCategorization.AnalysisError",
    errorContext: {
      analysisPhase: "ai_generation",
      provider: "openai", 
      commentCount: 3,
      insightCount: 150
    }
  }
}
```

#### **Estados de Procesamiento**

##### Cambio de Estado
```typescript
{
  type: "state:changed",
  timestamp: "2024-08-24T10:30:15.000Z",
  data: {
    jobId: "job-123",
    state: "analyzing", // "initializing" | "fetching_data" | "analyzing" | "creating_insights" | "creating_relationships" | "completed" | "failed"
    progress: 30, // 0-100
    details: {
      currentPhase: "AI analysis in progress",
      estimatedTimeRemaining: 45000
    }
  }
}
```

#### **Eventos de Análisis**

##### Análisis Iniciado
```typescript
{
  type: "analysis:started",
  timestamp: "2024-08-24T10:30:20.000Z",
  data: {
    commentCount: 3,
    insightCount: 150,
    provider: "openai",
    performance: "low"
  }
}
```

##### Análisis Completado
```typescript
{
  type: "analysis:completed", 
  timestamp: "2024-08-24T10:32:45.000Z",
  data: {
    totalAnalyzed: 3,
    matchedExisting: 2,
    newInsightsFound: 1,
    averageConfidence: 8.3
  }
}
```

#### **Eventos de Insights**

##### Insight Creado
```typescript
{
  type: "insight:created",
  timestamp: "2024-08-24T10:32:50.000Z",
  data: {
    insightId: 151,
    name: "Problemas de conectividad móvil",
    aiGenerated: true
  }
}
```

##### Insight Emparejado
```typescript
{
  type: "insight:matched",
  timestamp: "2024-08-24T10:32:55.000Z",
  data: {
    insightId: 45,
    name: "La aplicación se cierra sola o no abre",
    commentId: "uuid-2",
    confidence: 9
  }
}
```

## 🛠️ Endpoints API (tRPC)

### Base URL
```
http://localhost:3000/api/trpc
```

### **Router: Processing**

#### `categorizeComments`
**Método:** `MUTATION`  
**Endpoint:** `/processing.categorizeComments`

```typescript
// Input
{
  commentIds: string[]; // min 1
  metadata?: Record<string, any>;
}

// Output
{
  success: true,
  message: "Queued 2 jobs for 25 comments",
  details: {
    totalComments: 25,
    batchSize: 20, // Máximo por job
    jobsCreated: 2,
    batches: [
      {
        index: 0,
        size: 20,
        commentIds: ["uuid-1", "uuid-2", /*...*/]
      },
      {
        index: 1, 
        size: 5,
        commentIds: ["uuid-21", "uuid-22", /*...*/]
      }
    ]
  }
}
```

**Características:**
- Divide automáticamente en lotes de máximo 20 comentarios
- Configuración de reintentos: 3 intentos con backoff exponencial
- Retorna IDs de jobs para suscripción WebSocket

---

### **Router: Comments**

#### `create`
**Método:** `MUTATION`  
**Endpoint:** `/comments.create`

```typescript
// Input
{
  comments: Array<{
    content: string; // min 1 char
  }>; // min 1 comment
}

// Output
{
  success: true,
  message: "Created 5 comments",
  commentIds: ["uuid-1", "uuid-2", /*...*/],
  comments: [
    {
      id: "uuid-1",
      content: "La app se crashea constantemente",
      created_at: "2024-08-24T10:30:00.000Z",
      updated_at: "2024-08-24T10:30:00.000Z"
    }
    // ...
  ]
}
```

#### `list`
**Método:** `QUERY`  
**Endpoint:** `/comments.list`

```typescript
// Input (opcional)
{
  limit?: number; // 1-100, default: 20
  offset?: number; // min 0, default: 0
}

// Output
{
  comments: Array<{
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
  }>,
  pagination: {
    total: 1250,
    limit: 20,
    offset: 0,
    hasMore: true
  }
}
```

#### `getWithInsights` 
**Método:** `QUERY`  
**Endpoint:** `/comments.getWithInsights`

```typescript
// Input
{
  commentId: string; // UUID
}

// Output
{
  comment: {
    id: "uuid-1",
    content: "La app se crashea constantemente",
    created_at: "2024-08-24T10:30:00.000Z",
    updated_at: "2024-08-24T10:30:00.000Z"
  },
  insights: [
    {
      id: 45,
      name: "La aplicación se cierra sola o no abre, dificultando su uso",
      content: "Descripción del insight...",
      description: "Descripción del insight...", 
      ai_generated: false,
      created_at: "2024-08-20T15:20:00.000Z",
      updated_at: "2024-08-24T10:32:55.000Z"
    }
    // ...
  ]
}
```

---

### **Router: Insights**

#### `list`
**Método:** `QUERY`  
**Endpoint:** `/insights.list`

```typescript
// Input (opcional)
{
  limit?: number; // 1-100, default: 20
  offset?: number; // min 0, default: 0
  onlyAiGenerated?: boolean;
}

// Output
{
  insights: Array<{
    id: number,
    name: string,
    content: string,
    description: string,
    ai_generated: boolean,
    created_at: string,
    updated_at: string,
    commentCount: number // Número de comentarios asociados
  }>,
  pagination: {
    total: 150,
    limit: 20, 
    offset: 0,
    hasMore: true
  }
}
```

#### `getWithComments`
**Método:** `QUERY`  
**Endpoint:** `/insights.getWithComments`

```typescript
// Input  
{
  insightId: number;
}

// Output
{
  insight: {
    id: 45,
    name: "La aplicación se cierra sola o no abre",
    content: "Descripción...",
    description: "Descripción...",
    ai_generated: false,
    created_at: "2024-08-20T15:20:00.000Z",
    updated_at: "2024-08-24T10:32:55.000Z"
  },
  comments: [
    {
      id: "uuid-1", 
      content: "La app se crashea constantemente",
      created_at: "2024-08-24T10:30:00.000Z",
      updated_at: "2024-08-24T10:30:00.000Z"
    }
    // ...
  ]
}
```

#### `stats`
**Método:** `QUERY`  
**Endpoint:** `/insights.stats`

```typescript
// Input: ninguno

// Output
{
  totalInsights: 150,
  aiGeneratedInsights: 45,
  manualInsights: 105,
  avgCommentsPerInsight: 8, // Redondeado
  recentInsights: 12, // Últimas 24h
  aiGenerationRate: 30 // Porcentaje
}
```

## 🔄 Flujo Completo de Categorización

### 1. **Crear Comentarios**
```typescript
// POST /api/trpc/comments.create
const response = await trpc.comments.create.mutate({
  comments: [
    { content: "La app se cierra al abrir" },
    { content: "No puedo hacer transferencias" },
    { content: "El login no funciona bien" }
  ]
});

const commentIds = response.commentIds; // ["uuid-1", "uuid-2", "uuid-3"]
```

### 2. **Iniciar Procesamiento**
```typescript
// POST /api/trpc/processing.categorizeComments
const jobResponse = await trpc.processing.categorizeComments.mutate({
  commentIds,
  metadata: { 
    source: "user-feedback",
    priority: "high" 
  }
});

console.log(jobResponse.details.batches); // Info de lotes creados
```

### 3. **Monitorear vía WebSocket**
```typescript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  // Suscribirse a updates de jobs específicos
  ws.send(JSON.stringify({
    type: "subscribe:jobs", 
    jobIds: jobResponse.details.batches.map(b => b.jobId)
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch(message.type) {
    case 'job:started':
      console.log('Job iniciado:', message.data.jobId);
      break;
      
    case 'state:changed':
      updateProgressBar(message.data.progress);
      break;
      
    case 'insight:created': 
      addNewInsightToUI(message.data);
      break;
      
    case 'job:completed':
      showSuccess(`Procesados ${message.data.result.processedComments} comentarios`);
      refreshInsightsList();
      break;
      
    case 'job:failed':
      showError(message.data.error);
      break;
  }
};
```

### 4. **Consultar Resultados**
```typescript
// GET /api/trpc/insights.list
const insights = await trpc.insights.list.query({
  onlyAiGenerated: true, // Ver solo insights creados por IA
  limit: 10
});

// GET /api/trpc/comments.getWithInsights  
const commentWithInsights = await trpc.comments.getWithInsights.query({
  commentId: "uuid-1"
});
```

## ⚡ Manejo de Errores

### Errores de WebSocket
```typescript
{
  type: "error",
  timestamp: "2024-08-24T10:30:00.000Z", 
  data: {
    message: "Invalid message format"
  }
}
```

### Errores de tRPC
```typescript
// Estructura estándar de error tRPC
{
  error: {
    message: "Failed to create comments",
    data: {
      code: "INTERNAL_SERVER_ERROR",
      httpStatus: 500,
      path: "comments.create"
    }
  }
}
```

### Errores del Worker
Los errores específicos del procesamiento se emiten via WebSocket como eventos `job:failed` con contexto detallado según el tipo:

- `DataFetchError`: Error obteniendo comentarios/insights de BD
- `AnalysisError`: Error en procesamiento con IA (prompt, generación, parsing)
- `InsightCreationError`: Error creando nuevo insight en BD
- `RelationshipCreationError`: Error vinculando comentario-insight

`★ Insight ─────────────────────────────────────`
**Error Recovery**: El sistema implementa reintentos automáticos con backoff exponencial para errores transitorios. Los errores críticos se reportan via WebSocket con contexto completo para debugging, incluyendo información específica del proveedor de IA y parámetros de la operación.
`─────────────────────────────────────────────────`

---

*Documentación generada para el Sistema de Categorización de Comentarios por Insights*