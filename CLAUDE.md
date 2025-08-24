# Sistema de Categorización de Comentarios por Insights

## Descripción General
Sistema que utiliza IA para categorizar comentarios automáticamente en insights existentes o crear nuevos insights. Construido con TypeScript/Bun y PostgreSQL.

## Arquitectura del Sistema

### Base de Datos (PostgreSQL + Drizzle ORM)

**`comments`** - Comentarios de entrada
- `id` (UUID): Identificador único
- `content` (TEXT): Contenido del comentario
- `created_at`, `updated_at`: Timestamps

**`insights`** - Insights categorizados
- `id` (SERIAL): Identificador único
- `name` (TEXT): Nombre del insight
- `content` (TEXT): Contenido del insight
- `description` (TEXT): Descripción detallada
- `ai_generated` (BOOLEAN): Si fue generado por IA
- `created_at`, `updated_at`: Timestamps

**`comment_insights`** - Relación many-to-many
- `id` (UUID): Identificador de la relación
- `comment_id` (UUID): Referencia al comentario
- `insight_id` (INTEGER): Referencia al insight
- `created_at`, `updated_at`: Timestamps

### Namespace AI
Sistema unificado para generación de texto y objetos con IA:
- **Providers**: OpenAI, Google
- **Performance**: low, medium, high
- **Funciones**: `generateText`, `generateObject`
- **Errores tipados**: `NoObjectGeneratedError`, `SchemaValidationError`, etc.
- **Sub-namespaces**: `PromptTemplates`, `Schemas`

### Worker: CommentCategorization
Namespace completo para el procesamiento de comentarios:

#### Events (Para tracking de estado vía WebSocket)
- **Lifecycle**: `jobStarted`, `jobCompleted`, `jobFailed`
- **Data**: `dataFetchStarted`, `dataFetchCompleted`
- **Analysis**: `analysisStarted`, `analysisProgress`, `analysisCompleted`
- **Insights**: `insightCreated`, `insightMatched`
- **State**: `stateChanged` (para actualizaciones en tiempo real)

#### Errors (Errores específicos del dominio)
- `DataFetchError`: Error al obtener datos
- `AnalysisError`: Error en análisis de IA
- `InsightCreationError`: Error creando insight
- `RelationshipCreationError`: Error creando relaciones

#### Estados del Worker
1. `initializing`: Preparando el job
2. `fetching_data`: Obteniendo comentarios e insights
3. `analyzing`: Procesando con IA
4. `creating_insights`: Creando nuevos insights
5. `creating_relationships`: Vinculando comentarios con insights
6. `completed`: Proceso exitoso
7. `failed`: Error en el proceso

## Flujo de Procesamiento

1. **Recepción**: Job con IDs de comentarios
2. **Fetch Data**: Obtiene comentarios e insights existentes
3. **Análisis IA**: 
   - Genera prompt con `PromptTemplates`
   - Usa `AI.generateObject` con schema validado
   - Categoriza en insights existentes o propone nuevos
4. **Procesamiento**:
   - Crea nuevos insights si es necesario
   - Establece relaciones comment-insight
5. **Eventos**: Emite eventos en cada fase para tracking

## Uso del Worker

```typescript
import { CommentCategorization } from "@/queues/workers/commentCategorization";

// Iniciar worker
const worker = await CommentCategorization.createWorker();

// Escuchar eventos para WebSocket
Bus.subscribe(CommentCategorization.Events.stateChanged, (event) => {
  // Enviar actualización por WebSocket
  ws.send({
    jobId: event.properties.jobId,
    state: event.properties.state,
    progress: event.properties.progress
  });
});

// Manejar errores específicos
try {
  // ...
} catch (error) {
  if (CommentCategorization.Errors.AnalysisError.isInstance(error)) {
    // Manejar error de análisis
  }
}
```

## Características Clave
- **Namespace-based**: Código organizado en namespaces cohesivos
- **Event-driven**: Eventos detallados para tracking completo
- **Type-safe**: Errores y datos fuertemente tipados con Zod
- **WebSocket-ready**: Estados y progreso para actualizaciones en tiempo real
- **Error handling**: Errores específicos del dominio con contexto