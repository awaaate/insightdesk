# Sistema de Charts Unificado con CubeJS

## Resumen Ejecutivo

Este plan describe cómo implementar un sistema backend-focused para gestionar dimensiones, métricas y transformaciones de datos que se integre perfectamente con el sistema de blocks v2 existente y aproveche CubeJS como data layer.

## Arquitectura General

### 1. **Backend Data Layer (CubeJS)**
```
┌─────────────────────────────────────────────────────────────┐
│                    CubeJS Data Layer                        │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Data Cubes    │  │   Dimensions    │  │   Measures   │ │
│  │                 │  │                 │  │              │ │
│  │ • BrandCube     │  │ • brand         │  │ • mentions   │ │
│  │ • MetricsCube   │  │ • date          │  │ • sentiment  │ │
│  │ • PersonaCube   │  │ • persona       │  │ • score      │ │
│  │ • SourcesCube   │  │ • source        │  │ • position   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2. **Chart Definition Layer**
```
┌─────────────────────────────────────────────────────────────┐
│                Chart Definition Service                     │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Chart Templates │  │  Data Mapping   │  │ Transform    │ │
│  │                 │  │                 │  │ Rules        │ │
│  │ • BarChart      │  │ • x: dimension  │  │ • groupBy    │ │
│  │ • LineChart     │  │ • y: measure    │  │ • orderBy    │ │
│  │ • PieChart      │  │ • color: dim    │  │ • filters    │ │
│  │ • AreaChart     │  │ • size: measure │  │ • aggregates │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 3. **Frontend Integration**
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Blocks v2                      │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Chart Blocks    │  │ Property Panel  │  │ Parameter    │ │
│  │                 │  │                 │  │ Controls     │ │
│  │ • Recharts      │  │ • Dimensions    │  │ • CubeJS     │ │
│  │ • D3.js         │  │ • Measures      │  │ • Query      │ │
│  │ • Plotly        │  │ • Transforms    │  │ • Builder    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Implementación Detallada

### Fase 1: Extensión del Backend CubeJS

#### 1.1 Nuevos Data Cubes

```javascript
// analytics/schema/UnifiedChartCube.js
cube(`UnifiedChartCube`, {
  sql: `
    SELECT 
      b.name as brand,
      rm.mention_score,
      rm.sentiment_score,
      rm.position_score,
      r.persona,
      r.source,
      p.category,
      r.created_at as date,
      ra.attribute_name,
      ra.attribute_value
    FROM response_metrics rm
    JOIN responses r ON rm.response_id = r.id
    JOIN brands b ON rm.brand_id = b.id
    JOIN prompts p ON r.prompt_id = p.id
    LEFT JOIN response_attributes ra ON r.id = ra.response_id
  `,
  
  dimensions: {
    brand: {
      sql: `brand`,
      type: `string`,
      title: `Brand`
    },
    
    persona: {
      sql: `persona`,
      type: `string`,
      title: `Persona`
    },
    
    source: {
      sql: `source`,
      type: `string`, 
      title: `Source`
    },
    
    category: {
      sql: `category`,
      type: `string`,
      title: `Category`
    },
    
    attribute: {
      sql: `attribute_name`,
      type: `string`,
      title: `Attribute`
    },
    
    date: {
      sql: `date`,
      type: `time`,
      title: `Date`
    }
  },
  
  measures: {
    mentionScore: {
      sql: `mention_score`,
      type: `avg`,
      title: `Mention Score`
    },
    
    sentimentScore: {
      sql: `sentiment_score`, 
      type: `avg`,
      title: `Sentiment Score`
    },
    
    positionScore: {
      sql: `position_score`,
      type: `avg`, 
      title: `Position Score`
    },
    
    totalMentions: {
      sql: `1`,
      type: `count`,
      title: `Total Mentions`
    },
    
    avgAttributeValue: {
      sql: `CAST(attribute_value as NUMERIC)`,
      type: `avg`,
      title: `Average Attribute Value`,
      filters: [
        { sql: `${CUBE}.attribute_value ~ '^[0-9]+\.?[0-9]*$'` }
      ]
    }
  },
  
  segments: {
    lastMonth: {
      sql: `${CUBE}.date >= CURRENT_DATE - INTERVAL '1 month'`
    },
    
    positiveScore: {
      sql: `${CUBE}.mention_score > 0.5`
    }
  }
});
```

