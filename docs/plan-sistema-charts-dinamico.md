# Plan: Sistema de Charts Dinámico con CubeJS

## Análisis del Sistema Actual

### Fortalezas Identificadas
1. **CubeJS Bien Configurado**: El cubo `brand_analytics` ya tiene todas las dimensiones y métricas necesarias
2. **Endpoints Específicos**: Cada router expone datos para casos de uso concretos
3. **Transformaciones en Backend**: Los datos se procesan correctamente con transformers
4. **Sistema Blocks v2**: Frontend moderno con Property/Parameter Descriptors

### Oportunidades de Mejora
1. **Flexibilidad Limitada**: Los charts están atados a endpoints específicos
2. **Duplicación de Lógica**: Múltiples endpoints hacen queries similares con variaciones menores
3. **Dificultad para Nuevas Visualizaciones**: Agregar un nuevo tipo de chart requiere crear un nuevo endpoint

## Propuesta: Sistema Dinámico Unificado

### Concepto Core
Crear un **único endpoint dinámico** que permita construir cualquier query de CubeJS desde el frontend, manteniendo TODOS los endpoints actuales para compatibilidad total.

```
Frontend (Blocks v2) → Dynamic Query Builder → Unified Endpoint → CubeJS
                      ↓
                  Legacy Endpoints (para compatibilidad)
```

## Implementación Detallada

### 1. Nuevo Router Dinámico (Backend)

