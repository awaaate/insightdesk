# Plan Detallado de Rediseño del Configuration Sidebar

## 🎯 Análisis del Contexto Actual

### Contexto de Uso: UnifiedChartPlayground

- **Ubicación**: `/apps/web/src/components/playground/UnifiedChartPlayground.tsx`
- **Función**: Playground para crear y configurar visualizaciones de datos de GEORADAR
- **Layout actual**: Header + Main content + Sidebar condicional (396px ancho)
- **Estado**: Sidebar se muestra/oculta con botón Settings2 en header
- **Integración**: Usa `DynamicConfigurationSidebar` dentro de `BlockProvider`

### Flujo de Datos Actual

```
DataSource → Block Creation → Configuration Sidebar
    ↓              ↓                   ↓
getDefaultQuery  BlockConfig    DynamicConfigurationSidebar
    ↓              ↓                   ↓
CubeJS Query   Block Props     Property Controls
```

## 📊 Componentes Actuales Analizados

### 1. DynamicConfigurationSidebar

**Archivo**: `dynamic-configuration-sidebar.tsx`
**Función actual**: Container principal con tabs General/Avanzado
**Estructura**:

```tsx
<div className="flex h-full flex-col bg-background border-l">
  <Header />
  <Tabs defaultValue="general">
    <TabsList />
    <TabsContent value="general">
      <ChartTypeModal />
      <DynamicPropertyPanel />
    </TabsContent>
  </Tabs>
</div>
```

**Cambios específicos**:

1. **Reemplazar Tabs** por `NavigationMenu` de shadcn/ui
2. **Agregar Command Palette** para búsqueda rápida
3. **Implementar Resizable** para width dinámico
4. **Añadir Sheet** para modo móvil
5. **Integrar Breadcrumb** para navegación contextual

### 2. ChartTypeModal

**Archivo**: `modals/chart-type-modal.tsx`
**Función actual**: Dialog modal para selección de tipo de chart
**Problemas**: Modal interrumpe flujo, no hay preview

**Cambios específicos**:

1. **Reemplazar Dialog** por `Popover` inline
2. **Usar Carousel** para navegación de tipos
3. **Añadir HoverCard** para previews
4. **Implementar ToggleGroup** para selección múltiple rápida
5. **Integrar Command** para búsqueda de tipos

### 3. ImprovedDataConfiguration

**Archivo**: `improved-data-configuration.tsx`
**Función actual**: Configuración de queries con secciones colapsibles
**Problemas**: Mucho scroll, secciones desconectadas

**Cambios específicos**:

1. **Reemplazar CollapsibleSection** por `Accordion`
2. **Usar Stepper** (custom) para workflow guiado
3. **Implementar Data Table** para field selection
4. **Añadir Progress** indicator
5. **Integrar Alert** para validaciones en tiempo real

### 4. DimensionsSelector

**Archivo**: `components/dimensions-selector.tsx`
**Función actual**: Selector de dimensiones con pills
**Problemas**: UX básica, no hay drag&drop, limitado

**Cambios específicos**:

1. **Reemplazar Select** por `Combobox` con search
2. **Implementar drag handles** para reordering
3. **Usar Badge** con mejores variants
4. **Añadir ContextMenu** para acciones rápidas
5. **Integrar Tooltip** para descriptions

### 5. MeasuresSelector

**Archivo**: `components/measures-selector.tsx`
**Función actual**: Similar a DimensionsSelector
**Cambios específicos**: (Mismos que DimensionsSelector)

### 6. CollapsibleSection

**Archivo**: `components/collapsible-section.tsx`
**Función actual**: Wrapper con expand/collapse
**Cambios específicos**:

1. **Migrar a Accordion** nativo de shadcn/ui
2. **Añadir icons** contextuales por sección
3. **Implementar Badge** para item counts
4. **Usar Button** variants para headers

### 7. Property Controls (Dynamic System)

**Archivos**: `dynamic/property-control/control-renderers/*`
**Función actual**: Renderizado dinámico de controles
**Cambios específicos por tipo**:

#### TextControl → Input + Label

- **Mantener** Input base
- **Añadir** Input validation states
- **Integrar** Tooltip para help text

#### SelectControl → Select + Combobox híbrido

- **Usar Combobox** para opciones grandes
- **Mantener Select** para opciones pequeñas
- **Añadir** Badge para selected items

#### SliderControl → Slider + Input combo