#### 1.2 Chart Definition Service

```typescript
// radar/src/charts/types.ts
export interface ChartDimension {
  key: string;
  displayName: string;
  type: 'string' | 'time' | 'number';
  cube: string;
  sqlPath: string;
  granularities?: string[]; // for time dimensions
}

export interface ChartMeasure {
  key: string;
  displayName: string;
  type: 'sum' | 'avg' | 'count' | 'min' | 'max';
  cube: string;
  sqlPath: string;
  format?: 'currency' | 'percentage' | 'number';
}

export interface ChartTransform {
  type: 'groupBy' | 'orderBy' | 'filter' | 'limit';
  field: string;
  value?: any;
  operator?: 'equals' | 'contains' | 'gt' | 'lt' | 'between';
}

export interface ChartTemplate {
  id: string;
  name: string;
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'heatmap';
  requiredMappings: {
    x?: 'dimension' | 'measure';
    y?: 'dimension' | 'measure'; 
    color?: 'dimension';
    size?: 'measure';
    series?: 'dimension';
  };
  supportedDimensions: number; // max dimensions
  supportedMeasures: number; // max measures
  defaultTransforms: ChartTransform[];
}

export interface ChartConfiguration {
  templateId: string;
  dimensions: ChartDimension[];
  measures: ChartMeasure[];
  transforms: ChartTransform[];
  mappings: {
    x?: string; // dimension/measure key
    y?: string;
    color?: string;
    size?: string;
    series?: string;
  };
}
```

#### 1.3 Chart Service Implementation

```typescript
// radar/src/charts/service.ts
import { cubejs } from '../lib/cubejs';

export class ChartService {
  
  // Get available dimensions and measures from CubeJS meta
  async getAvailableFields(): Promise<{
    dimensions: ChartDimension[];
    measures: ChartMeasure[];
  }> {
    const meta = await cubejs.meta();
    
    const dimensions: ChartDimension[] = [];
    const measures: ChartMeasure[] = [];
    
    for (const cube of meta.cubes) {
      // Extract dimensions
      for (const dim of cube.dimensions) {
        dimensions.push({
          key: dim.name,
          displayName: dim.title || dim.name,
          type: dim.type as any,
          cube: cube.name,
          sqlPath: dim.name,
          granularities: dim.granularities
        });
      }
      
      // Extract measures  
      for (const measure of cube.measures) {
        measures.push({
          key: measure.name,
          displayName: measure.title || measure.name,
          type: measure.type as any,
          cube: cube.name,
          sqlPath: measure.name,
          format: this.inferFormat(measure.name)
        });
      }
    }
    
    return { dimensions, measures };
  }
  
  // Get chart templates
  getChartTemplates(): ChartTemplate[] {
    return [
      {
        id: 'bar',
        name: 'Bar Chart',
        type: 'bar',
        requiredMappings: { x: 'dimension', y: 'measure' },
        supportedDimensions: 2,
        supportedMeasures: 3,
        defaultTransforms: [
          { type: 'orderBy', field: 'y', value: 'desc' },
          { type: 'limit', field: '', value: 20 }
        ]
      },
      {
        id: 'line',
        name: 'Line Chart', 
        type: 'line',
        requiredMappings: { x: 'dimension', y: 'measure' },
        supportedDimensions: 2,
        supportedMeasures: 5,
        defaultTransforms: [
          { type: 'orderBy', field: 'x', value: 'asc' }
        ]
      },
      {
        id: 'pie',
        name: 'Pie Chart',
        type: 'pie', 
        requiredMappings: { color: 'dimension', size: 'measure' },
        supportedDimensions: 1,
        supportedMeasures: 1,
        defaultTransforms: [
          { type: 'orderBy', field: 'size', value: 'desc' },
          { type: 'limit', field: '', value: 10 }
        ]
      }
      // ... more templates
    ];
  }
  
  // Execute chart query
  async executeChart(config: ChartConfiguration): Promise<any[]> {
    const query = this.buildCubeQuery(config);
    const resultSet = await cubejs.load(query);
    return this.transformData(resultSet, config);
  }
  
  // Build CubeJS query from chart configuration
  private buildCubeQuery(config: ChartConfiguration) {
    const query: any = {
      dimensions: config.dimensions.map(d => d.sqlPath),
      measures: config.measures.map(m => m.sqlPath),
      timeDimensions: [],
      filters: [],
      order: {}
    };
    
    // Apply transforms
    for (const transform of config.transforms) {
      switch (transform.type) {
        case 'filter':
          query.filters.push({
            member: transform.field,
            operator: transform.operator || 'equals',
            values: Array.isArray(transform.value) ? transform.value : [transform.value]
          });
          break;
          
        case 'orderBy':
          query.order[transform.field] = transform.value;
          break;
          
        case 'limit':
          query.limit = transform.value;
          break;
      }
    }
    
    return query;
  }
  
  // Transform CubeJS data for chart consumption
  private transformData(resultSet: any, config: ChartConfiguration): any[] {
    const template = this.getChartTemplates().find(t => t.id === config.templateId);
    if (!template) throw new Error('Invalid template');
    
    const rawData = resultSet.tablePivot();
    
    // Transform based on chart type
    switch (template.type) {
      case 'bar':
      case 'line':
        return rawData.map(row => ({
          x: row[config.mappings.x!],
          y: parseFloat(row[config.mappings.y!]) || 0,
          color: config.mappings.color ? row[config.mappings.color] : undefined,
          series: config.mappings.series ? row[config.mappings.series] : undefined
        }));
        
      case 'pie':
        return rawData.map(row => ({
          name: row[config.mappings.color!],
          value: parseFloat(row[config.mappings.size!]) || 0
        }));
        
      default:
        return rawData;
    }
  }
  
  private inferFormat(measureName: string): string {
    if (measureName.includes('score')) return 'number';
    if (measureName.includes('count') || measureName.includes('total')) return 'number';
    return 'number';
  }
}

export const chartService = new ChartService();
```