```typescript
// apps/server/src/routers/charts.ts
import { z } from "zod";
import { publicProcedure, router } from "../lib/trpc";
import { cubeClient } from "../lib/cube";
import * as transformers from "../lib/transformers";

// Schema para queries dinámicas
const DynamicQuerySchema = z.object({
  // Dimensiones disponibles del cubo
  dimensions: z.array(z.enum([
    "brand_analytics.brand_name",
    "brand_analytics.engine_name",
    "brand_analytics.persona_name",
    "brand_analytics.attribute_name",
    "brand_analytics.tag_name",
    "brand_analytics.model_name",
    "brand_analytics.mention_sentiment",
    "brand_analytics.attribute_sentiment",
    "brand_analytics.website_domain",
    // ... todas las dimensiones del cubo
  ])).optional(),
  
  // Métricas disponibles
  measures: z.array(z.enum([
    "brand_analytics.total_responses",
    "brand_analytics.total_mentions",
    "brand_analytics.positive_mentions",
    "brand_analytics.negative_mentions",
    "brand_analytics.neutral_mentions",
    "brand_analytics.avg_mention_score",
    "brand_analytics.avg_sentiment_score",
    "brand_analytics.avg_position_score",
    "brand_analytics.avg_visibility_score",
    // ... todas las métricas del cubo
  ])).optional(),
  
  // Filtros dinámicos
  filters: z.array(z.object({
    member: z.string(),
    operator: z.enum(["equals", "notEquals", "contains", "notContains", "in", "notIn", "gt", "gte", "lt", "lte"]),
    values: z.array(z.any())
  })).optional(),
  
  // Dimensiones temporales
  timeDimensions: z.array(z.object({
    dimension: z.string(),
    granularity: z.enum(["day", "week", "month", "quarter", "year"]),
    dateRange: z.tuple([z.string(), z.string()]).optional()
  })).optional(),
  
  // Ordenamiento
  order: z.record(z.enum(["asc", "desc"])).optional(),
  
  // Límite de resultados
  limit: z.number().optional(),
  
  // Transformaciones post-query
  transformations: z.array(z.object({
    type: z.enum(["calculateSOV", "calculateRankings", "normalizeScore", "calculateSentiment"]),
    config: z.any().optional()
  })).optional()
});

export const chartsRouter = router({
  // Endpoint dinámico principal
  dynamicQuery: publicProcedure
    .input(DynamicQuerySchema)
    .query(async ({ input }) => {
      // Construir query para CubeJS
      const query = {
        dimensions: input.dimensions || [],
        measures: input.measures || [],
        filters: input.filters || [],
        timeDimensions: input.timeDimensions || [],
        order: input.order || {},
        limit: input.limit
      };
      
      // Ejecutar query
      const rawData = await cubeClient.query(query);
      
      // Aplicar transformaciones si se especifican
      let processedData = rawData;
      if (input.transformations) {
        for (const transform of input.transformations) {
          switch (transform.type) {
            case "calculateSOV":
              processedData = transformers.calculateSOV(processedData);
              break;
            case "calculateRankings":
              processedData = transformers.calculateRankings(
                processedData, 
                transform.config
              );
              break;
            case "normalizeScore":
              processedData = transformers.normalizeScores(processedData);
              break;
            case "calculateSentiment":
              processedData = processedData.map(row => ({
                ...row,
                sentiment: transformers.calculateNormalizedSentiment(
                  row.positive || 0,
                  row.negative || 0, 
                  row.neutral || 0
                )
              }));
              break;
          }
        }
      }
      
      return {
        data: processedData,
        query: query, // Para debugging
        meta: {
          rowCount: processedData.length,
          executionTime: Date.now()
        }
      };
    }),
  
  // Meta endpoint para descubrir campos disponibles
  getAvailableFields: publicProcedure
    .query(async () => {
      // En producción, esto vendría de CubeJS meta API
      return {
        dimensions: [
          { name: "brand_analytics.brand_name", type: "string", title: "Brand" },
          { name: "brand_analytics.engine_name", type: "string", title: "AI Engine" },
          { name: "brand_analytics.persona_name", type: "string", title: "Persona" },
          { name: "brand_analytics.attribute_name", type: "string", title: "Attribute" },
          { name: "brand_analytics.tag_name", type: "string", title: "Tag" },
          { name: "brand_analytics.model_name", type: "string", title: "Car Model" },
          { name: "brand_analytics.mention_sentiment", type: "string", title: "Sentiment" },
          { name: "brand_analytics.created_at", type: "time", title: "Date" },
          // ... más dimensiones
        ],
        measures: [
          { name: "brand_analytics.total_mentions", type: "count", title: "Total Mentions" },
          { name: "brand_analytics.positive_mentions", type: "count", title: "Positive Mentions" },
          { name: "brand_analytics.negative_mentions", type: "count", title: "Negative Mentions" },
          { name: "brand_analytics.avg_mention_score", type: "avg", title: "Avg Mention Score" },
          { name: "brand_analytics.avg_sentiment_score", type: "avg", title: "Avg Sentiment" },
          // ... más métricas
        ],
        filters: [
          { dimension: "brand_analytics.brand_name", operators: ["equals", "in"], suggestedValues: ["Ford", "Toyota", "Tesla"] },
          { dimension: "brand_analytics.engine_name", operators: ["equals", "in"], suggestedValues: ["gpt-4", "perplexity"] },
          // ... más filtros
        ]
      };
    }),
  
  // Presets de queries comunes
  getQueryPresets: publicProcedure
    .query(() => {
      return [
        {
          id: "brand-overview",
          name: "Brand Overview",
          description: "Key metrics for brand performance",
          query: {
            dimensions: ["brand_analytics.brand_name"],
            measures: [
              "brand_analytics.total_mentions",
              "brand_analytics.avg_mention_score",
              "brand_analytics.avg_sentiment_score"
            ],
            order: { "brand_analytics.total_mentions": "desc" }
          }
        },
        {
          id: "attribute-analysis",
          name: "Attribute Analysis",
          description: "Top attributes by brand",
          query: {
            dimensions: ["brand_analytics.attribute_name", "brand_analytics.brand_name"],
            measures: [
              "brand_analytics.total_attributes_detections",
              "brand_analytics.positive_attributes",
              "brand_analytics.negative_attributes"
            ],
            limit: 20
          }
        },
        // ... más presets basados en los endpoints actuales
      ];
    })
});
```

### 2. Adaptador de Compatibilidad

Para mantener TODOS los endpoints existentes funcionando:

```typescript
// apps/server/src/routers/adapters/legacy-adapter.ts
export class LegacyToChartAdapter {
  // Convierte llamadas legacy a formato dinámico
  static async executeWithAdapter(
    legacyQuery: any, 
    transformations?: any[]
  ) {
    // Mapear query legacy a formato dinámico
    const dynamicQuery = {
      dimensions: legacyQuery.dimensions,
      measures: legacyQuery.measures,
      filters: legacyQuery.filters,
      timeDimensions: legacyQuery.timeDimensions,
      order: legacyQuery.order,
      limit: legacyQuery.limit,
      transformations
    };
    
    // Usar el nuevo endpoint dinámico internamente
    return chartsRouter.dynamicQuery.query({ input: dynamicQuery });
  }
}

// Actualizar endpoints existentes para usar el adaptador
// apps/server/src/routers/attributes.ts (ejemplo)
export const attributesRouter = router({
  getTopAttributes: publicProcedure
    .input(getTopAttributesSchema)
    .query(async ({ input }) => {
      // Query original se mantiene igual
      const query = templates.brandAttributes(input.brand, input.limit);
      
      // Pero ahora usa el sistema dinámico internamente
      const result = await LegacyToChartAdapter.executeWithAdapter(query, [
        { type: "calculateSentiment" }
      ]);
      
      // Mantener el formato de respuesta exacto
      return result.data.map((row) => ({
        attribute: row["brand_analytics.attribute_name"],
        total: row["brand_analytics.total_attributes_detections"],
        // ... mismo formato que antes
      }));
    })
});
```