- **Usar Slider** de shadcn/ui
- **Añadir** Input numérico sincronizado
- **Implementar** double-ended sliders

#### ToggleControl → Switch + Toggle

- **Usar Switch** para boolean
- **Usar Toggle** para states
- **Añadir** descriptions inline

#### ColorControl → Popover + ColorPicker

- **Implementar** Popover container
- **Usar** custom ColorPicker
- **Añadir** preset colors

## 🏗️ Nueva Arquitectura Propuesta

### Layout Principal Modificado

```tsx
// UnifiedChartPlayground.tsx - CAMBIOS
<div className="flex h-screen bg-background">
  <div className="flex-1 flex flex-col">
    <Header /> {/* SIN CAMBIOS */}
    <MainContent /> {/* SIN CAMBIOS */}
  </div>

  {/* NUEVO SIDEBAR ARCHITECTURE */}
  <Resizable defaultSize={400} minSize={320} maxSize={600}>
    <ConfigurationShell>
      <CommandPalette />
      <NavigationPanel />
      <ContentArea />
      <ActionFooter />
    </ConfigurationShell>
  </Resizable>
</div>
```

### Nuevo ConfigurationShell

```tsx
// Reemplaza: DynamicConfigurationSidebar
<div className="flex h-full flex-col bg-background border-l">
  {/* Command Bar */}
  <div className="p-2 border-b">
    <Command>
      <CommandInput placeholder="Buscar configuración..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          <CommandItem>Change Chart Type</CommandItem>
          <CommandItem>Add Dimension</CommandItem>
          <CommandItem>Apply Preset</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  </div>

  {/* Navigation */}
  <NavigationMenu className="p-2">
    <NavigationMenuList className="flex-col space-y-1">
      <NavigationMenuItem>
        <NavigationMenuTrigger>📊 Visualization</NavigationMenuTrigger>
        <NavigationMenuContent>
          <ChartTypeSelector />
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuTrigger>📊 Data</NavigationMenuTrigger>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuTrigger>🎨 Style</NavigationMenuTrigger>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>

  {/* Content Area */}
  <ScrollArea className="flex-1">
    <div className="p-4">
      <ConfigurationContent />
    </div>
  </ScrollArea>

  {/* Action Footer */}
  <div className="p-4 border-t bg-muted/30">
    <div className="flex gap-2">
      <Button variant="outline" size="sm">
        Reset
      </Button>
      <Button size="sm">Apply</Button>
    </div>
  </div>
</div>
```

### Nuevo ChartTypeSelector (reemplaza ChartTypeModal)

```tsx
// Dentro de NavigationMenuContent
<div className="w-80 p-4">
  <div className="space-y-4">
    <div className="grid grid-cols-4 gap-2">
      <ToggleGroup type="single" value={currentType}>
        <ToggleGroupItem value="charts.bar">
          <BarChart3 className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="charts.line">
          <LineChart className="h-4 w-4" />
        </ToggleGroupItem>
        {/* ... más tipos */}
      </ToggleGroup>
    </div>

    <Separator />

    <Carousel className="w-full">
      <CarouselContent>
        {chartCategories.map((category) => (
          <CarouselItem key={category.name}>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {category.types.map((type) => (
                    <HoverCard key={type.id}>
                      <HoverCardTrigger asChild>
                        <Button
                          variant={
                            currentType === type.id ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => onTypeChange(type.id)}
                        >
                          {type.icon}
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent>
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">{type.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {type.description}
                          </p>
                          {/* Mini preview */}
                          <div className="w-full h-16 bg-muted rounded flex items-center justify-center">
                            {type.icon}
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  ))}
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  </div>
</div>
```

### Nueva DataConfiguration (reemplaza ImprovedDataConfiguration)