#### 1.4 New tRPC Endpoints

```typescript
// radar/src/routers/charts.ts
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../lib/trpc';
import { chartService } from '../charts/service';

const ChartConfigurationSchema = z.object({
  templateId: z.string(),
  dimensions: z.array(z.object({
    key: z.string(),
    displayName: z.string(),
    type: z.enum(['string', 'time', 'number']),
    cube: z.string(),
    sqlPath: z.string()
  })),
  measures: z.array(z.object({
    key: z.string(), 
    displayName: z.string(),
    type: z.enum(['sum', 'avg', 'count', 'min', 'max']),
    cube: z.string(),
    sqlPath: z.string()
  })),
  transforms: z.array(z.object({
    type: z.enum(['groupBy', 'orderBy', 'filter', 'limit']),
    field: z.string(),
    value: z.any().optional(),
    operator: z.enum(['equals', 'contains', 'gt', 'lt', 'between']).optional()
  })),
  mappings: z.object({
    x: z.string().optional(),
    y: z.string().optional(), 
    color: z.string().optional(),
    size: z.string().optional(),
    series: z.string().optional()
  })
});

export const chartsRouter = createTRPCRouter({
  
  // Get available dimensions and measures
  getFields: publicProcedure
    .query(async () => {
      return await chartService.getAvailableFields();
    }),
  
  // Get chart templates
  getTemplates: publicProcedure
    .query(() => {
      return chartService.getChartTemplates();
    }),
  
  // Execute chart configuration
  executeChart: publicProcedure
    .input(ChartConfigurationSchema)
    .query(async ({ input }) => {
      return await chartService.executeChart(input);
    }),
  
  // Generate suggested configurations for a dataset
  getSuggestions: publicProcedure
    .input(z.object({
      dimensions: z.array(z.string()),
      measures: z.array(z.string())
    }))
    .query(async ({ input }) => {
      // AI-powered chart suggestions based on data characteristics
      return chartService.generateSuggestions(input);
    }),
  
  // Save/load chart presets
  savePreset: publicProcedure
    .input(z.object({
      name: z.string(),
      configuration: ChartConfigurationSchema
    }))
    .mutation(async ({ input }) => {
      // Save to database or file system
      return { success: true, id: 'preset-id' };
    })
});
```

### Fase 2: Frontend Integration con Blocks v2

#### 2.1 Enhanced Chart Block Properties