### 3. Frontend: Chart Builder Mejorado

```typescript
// apps/web/src/blocks/v2/builders/ChartQueryBuilder.tsx
import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, X, Save, Play } from 'lucide-react';

interface ChartQueryBuilderProps {
  value: any;
  onChange: (value: any) => void;
  // Modo legacy para mantener compatibilidad
  legacyEndpoint?: string;
}

export const ChartQueryBuilder: React.FC<ChartQueryBuilderProps> = ({
  value,
  onChange,
  legacyEndpoint
}) => {
  const [query, setQuery] = useState(value || {
    dimensions: [],
    measures: [],
    filters: [],
    transformations: []
  });
  
  // Cargar campos disponibles
  const { data: fields } = trpc.charts.getAvailableFields.useQuery();
  const { data: presets } = trpc.charts.getQueryPresets.useQuery();
  
  // Si hay un endpoint legacy, cargar su configuración
  useEffect(() => {
    if (legacyEndpoint && presets) {
      const preset = presets.find(p => p.id === legacyEndpoint);
      if (preset) {
        setQuery(preset.query);
      }
    }
  }, [legacyEndpoint, presets]);
  
  const addDimension = (dimension: string) => {
    setQuery(prev => ({
      ...prev,
      dimensions: [...prev.dimensions, dimension]
    }));
  };
  
  const addMeasure = (measure: string) => {
    setQuery(prev => ({
      ...prev,
      measures: [...prev.measures, measure]
    }));
  };
  
  const addFilter = () => {
    setQuery(prev => ({
      ...prev,
      filters: [...prev.filters, {
        member: '',
        operator: 'equals',
        values: []
      }]
    }));
  };
  
  const updateFilter = (index: number, updates: any) => {
    setQuery(prev => ({
      ...prev,
      filters: prev.filters.map((f, i) => 
        i === index ? { ...f, ...updates } : f
      )
    }));
  };
  
  // Test query antes de guardar
  const testQuery = async () => {
    const result = await trpc.charts.dynamicQuery.query({ input: query });
    console.log('Query result:', result);
  };
  
  return (
    <div className="space-y-4">
      {/* Preset selector */}
      <div>
        <label className="text-sm font-medium">Quick Start Preset</label>
        <Select onValueChange={(presetId) => {
          const preset = presets?.find(p => p.id === presetId);
          if (preset) setQuery(preset.query);
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Select a preset..." />
          </SelectTrigger>
          <SelectContent>
            {presets?.map(preset => (
              <SelectItem key={preset.id} value={preset.id}>
                <div>
                  <div className="font-medium">{preset.name}</div>
                  <div className="text-sm text-muted-foreground">{preset.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Tabs defaultValue="dimensions">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dimensions">
            Dimensions 
            {query.dimensions.length > 0 && (
              <Badge variant="secondary" className="ml-1">{query.dimensions.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="measures">
            Measures
            {query.measures.length > 0 && (
              <Badge variant="secondary" className="ml-1">{query.measures.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="filters">
            Filters
            {query.filters.length > 0 && (
              <Badge variant="secondary" className="ml-1">{query.filters.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="transform">Transform</TabsTrigger>
        </TabsList>
        
        {/* Dimensions Tab */}
        <TabsContent value="dimensions" className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {query.dimensions.map((dim, i) => (
              <Badge key={i} variant="outline">
                {fields?.dimensions.find(d => d.name === dim)?.title || dim}
                <button
                  onClick={() => setQuery(prev => ({
                    ...prev,
                    dimensions: prev.dimensions.filter((_, idx) => idx !== i)
                  }))}
                  className="ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          
          <Select onValueChange={addDimension}>
            <SelectTrigger>
              <SelectValue placeholder="Add dimension..." />
            </SelectTrigger>
            <SelectContent>
              {fields?.dimensions
                .filter(d => !query.dimensions.includes(d.name))
                .map(dim => (
                  <SelectItem key={dim.name} value={dim.name}>
                    <div className="flex items-center justify-between w-full">
                      <span>{dim.title}</span>
                      <Badge variant="secondary" className="ml-2">{dim.type}</Badge>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </TabsContent>
        
        {/* Measures Tab */}
        <TabsContent value="measures" className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {query.measures.map((measure, i) => (
              <Badge key={i} variant="outline">
                {fields?.measures.find(m => m.name === measure)?.title || measure}
                <button
                  onClick={() => setQuery(prev => ({
                    ...prev,
                    measures: prev.measures.filter((_, idx) => idx !== i)
                  }))}
                  className="ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          
          <Select onValueChange={addMeasure}>
            <SelectTrigger>
              <SelectValue placeholder="Add measure..." />
            </SelectTrigger>
            <SelectContent>
              {fields?.measures
                .filter(m => !query.measures.includes(m.name))
                .map(measure => (
                  <SelectItem key={measure.name} value={measure.name}>
                    <div className="flex items-center justify-between w-full">
                      <span>{measure.title}</span>
                      <Badge variant="secondary" className="ml-2">{measure.type}</Badge>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </TabsContent>
        
        {/* Filters Tab */}
        <TabsContent value="filters" className="space-y-3">
          {query.filters.map((filter, i) => (
            <div key={i} className="space-y-2 p-3 border rounded">
              <div className="flex gap-2">
                <Select 
                  value={filter.member}
                  onValueChange={(member) => updateFilter(i, { member })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select field..." />
                  </SelectTrigger>
                  <SelectContent>
                    {fields?.dimensions.map(dim => (
                      <SelectItem key={dim.name} value={dim.name}>{dim.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={filter.operator}
                  onValueChange={(operator) => updateFilter(i, { operator })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="in">In</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="gt">Greater than</SelectItem>
                    <SelectItem value="lt">Less than</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuery(prev => ({
                    ...prev,
                    filters: prev.filters.filter((_, idx) => idx !== i)
                  }))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Filter values input */}
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-1 border rounded"
                  placeholder="Value..."
                  value={filter.values[0] || ''}
                  onChange={(e) => updateFilter(i, { values: [e.target.value] })}
                />
              </div>
            </div>
          ))}
          
          <Button onClick={addFilter} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Filter
          </Button>
        </TabsContent>
        
        {/* Transform Tab */}
        <TabsContent value="transform" className="space-y-3">
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={query.transformations?.some(t => t.type === 'calculateSOV')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setQuery(prev => ({
                      ...prev,
                      transformations: [...(prev.transformations || []), { type: 'calculateSOV' }]
                    }));
                  } else {
                    setQuery(prev => ({
                      ...prev,
                      transformations: prev.transformations?.filter(t => t.type !== 'calculateSOV')
                    }));
                  }
                }}
              />
              Calculate Share of Voice
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={query.transformations?.some(t => t.type === 'calculateSentiment')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setQuery(prev => ({
                      ...prev,
                      transformations: [...(prev.transformations || []), { type: 'calculateSentiment' }]
                    }));
                  }
                }}
              />
              Calculate Sentiment Scores
            </label>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={testQuery} variant="outline">
          <Play className="h-4 w-4 mr-2" />
          Test Query
        </Button>
        <Button onClick={() => onChange(query)} className="flex-1">
          <Save className="h-4 w-4 mr-2" />
          Apply Configuration
        </Button>
      </div>
    </div>
  );
};
```