```tsx
// Stepper-based workflow
<div className="space-y-6">
  {/* Progress indicator */}
  <div className="space-y-2">
    <div className="flex justify-between text-sm">
      <span>Configuration Progress</span>
      <span>3/5</span>
    </div>
    <Progress value={60} className="h-2" />
  </div>

  {/* Step-based accordion */}
  <Accordion type="single" value={currentStep} onValueChange={setCurrentStep}>
    <AccordionItem value="step1">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
            1
          </div>
          <div className="text-left">
            <div className="font-medium">Quick Start</div>
            <div className="text-xs text-muted-foreground">
              Choose a template
            </div>
          </div>
          <Badge variant="secondary">Optional</Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <QuickStartTemplates />
      </AccordionContent>
    </AccordionItem>

    <AccordionItem value="step2">
      <AccordionTrigger>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
            2
          </div>
          <div className="text-left">
            <div className="font-medium">Dimensions</div>
            <div className="text-xs text-muted-foreground">
              {selectedDimensions.length} selected
            </div>
          </div>
          {selectedDimensions.length === 0 && (
            <Badge variant="destructive">Required</Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <EnhancedDimensionsSelector />
      </AccordionContent>
    </AccordionItem>

    <AccordionItem value="step3">
      <AccordionTrigger>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
            3
          </div>
          <div className="text-left">
            <div className="font-medium">Measures</div>
            <div className="text-xs text-muted-foreground">
              {selectedMeasures.length} selected
            </div>
          </div>
          {selectedMeasures.length === 0 && (
            <Badge variant="destructive">Required</Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <EnhancedMeasuresSelector />
      </AccordionContent>
    </AccordionItem>

    <AccordionItem value="step4">
      <AccordionTrigger>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center">
            4
          </div>
          <div className="text-left">
            <div className="font-medium">Filters</div>
            <div className="text-xs text-muted-foreground">
              Advanced filtering
            </div>
          </div>
          <Badge variant="secondary">Pro</Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <AdvancedFilters />
      </AccordionContent>
    </AccordionItem>

    <AccordionItem value="step5">
      <AccordionTrigger>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center">
            5
          </div>
          <div className="text-left">
            <div className="font-medium">Summary</div>
            <div className="text-xs text-muted-foreground">Review & apply</div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <ConfigurationSummary />
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</div>
```

### Nuevo EnhancedDimensionsSelector (reemplaza DimensionsSelector)

```tsx
<div className="space-y-4">
  {/* Search and filter */}
  <div className="flex gap-2">
    <Combobox
      value={selectedField}
      onValueChange={setSelectedField}
      placeholder="Search dimensions..."
      className="flex-1"
    >
      <ComboboxTrigger>
        <ComboboxValue placeholder="Type to search..." />
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxInput placeholder="Search dimensions..." />
        <ComboboxEmpty>No dimensions found.</ComboboxEmpty>
        {availableFields?.grouped?.dimensions
          ? Object.entries(availableFields.grouped.dimensions).map(
              ([category, dims]) => (
                <ComboboxGroup key={category} heading={category}>
                  {dims.map((dim) => (
                    <ComboboxItem key={dim.name} value={dim.name}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="font-medium">{dim.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {dim.description}
                          </div>
                        </div>
                        <Badge variant="outline">{dim.type}</Badge>
                      </div>
                    </ComboboxItem>
                  ))}
                </ComboboxGroup>
              )
            )
          : availableDimensions.map((dim) => (
              <ComboboxItem key={dim.name} value={dim.name}>
                <div className="flex items-center justify-between w-full">
                  <div>
                    <div className="font-medium">{dim.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {dim.description}
                    </div>
                  </div>
                  <Badge variant="outline">{dim.type}</Badge>
                </div>
              </ComboboxItem>
            ))}
      </ComboboxContent>
    </Combobox>

    <Button onClick={handleAdd} disabled={!selectedField} size="sm">
      <Plus className="h-4 w-4" />
    </Button>
  </div>

  {/* Selected dimensions with drag & drop */}
  <div className="space-y-2">
    <Label className="text-sm font-medium">Selected Dimensions</Label>
    <div className="min-h-[60px] p-3 border-2 border-dashed rounded-lg">
      {selectedDimensions.length === 0 ? (
        <div className="flex items-center justify-center h-12 text-sm text-muted-foreground">
          Drop dimensions here or use the search above
        </div>
      ) : (
        <div className="space-y-2">
          {selectedDimensions.map((dimName, index) => {
            const dimInfo = availableFields?.dimensions.find(
              (d) => d.name === dimName
            );
            return (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-muted rounded-md"
                draggable
              >
                <div className="flex items-center gap-2">
                  <div className="cursor-grab">
                    <svg
                      className="w-4 h-4 text-muted-foreground"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M9,3H11V5H9V3M13,3H15V5H13V3M9,7H11V9H9V7M13,7H15V9H13V7M9,11H11V13H9V11M13,11H15V13H13V11M9,15H11V17H9V15M13,15H15V17H13V15M9,19H11V21H9V19M13,19H15V21H13V19Z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-sm">
                      {dimInfo?.title || dimName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {dimInfo?.type}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z"
                          />
                        </svg>
                      </Button>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem>Move Up</ContextMenuItem>
                      <ContextMenuItem>Move Down</ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem>Duplicate</ContextMenuItem>
                      <ContextMenuItem className="text-destructive">
                        Remove
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>

  {/* Quick suggestions */}
  {suggestedDimensions.length > 0 && (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Suggested</Label>
      <div className="flex flex-wrap gap-2">
        {suggestedDimensions.map((dim) => (
          <Button
            key={dim.name}
            variant="outline"
            size="sm"
            onClick={() => onAdd(dim.name)}
            className="h-auto p-2"
          >
            <div className="flex items-center gap-2">
              <div className="text-xs">{dim.title}</div>
              <Badge variant="secondary" className="text-xs">
                {dim.category}
              </Badge>
            </div>
          </Button>
        ))}
      </div>
    </div>
  )}
</div>
```