```typescript
// src/blocks/v2/definitions/charts/unified-chart-block.ts
import { createPropertyDescriptor } from '../../types/property-descriptor';
import { createParameterDescriptor } from '../../types/parameter-descriptor';

export const unifiedChartProperties = {
  // Chart configuration
  chartConfig: createPropertyDescriptor({
    key: 'chartConfig',
    type: 'object',
    displayName: 'Chart Configuration',
    category: 'data',
    schema: z.object({
      templateId: z.string(),
      dimensions: z.array(z.any()),
      measures: z.array(z.any()),
      transforms: z.array(z.any()),
      mappings: z.object({})
    }),
    control: {
      type: 'chart-builder' // Custom control
    }
  }),
  
  // Data refresh settings
  autoRefresh: createPropertyDescriptor({
    key: 'autoRefresh',
    type: 'boolean', 
    displayName: 'Auto Refresh',
    category: 'behavior',
    schema: z.boolean(),
    control: { type: 'toggle' }
  }),
  
  refreshInterval: createPropertyDescriptor({
    key: 'refreshInterval',
    type: 'number',
    displayName: 'Refresh Interval (seconds)',
    category: 'behavior', 
    schema: z.number().min(5),
    hidden: (ctx) => !ctx.props.autoRefresh,
    control: { type: 'number', min: 5, max: 3600 }
  })
};

// Dynamic parameter descriptors based on chart config
export const dynamicChartParameters = {
  // These are generated dynamically based on chart configuration
  filters: createParameterDescriptor({
    key: 'filters',
    type: 'multiselect',
    displayName: 'Filters',
    schema: z.record(z.any()),
    control: {
      // Populated dynamically from available dimensions
    }
  })
};
```

#### 2.2 Chart Builder Control

```typescript
// src/blocks/v2/instruments/property-panel/ChartBuilderControl.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';

interface ChartBuilderControlProps {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export const ChartBuilderControl: React.FC<ChartBuilderControlProps> = ({
  value,
  onChange,
  disabled
}) => {
  const [config, setConfig] = useState(value || {
    templateId: '',
    dimensions: [],
    measures: [],
    transforms: [],
    mappings: {}
  });
  
  // Load available fields and templates
  const { data: fields } = trpc.charts.getFields.useQuery();
  const { data: templates } = trpc.charts.getTemplates.useQuery();
  const selectedTemplate = templates?.find(t => t.id === config.templateId);
  
  // Update parent when config changes
  useEffect(() => {
    onChange(config);
  }, [config, onChange]);
  
  const addDimension = (dimension: any) => {
    setConfig(prev => ({
      ...prev,
      dimensions: [...prev.dimensions, dimension]
    }));
  };
  
  const addMeasure = (measure: any) => {
    setConfig(prev => ({
      ...prev,
      measures: [...prev.measures, measure]
    }));
  };
  
  const updateMapping = (role: string, fieldKey: string) => {
    setConfig(prev => ({
      ...prev,
      mappings: { ...prev.mappings, [role]: fieldKey }
    }));
  };
  
  return (
    <div className="space-y-4">
      
      {/* Chart Type Selection */}
      <div>
        <label className="text-sm font-medium">Chart Type</label>
        <Select 
          value={config.templateId} 
          onValueChange={(templateId) => setConfig(prev => ({ ...prev, templateId }))}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select chart type..." />
          </SelectTrigger>
          <SelectContent>
            {templates?.map(template => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {selectedTemplate && (
        <Tabs defaultValue="dimensions">
          <TabsList>
            <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
            <TabsTrigger value="measures">Measures</TabsTrigger>
            <TabsTrigger value="mappings">Mappings</TabsTrigger>
            <TabsTrigger value="transforms">Transforms</TabsTrigger>
          </TabsList>
          
          {/* Dimensions Tab */}
          <TabsContent value="dimensions" className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {config.dimensions.map((dim: any, i: number) => (
                <Badge key={i} variant="secondary">
                  {dim.displayName}
                  <button 
                    onClick={() => setConfig(prev => ({
                      ...prev,
                      dimensions: prev.dimensions.filter((_: any, idx: number) => idx !== i)
                    }))}
                    className="ml-1 text-xs"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            
            <Select onValueChange={(value) => {
              const dimension = fields?.dimensions.find(d => d.key === value);
              if (dimension) addDimension(dimension);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Add dimension..." />
              </SelectTrigger>
              <SelectContent>
                {fields?.dimensions.map(dim => (
                  <SelectItem key={dim.key} value={dim.key}>
                    {dim.displayName} ({dim.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TabsContent>
          
          {/* Measures Tab */}
          <TabsContent value="measures" className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {config.measures.map((measure: any, i: number) => (
                <Badge key={i} variant="secondary">
                  {measure.displayName}
                  <button 
                    onClick={() => setConfig(prev => ({
                      ...prev,
                      measures: prev.measures.filter((_: any, idx: number) => idx !== i)
                    }))}
                    className="ml-1 text-xs"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            
            <Select onValueChange={(value) => {
              const measure = fields?.measures.find(m => m.key === value);
              if (measure) addMeasure(measure);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Add measure..." />
              </SelectTrigger>
              <SelectContent>
                {fields?.measures.map(measure => (
                  <SelectItem key={measure.key} value={measure.key}>
                    {measure.displayName} ({measure.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TabsContent>
          
          {/* Mappings Tab */}
          <TabsContent value="mappings" className="space-y-3">
            {Object.entries(selectedTemplate.requiredMappings).map(([role, type]) => (
              <div key={role}>
                <label className="text-sm font-medium capitalize">{role} ({type})</label>
                <Select 
                  value={config.mappings[role] || ''}
                  onValueChange={(value) => updateMapping(role, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${role}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {type === 'dimension' && config.dimensions.map((dim: any) => (
                      <SelectItem key={dim.key} value={dim.key}>
                        {dim.displayName}
                      </SelectItem>
                    ))}
                    {type === 'measure' && config.measures.map((measure: any) => (
                      <SelectItem key={measure.key} value={measure.key}>
                        {measure.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </TabsContent>
          
          {/* Transforms Tab */}
          <TabsContent value="transforms">
            {/* TODO: Transform builder UI */}
            <div className="text-sm text-muted-foreground">
              Transform builder coming soon...
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
```