### 4. Chart Block Unificado

```typescript
// apps/web/src/blocks/v2/definitions/charts/unified-chart.ts
import { defineBlock } from '../../core/registry';
import { createPropertyDescriptor } from '../../types/property-descriptor';
import { z } from 'zod';

export const unifiedChartBlock = defineBlock({
  id: 'charts.unified',
  displayName: 'Dynamic Chart',
  description: 'Flexible chart with custom data queries',
  category: 'charts',
  
  properties: {
    // Modo de configuración
    mode: createPropertyDescriptor({
      key: 'mode',
      type: 'string',
      displayName: 'Configuration Mode',
      category: 'data',
      schema: z.enum(['dynamic', 'legacy']),
      defaultValue: 'dynamic',
      control: {
        type: 'select',
        choices: [
          { label: 'Dynamic Query Builder', value: 'dynamic' },
          { label: 'Legacy Endpoint', value: 'legacy' }
        ]
      }
    }),
    
    // Para modo legacy
    endpoint: createPropertyDescriptor({
      key: 'endpoint',
      type: 'string',
      displayName: 'Legacy Endpoint',
      category: 'data',
      schema: z.string().optional(),
      hidden: (ctx) => ctx.props.mode !== 'legacy',
      control: { type: 'endpoint-selector' }
    }),
    
    // Para modo dinámico
    query: createPropertyDescriptor({
      key: 'query',
      type: 'object',
      displayName: 'Query Configuration',
      category: 'data',
      schema: z.object({
        dimensions: z.array(z.string()),
        measures: z.array(z.string()),
        filters: z.array(z.any()),
        transformations: z.array(z.any()).optional()
      }).optional(),
      hidden: (ctx) => ctx.props.mode !== 'dynamic',
      control: { type: 'chart-query-builder' }
    }),
    
    // Tipo de visualización
    chartType: createPropertyDescriptor({
      key: 'chartType',
      type: 'string',
      displayName: 'Chart Type',
      category: 'style',
      schema: z.enum(['bar', 'line', 'pie', 'scatter', 'heatmap', 'table']),
      defaultValue: 'bar',
      control: {
        type: 'select',
        choices: [
          { label: 'Bar Chart', value: 'bar' },
          { label: 'Line Chart', value: 'line' },
          { label: 'Pie Chart', value: 'pie' },
          { label: 'Scatter Plot', value: 'scatter' },
          { label: 'Heatmap', value: 'heatmap' },
          { label: 'Data Table', value: 'table' }
        ]
      }
    }),
    
    // Mapeo de datos a ejes
    dataMapping: createPropertyDescriptor({
      key: 'dataMapping',
      type: 'object',
      displayName: 'Data Mapping',
      category: 'style',
      schema: z.object({
        x: z.string().optional(),
        y: z.string().optional(),
        color: z.string().optional(),
        size: z.string().optional(),
        label: z.string().optional()
      }),
      control: { type: 'data-mapping' }
    })
  },
  
  // Hook para usar datos
  useData: (props) => {
    if (props.mode === 'legacy' && props.endpoint) {
      // Usar endpoint legacy
      return trpc[props.endpoint].useQuery(props.params);
    } else if (props.mode === 'dynamic' && props.query) {
      // Usar query dinámica
      return trpc.charts.dynamicQuery.useQuery({ input: props.query });
    }
    
    return { data: null, isLoading: false };
  },
  
  component: UnifiedChartComponent
});
```