## 📱 Responsive Strategy Específica

### UnifiedChartPlayground Mobile

```tsx
// Mobile breakpoint: < 768px
const [isMobile] = useMediaQuery("(max-width: 768px)");

{
  /* Configuration en mobile */
}
{
  showConfig &&
    (isMobile ? (
      <Sheet open={showConfig} onOpenChange={setShowConfig}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Configuration</SheetTitle>
          </SheetHeader>
          <ConfigurationShell />
        </SheetContent>
      </Sheet>
    ) : (
      <Resizable>
        <ConfigurationShell />
      </Resizable>
    ));
}
```

### Tablet Strategy (768px - 1024px)

```tsx
// Collapsible sidebar con iconos
<Resizable defaultSize={80} minSize={80} maxSize={400}>
  <div className="w-full">
    <Button
      variant="ghost"
      onClick={() => setExpanded(!expanded)}
      className="w-full justify-start"
    >
      <Settings className="h-4 w-4" />
      {expanded && <span className="ml-2">Configuration</span>}
    </Button>

    {expanded && <ConfigurationShell />}
  </div>
</Resizable>
```

## 🎯 Plan de Migración Específico

### Fase 1: Estructura Base (1-2 días)

1. **Crear ConfigurationShell** como reemplazo de DynamicConfigurationSidebar
2. **Integrar Resizable** en UnifiedChartPlayground
3. **Añadir Command** component base
4. **Setup responsive** breakpoints

### Fase 2: Navegación (2-3 días)

1. **Migrar ChartTypeModal** → ChartTypeSelector con NavigationMenu
2. **Implementar Carousel** para chart categories
3. **Añadir HoverCard** previews
4. **Setup ToggleGroup** para tipos comunes

### Fase 3: Data Configuration (3-4 días)

1. **Reemplazar CollapsibleSection** → Accordion con steps
2. **Migrar DimensionsSelector** → EnhancedDimensionsSelector
3. **Implementar Combobox** con search
4. **Añadir drag & drop** functionality
5. **Setup ContextMenu** actions

### Fase 4: Property System (2-3 días)

1. **Actualizar Property Controls** con nuevos components
2. **Migrar TextControl** → Input mejorado
3. **Actualizar SelectControl** → Combobox híbrido
4. **Mejorar ColorControl** → Popover system

### Fase 5: Polish & Mobile (2 días)

1. **Implementar Sheet** para mobile
2. **Setup breakpoints** para tablet
3. **Testing** cross-device
4. **Performance** optimizations

## ✅ Checklist de Componentes

### Componentes a Crear/Modificar

- [ ] ConfigurationShell (nuevo)
- [ ] ChartTypeSelector (reemplaza ChartTypeModal)
- [ ] EnhancedDimensionsSelector (reemplaza DimensionsSelector)
- [ ] EnhancedMeasuresSelector (reemplaza MeasuresSelector)
- [ ] StepperDataConfiguration (reemplaza ImprovedDataConfiguration)
- [ ] ResponsiveWrapper (para UnifiedChartPlayground)

### Componentes shadcn/ui a Usar