#### 2.3 Enhanced Chart Component

```typescript
// src/blocks/v2/definitions/charts/UnifiedChartBlock.tsx
import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { trpc } from '@/lib/trpc';

interface UnifiedChartBlockProps {
  id: string;
  chartConfig: any;
  autoRefresh?: boolean;
  refreshInterval?: number;
  title?: string;
  height?: number;
}

export const UnifiedChartBlock: React.FC<UnifiedChartBlockProps> = ({
  chartConfig,
  autoRefresh,
  refreshInterval,
  title,
  height = 400
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Execute chart query
  const { data: chartData, isLoading, error: queryError, refetch } = trpc.charts.executeChart.useQuery(
    chartConfig,
    { 
      enabled: !!chartConfig?.templateId,
      refetchInterval: autoRefresh ? (refreshInterval || 30) * 1000 : false
    }
  );
  
  useEffect(() => {
    if (chartData) {
      setData(chartData);
      setLoading(false);
      setError(null);
    }
  }, [chartData]);
  
  useEffect(() => {
    if (queryError) {
      setError(queryError.message);
      setLoading(false);
    }
  }, [queryError]);
  
  if (!chartConfig?.templateId) {
    return (
      <div className="flex items-center justify-center h-full border-2 border-dashed border-muted-foreground/25 rounded-lg">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">Configure chart type and data</p>
          <p className="text-sm text-muted-foreground">Use the property panel to get started</p>
        </div>
      </div>
    );
  }
  
  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        <div className="text-center space-y-2">
          <p>Error loading chart data</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => refetch()}
            className="text-sm underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full">
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        {renderChart(chartConfig.templateId, data, chartConfig)}
      </ResponsiveContainer>
    </div>
  );
};

function renderChart(templateId: string, data: any[], config: any) {
  const { mappings } = config;
  
  switch (templateId) {
    case 'bar':
      return (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="x" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="y" fill="#8884d8" />
        </BarChart>
      );
      
    case 'line':
      return (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="x" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="y" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      );
      
    case 'pie':
      return (
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={150}
            fill="#8884d8"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      );
      
    default:
      return <div>Unsupported chart type: {templateId}</div>;
  }
}
```

### Fase 3: Migration Plan

#### 3.1 Migración Incremental