## Migración Incremental

### Fase 1: Backend (Semana 1)
1. **Día 1-2**: Implementar router `charts` con endpoint dinámico
2. **Día 3-4**: Crear adaptador de compatibilidad
3. **Día 5**: Testing exhaustivo con queries actuales

### Fase 2: Frontend Query Builder (Semana 2)
1. **Día 1-2**: Implementar ChartQueryBuilder component
2. **Día 3-4**: Crear property control personalizado
3. **Día 5**: Integrar con Property Panel

### Fase 3: Chart Unificado (Semana 3)
1. **Día 1-2**: Implementar UnifiedChartBlock
2. **Día 3-4**: Añadir soporte para todos los tipos de chart
3. **Día 5**: Testing con datos reales

### Fase 4: Migración Gradual (Semana 4)
1. **Día 1-2**: Migrar blocks existentes para usar modo legacy
2. **Día 3-4**: Documentación y ejemplos
3. **Día 5**: Deploy y monitoreo

## Ventajas del Enfoque

### 1. **Compatibilidad Total**
- TODOS los endpoints actuales siguen funcionando
- Los blocks existentes no se rompen
- Migración opcional y gradual

### 2. **Flexibilidad Infinita**
- Cualquier combinación de dimensiones/métricas
- Filtros dinámicos sin límites
- Transformaciones componibles

### 3. **Performance Optimizado**
- Una sola query a CubeJS por chart
- Caching automático de CubeJS
- Menos round-trips al servidor

### 4. **Developer Experience**
- Query builder visual
- Presets basados en casos comunes
- Testing integrado en el builder

### 5. **Mantenibilidad**
- Un solo endpoint para mantener
- Lógica de transformación centralizada
- Fácil añadir nuevas dimensiones/métricas

## Consideraciones Importantes

### Seguridad
- Validación estricta de queries con Zod
- Whitelist de dimensiones/métricas permitidas
- Rate limiting en el endpoint dinámico

### Performance
- Límites en queries (max dimensions, measures)
- Caching agresivo para queries comunes
- Monitoreo de queries lentas

### UX
- Modo "Simple" para usuarios no técnicos (presets)
- Modo "Avanzado" para power users (query builder)
- Guardar queries como templates reutilizables

## Próximos Pasos

1. **Validar con el equipo** el enfoque propuesto
2. **Crear POC** del endpoint dinámico
3. **Testing** con queries reales de producción
4. **Refinamiento** basado en feedback

Este plan mantiene TODO lo que funciona actualmente mientras añade flexibilidad ilimitada para el futuro.