- [ ] NavigationMenu (navegación principal)
- [ ] Command (búsqueda global)
- [ ] Accordion (steps workflow)
- [ ] Combobox (field selection)
- [ ] Carousel (chart types)
- [ ] HoverCard (previews)
- [ ] ContextMenu (actions)
- [ ] Sheet (mobile)
- [ ] Resizable (desktop)
- [ ] Progress (steps indicator)
- [ ] ToggleGroup (quick selections)
- [ ] Badge (metadata)
- [ ] Popover (inline dialogs)

### Componentes a Deprecar

- [ ] DynamicConfigurationSidebar
- [ ] ChartTypeModal
- [ ] CollapsibleSection
- [ ] Basic DimensionsSelector
- [ ] Basic MeasuresSelector

## 🔍 Testing Strategy

### Unit Tests

- [ ] ConfigurationShell component
- [ ] ChartTypeSelector logic
- [ ] EnhancedDimensionsSelector drag&drop
- [ ] Responsive breakpoints

### Integration Tests

- [ ] UnifiedChartPlayground + ConfigurationShell
- [ ] Block system integration
- [ ] Query building workflow
- [ ] Mobile Sheet behavior

### E2E Tests

- [ ] Complete chart creation flow
- [ ] Mobile configuration flow
- [ ] Chart type switching
- [ ] Configuration persistence

## 📊 Success Metrics

### User Experience

- [ ] 50% reduction in clicks for common tasks
- [ ] 100% mobile usability score
- [ ] <3s average configuration time
- [ ] Zero configuration errors

### Technical

- [ ] <100ms component render time
- [ ] 95%+ TypeScript coverage
- [ ] Zero accessibility violations
- [ ] <5% bundle size increase

---

_Este plan detalla cada cambio específico por componente, manteniendo la funcionalidad existente mientras mejora significativamente la UX con componentes shadcn/ui apropiados._

# Contexto.

import { useMemo, startTransition } from "react";
import { useShallow } from "zustand/shallow";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDashboardStore, useBlock as useBlockConfig } from "../core/store";
import { blockRegistry } from "../core/registry";
import { useBlockContext } from "../contexts/block-context";
import type { BlockConfig } from "../types/block-config";
import { validateBlockProps } from "../utils/initialize-props";

export interface UseBlockOptions {
// Si usar suspense para el componente
suspense?: boolean;
// Placeholder mientras carga
placeholder?: any;
// Si suscribirse a cambios
subscribe?: boolean;
}

export interface UseBlockReturn<TData = any, TProps = any> {
// Config del bloque
id: string;
pluginId: string;
props: TProps;
layout: BlockConfig["layout"];
style: BlockConfig["style"];

// Datos
data: TData | null;
isLoading: boolean;
error: Error | null;

// Estado
isSelected: boolean;
isLocked: boolean;
isHidden: boolean;

// Acciones
actions: {
update: (updates: Partial<TProps>) => void;
updateLayout: (layout: Partial<BlockConfig["layout"]>) => void;
updateStyle: (style: Partial<BlockConfig["style"]>) => void;
remove: () => void;
duplicate: () => void;
select: (multi?: boolean) => void;
deselect: () => void;
lock: () => void;
unlock: () => void;
hide: () => void;
show: () => void;

    // Transformación de datos optimista
    transform: (transformer: (data: TData) => TData) => void;

    // Refetch de datos
    refetch: () => Promise<any>;

};
}