```typescript
// src/blocks/v2/adapters/legacy-endpoint-adapter.ts
export class LegacyEndpointAdapter {
  
  // Convert old endpoint-based blocks to new chart configurations
  static convertToChartConfig(endpoint: string, params: any): any {
    const mappings: Record<string, any> = {
      'attributes.getTopAttributes': {
        templateId: 'bar',
        dimensions: [{ key: 'UnifiedChartCube.attribute', displayName: 'Attribute' }],
        measures: [{ key: 'UnifiedChartCube.totalMentions', displayName: 'Count' }],
        mappings: { x: 'UnifiedChartCube.attribute', y: 'UnifiedChartCube.totalMentions' },
        transforms: [
          { type: 'filter', field: 'UnifiedChartCube.brand', value: params.brand },
          { type: 'limit', field: '', value: params.limit || 10 }
        ]
      },
      
      'kpis.getBrandMetrics': {
        templateId: 'bar',
        dimensions: [{ key: 'UnifiedChartCube.brand', displayName: 'Brand' }],
        measures: [
          { key: 'UnifiedChartCube.mentionScore', displayName: 'Mention Score' },
          { key: 'UnifiedChartCube.sentimentScore', displayName: 'Sentiment Score' }
        ],
        mappings: { x: 'UnifiedChartCube.brand', y: 'UnifiedChartCube.mentionScore' },
        transforms: [
          { type: 'filter', field: 'UnifiedChartCube.brand', value: params.brands, operator: 'contains' }
        ]
      }
      // ... more mappings
    };
    
    return mappings[endpoint] || null;
  }
  
  // Gradual migration helper
  static shouldUseNewSystem(blockProps: any): boolean {
    // Use new system if chartConfig exists, fall back to legacy if only endpoint
    return !!blockProps.chartConfig;
  }
}
```

#### 3.2 Backward Compatibility

```typescript
// src/blocks/v2/definitions/charts/bar-chart-block.tsx (Updated)
export const BarChartBlock: React.FC<any> = (props) => {
  const [chartConfig, setChartConfig] = useState(null);
  
  useEffect(() => {
    // Check if we have new chart config or need to convert legacy endpoint
    if (props.chartConfig) {
      setChartConfig(props.chartConfig);
    } else if (props.endpoint) {
      // Convert legacy endpoint to chart config
      const converted = LegacyEndpointAdapter.convertToChartConfig(props.endpoint, props.params);
      if (converted) {
        setChartConfig(converted);
        // Optionally auto-migrate the block
        props.onUpdate?.({ chartConfig: converted });
      }
    }
  }, [props.chartConfig, props.endpoint, props.params]);
  
  if (chartConfig) {
    return <UnifiedChartBlock {...props} chartConfig={chartConfig} />;
  }
  
  // Fallback to legacy system if no conversion available
  return <LegacyBarChartBlock {...props} />;
};
```

## Benefits del Nuevo Sistema

### 1. **Flexibilidad de Datos**
- Cualquier combinación de dimensiones y métricas desde CubeJS
- Transformaciones dinámicas (filtros, agrupaciones, ordenamiento)
- Soporte para múltiples fuentes de datos unificadas

### 2. **Performance Optimizado**
- CubeJS maneja caching y optimización de queries
- Pre-agregaciones automáticas
- Queries incrementales para datos en tiempo real

### 3. **Extensibilidad**
- Nuevos tipos de chart fáciles de añadir
- Sistema de templates reutilizable
- Transformaciones custom definibles

### 4. **Developer Experience**
- Auto-discovery de campos disponibles
- Validación en tiempo real
- Sugerencias inteligentes de configuración

### 5. **User Experience**
- UI visual para construcción de charts
- Preview en tiempo real
- Configuraciones guardables como presets

## Timeline de Implementación

### Semana 1-2: Backend Foundation
- [ ] Implementar nuevos CubeJS cubes
- [ ] Crear Chart Service y tRPC endpoints
- [ ] Configurar transformaciones básicas

### Semana 3-4: Frontend Integration  
- [ ] Implementar Chart Builder Control
- [ ] Crear UnifiedChartBlock component
- [ ] Integrar con Property Panel existente

### Semana 5-6: Migration & Polish
- [ ] Implementar Legacy Adapter
- [ ] Migrar blocks existentes gradualmente
- [ ] Testing y performance optimization

### Semana 7: Testing & Documentation
- [ ] Testing integral del sistema
- [ ] Documentación para desarrolladores
- [ ] Training para usuarios finales

Este sistema aprovecha completamente CubeJS como data layer mientras mantiene la flexibilidad y usabilidad del sistema de blocks v2, creando una solución unificada y potente para visualización de datos.