// Hook principal para usar un bloque
export function useBlock<TData = any, TProps = any>(
blockId: string,
options?: UseBlockOptions
): UseBlockReturn<TData, TProps> {
const queryClient = useQueryClient();

// Obtener config del bloque
const config = useBlockConfig(blockId);
const isSelected = useDashboardStore(
useShallow((state) => state.selectedIds.has(blockId))
);

if (!config) {
throw new Error(`Block "${blockId}" not found`);
}

// Obtener manifest
const manifest = blockRegistry.get(config.pluginId);
const dataConfig = manifest?.dataConfig;

// Query para datos
const dataQuery = useQuery({
queryKey: dataConfig?.cacheKey?.(config.props) || [
"block-data",
blockId,
config.props,
],
queryFn: async () => {
if (!dataConfig?.fetcher) return null;

      const rawData = await dataConfig.fetcher(config.props);

      if (dataConfig.transformer) {
        return dataConfig.transformer(rawData, config.props);
      }

      return rawData;
    },
    enabled:
      dataConfig?.queryOptions?.enabled?.(config.props) ??
      !!dataConfig?.fetcher,
    staleTime: dataConfig?.queryOptions?.staleTime,
    gcTime: dataConfig?.queryOptions?.cacheTime,
    placeholderData: options?.placeholder,

});

// Acciones memoizadas
const actions = useMemo(
() => ({
update: (updates: Partial<TProps>) => {
startTransition(() => {
console.log(
"update",
updates,
"prev",
useDashboardStore.getState().blocks.get(blockId)
);
useDashboardStore.getState().updateBlockProps(blockId, updates);
});
},

      updateLayout: (layout: Partial<BlockConfig["layout"]>) => {
        startTransition(() => {
          useDashboardStore.getState().updateBlock(blockId, {
            layout: { ...config.layout, ...layout },
          });
        });
      },

      updateStyle: (style: Partial<BlockConfig["style"]>) => {
        startTransition(() => {
          useDashboardStore.getState().updateBlock(blockId, {
            style: { ...config.style, ...style },
          });
        });
      },

      remove: () => {
        useDashboardStore.getState().removeBlock(blockId);
      },

      duplicate: () => {
        useDashboardStore.getState().duplicateBlock(blockId);
      },

      select: (multi = false) => {
        useDashboardStore.getState().selectBlock(blockId, multi);
      },

      deselect: () => {
        useDashboardStore.getState().deselectBlock(blockId);
      },

      lock: () => {
        useDashboardStore.getState().updateBlock(blockId, { locked: true });
      },

      unlock: () => {
        useDashboardStore.getState().updateBlock(blockId, { locked: false });
      },

      hide: () => {
        useDashboardStore.getState().updateBlock(blockId, { hidden: true });
      },

      show: () => {
        useDashboardStore.getState().updateBlock(blockId, { hidden: false });
      },

      transform: (transformer: (data: TData) => TData) => {
        const queryKey = dataConfig?.cacheKey?.(config.props) || [
          "block-data",
          blockId,
          config.props,
        ];

        queryClient.setQueryData(queryKey, (old: TData) =>
          old ? transformer(old) : old
        );
      },

      refetch: () => dataQuery.refetch(),
    }),
    [blockId, config, dataConfig, queryClient, dataQuery.refetch]

);

// Validate props to ensure defaults are applied
const validatedProps = validateBlockProps(config.pluginId, config.props);

return {
id: blockId,
pluginId: config.pluginId,
props: validatedProps as TProps,
layout: config.layout,
style: config.style,

    data: dataQuery.data as TData | null,
    isLoading: dataQuery.isLoading,
    error: dataQuery.error as Error | null,

    isSelected,
    isLocked: config.locked || false,
    isHidden: config.hidden || false,

    actions,

};
}

// Hook para múltiples bloques
export function useBlocks(blockIds: string[]) {
const blocksMap = useDashboardStore((state) => state.blocks);

return useMemo(
() =>
blockIds.map((id) => blocksMap.get(id)).filter(Boolean) as BlockConfig[],
[blocksMap, blockIds.join(",")]
);
}

// Hook for all blocks
export function useAllBlocks() {
const blocksMap = useDashboardStore((state) => state.blocks);

return useMemo(() => Array.from(blocksMap.values()), [blocksMap]);
}

// Hook for global dashboard actions
export function useDashboardActions() {
const addBlock = useDashboardStore((state) => state.addBlock);
const addBlocks = useDashboardStore((state) => state.addBlocks);
const removeBlocks = useDashboardStore((state) => state.removeBlocks);
const clearAll = useDashboardStore((state) => state.clearAll);
const setMode = useDashboardStore((state) => state.setMode);
const setViewport = useDashboardStore((state) => state.setViewport);
const setZoom = useDashboardStore((state) => state.setZoom);
const setPan = useDashboardStore((state) => state.setPan);

return useMemo(
() => ({
addBlock,
addBlocks,
removeBlocks,
clearAll,
setMode,
setViewport,
setZoom,
setPan,
}),
[
addBlock,
addBlocks,
removeBlocks,
clearAll,
setMode,
setViewport,
setZoom,
setPan,
]
);
}

// Hook que usa el contexto - no requiere blockId
export function useCurrentBlock<TData = any, TProps = any>(
options?: UseBlockOptions
): UseBlockReturn<TData, TProps> {
const { blockId } = useBlockContext();
return useBlock<TData, TProps>(blockId, options);
}
--

import { z } from "zod";

// Parameter types
export type ParameterType =
| "string"
| "number"
| "boolean"
| "select"
| "multiselect"
| "date"
| "daterange"
| "brand"
| "brands"
| "persona";

// Descriptor for endpoint parameters
export interface ParameterDescriptor<T = any> {
key: string;
type: ParameterType;
displayName: string;
description?: string;

// Validation schema
schema: z.ZodType<T>;

// Default value
defaultValue?: T;

// Control configuration
control: {
// For select/multiselect
options?: Array<{ label: string; value: T }>;
// For number
min?: number;
max?: number;
step?: number;
// For string
placeholder?: string;
// Dynamic options loading
loadOptions?: () => Promise<Array<{ label: string; value: T }>>;
};

// Validation with context
validate?: (value: T, allParams: Record<string, any>) => boolean | string;

// Dependencies on other parameters
dependencies?: string[];

// Conditional visibility
visible?: (allParams: Record<string, any>) => boolean;

// Required field
required?: boolean;
}

// Map of parameter descriptors
export type ParameterDescriptorMap = Record<string, ParameterDescriptor>;

// Helper to create parameter descriptor
export function createParameterDescriptor<T = any>(
descriptor: Omit<ParameterDescriptor<T>, "schema"> & {
schema: z.ZodType<T | undefined>;
}
): ParameterDescriptor<T> {
return descriptor as ParameterDescriptor<T>;
}

// Common parameter descriptors for the analytics system
export const commonParameters = {
brand: createParameterDescriptor<string>({
key: "brand",
type: "brand",
displayName: "Brand",
description: "Select a brand to analyze",
schema: z.string(),
required: true,
control: {
placeholder: "Select brand...",
options: [
{ label: "Quilosa", value: "quilosa" },
{ label: "Ceys", value: "ceys" },
{ label: "Pattex", value: "pattex" },
{ label: "Sika", value: "sika" },
{ label: "Bostik", value: "bostik" }
]
}
}),

brands: createParameterDescriptor<string[]>({
key: "brands",
type: "brands",
displayName: "Brands",
description: "Select multiple brands to compare",
schema: z.array(z.string()).min(1),
required: true,
defaultValue: ["quilosa", "ceys"],
control: {
placeholder: "Select brands...",
options: [
{ label: "Quilosa", value: "quilosa" },
{ label: "Ceys", value: "ceys" },
{ label: "Pattex", value: "pattex" },
{ label: "Sika", value: "sika" },
{ label: "Bostik", value: "bostik" }
] as any
}
}),

limit: createParameterDescriptor<number>({
key: "limit",
type: "number",
displayName: "Limit",
description: "Number of results to return",
schema: z.number().min(1).max(100),
defaultValue: 10,
control: {
min: 1,
max: 100,
step: 1
}
}),

topN: createParameterDescriptor<number>({
key: "topN",
type: "number",
displayName: "Top N",
description: "Number of top items to show",
schema: z.number().min(1).max(20),
defaultValue: 5,
control: {
min: 1,
max: 20,
step: 1
}
}),

persona: createParameterDescriptor<string>({
key: "persona",
type: "persona",
displayName: "Persona",
description: "Select a persona for analysis",
schema: z.string(),
required: true,
control: {
placeholder: "Select persona...",
loadOptions: async () => {
// This could load from an API
return [
{ label: "Maria - Madre trabajadora", value: "Maria - Madre trabajadora" },
{ label: "Juan - Profesional joven", value: "Juan - Profesional joven" },
{ label: "Pedro - Jubilado activo", value: "Pedro - Jubilado activo" }
];
}
}
}),

dateRange: createParameterDescriptor<{ from: Date; to: Date }>({
key: "dateRange",
type: "daterange",
displayName: "Date Range",
description: "Select date range for analysis",
schema: z.object({
from: z.date(),
to: z.date()
}),
defaultValue: {
from: new Date(Date.now() - 30 _ 24 _ 60 _ 60 _ 1000), // 30 days ago
to: new Date()
},
control: {}
})
};

// Endpoint parameter configurations
export const endpointParameters: Record<string, ParameterDescriptorMap> = {
"attributes.getTopAttributes": {
brand: commonParameters.brand,
limit: commonParameters.limit
},

"attributes.compareAttributes": {
brands: commonParameters.brands,
topN: commonParameters.topN
},

"kpis.getBrandMetrics": {
brands: commonParameters.brands
},

"personas.getPersonaAttributes": {
persona: commonParameters.persona
},

"sources.getBrandSources": {
brand: commonParameters.brand
},

"competitive.getCompetitiveAnalysis": {
brands: commonParameters.brands
}
};

---

import { z } from "zod";

// Tipos de propiedades soportadas
export type PropertyType =
| "string"
| "number"
| "boolean"
| "color"
| "select"
| "array"
| "object"
| "spacing"
| "endpoint"
| "field";

// Tipos de controles UI
export type ControlType =
| "text"
| "textarea"
| "number"
| "slider"
| "toggle"
| "select"
| "multiselect"
| "color"
| "spacing"
| "code"
| "endpoint-selector"
| "field-selector"
| "chart-query-builder";

// Categorías de propiedades
export type PropertyCategory = "data" | "style" | "layout" | "behavior";

// Descriptor de propiedad con metadatos ricos
export interface PropertyDescriptor<T = any> {
key: string;
type: PropertyType;
displayName: string;
description?: string;
category: PropertyCategory;

// Schema de validación con Zod
schema: z.ZodType<T>;

// Valor por defecto
defaultValue?: T;

// Control UI
control: {
type: ControlType;
// Opciones específicas del control
options?: any;
// Para sliders
min?: number;
max?: number;
step?: number;
// Para selects
choices?: Array<{ label: string; value: T }>;
// Presets predefinidos
presets?: Array<{ label: string; value: T; icon?: string }>;
// Placeholder
placeholder?: string;
// Si las opciones son dinámicas
dynamic?: boolean;
// Para field-selector
fieldType?: 'dimension' | 'measure';
multiple?: boolean;
};

// Validación adicional con contexto
validate?: (value: T, context: PropertyContext) => boolean | string;

// Dependencias con otras propiedades
dependencies?: string[];

// Si está deshabilitada basado en condiciones
disabled?: (context: PropertyContext) => boolean;

// Si está oculta basado en condiciones
hidden?: (context: PropertyContext) => boolean;

// Capacidades avanzadas
responsive?: boolean; // Puede tener valores por breakpoint
animatable?: boolean; // Se puede animar
inheritable?: boolean; // Hereda del padre
}

// Contexto para validaciones y condiciones
export interface PropertyContext {
// Todas las props actuales del bloque
props: Record<string, any>;
// Datos disponibles
data?: any;
// Información del bloque
blockType: string;
blockId: string;
// Tema actual
theme?: any;
// Viewport actual
viewport?: "mobile" | "tablet" | "desktop";
}

// Mapa de descriptores de propiedades
export type PropertyDescriptorMap = Record<string, PropertyDescriptor>;

// Valores responsive
export interface ResponsiveValue<T> {
base: T;
mobile?: T;
tablet?: T;
desktop?: T;
wide?: T;
}

// Helper para crear descriptores type-safe
export function createPropertyDescriptor<T = any>(
descriptor: Omit<PropertyDescriptor<T>, "schema"> & {
schema: z.ZodType<T | undefined>;
}
): PropertyDescriptor<T> {
return descriptor as PropertyDescriptor<T>;
}

// Descriptores comunes predefinidos
export const commonDescriptors = {
title: createPropertyDescriptor<string>({
key: "title",
type: "string",
displayName: "Title",
description: "Display title for the block",
category: "data",
schema: z.string().optional(),
control: {
type: "text",
placeholder: "Enter title..."
}
}),

height: createPropertyDescriptor<number>({
key: "height",
type: "number",
displayName: "Height",
description: "Height of the block in pixels",
category: "layout",
schema: z.number().min(100).max(1000),
defaultValue: 400,
control: {
type: "slider",
min: 100,
max: 1000,
step: 10
},
responsive: true
}),

showLegend: createPropertyDescriptor<boolean>({
key: "showLegend",
type: "boolean",
displayName: "Show Legend",
category: "style",
schema: z.boolean(),
defaultValue: true,
control: {
type: "toggle"
}
}),

backgroundColor: createPropertyDescriptor<string>({
key: "backgroundColor",
type: "color",
displayName: "Background Color",
category: "style",
schema: z.string(),
defaultValue: "#ffffff",
control: {
type: "color",
presets: [
{ label: "White", value: "#ffffff" },
{ label: "Light Gray", value: "#f3f4f6" },
{ label: "Dark", value: "#1f2937" }
]
},
responsive: true,
animatable: true
})
};
