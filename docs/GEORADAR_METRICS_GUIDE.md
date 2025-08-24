# Guía Completa de Métricas GEORADAR

## ¿Qué es GEORADAR?

GEORADAR es un sistema de análisis que monitoriza cómo las marcas aparecen en las respuestas de Inteligencia Artificial (ChatGPT, Perplexity, etc.). Analiza la visibilidad, el tono y la posición competitiva de las marcas en el contenido generado por IA.

## Índice de Valores Correctos - Referencia Rápida

A continuación, un **Índice de Valores Correctos** para interpretar de forma rápida y precisa cada métrica GEORADAR:

| Nº  | Métrica                      | Fórmula clave                                                                          | Rangos / Valores críticos                                                                | Interpretación principal                                         |
| --- | ---------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | **Mention Score**            | Base + (mentions × Multiplier) / Max Score                                             | 0.0–0.3: Invisibilidad crítica<br>0.6–0.8: Visibilidad sólida<br>0.8–1.0: Dominancia     | Evalúa volumen de menciones; bajo→urgencia de amplificación      |
| 2   | **Position Score**           | Σ(peso_posición) / (mentions × peso_máximo)<br>Pesos: Inicio=1.0; Medio=0.3; Final=0.7 | 0.0–0.4: Menciones relegadas<br>0.5–0.7: Posición neutral<br>0.8–1.0: Posición dominante | Mide prominence en la respuesta; alto→prioridad de marca         |
| 3   | **Sentiment Score**          | (positivas – negativas) / total × multiplicador<br>Multiplicadores: +1.2 / -0.8        | –1.0: Muy negativo<br>0.0: Neutral<br>+1.0: Muy positivo                                 | Refleja tono de las menciones; negativo→riesgo reputacional      |
| 4   | **Competitive Score**        | 0.5 + (menciones_marca – promedio_competidores) × 0.5                                  | <0.4: Desventaja severa<br>0.4–0.7: Paridad competitiva<br>>0.7: Dominancia competitiva  | Compara presencia vs rivales; bajo→pérdida de mind share         |
| 5   | **Overall Score**            | 0.30 × Mention + 0.20 × Position + 0.30 × Sentiment + 0.20 × Competitive               | <0.50: Crisis<br>0.50–0.70: Riesgo moderado<br>>0.80: Salud estratégica                  | Integración de todas las métricas; guía de prioridad táctica     |
| 6   | **Brand Impact Score (BIS)** | Overall Score × 100                                                                    | 0–20: Crisis de visibilidad<br>41–60: Visibilidad moderada<br>81–100: Dominancia total   | Traduce Overall a escala 0–100; KPI para reportes ejecutivos     |
| 7   | **Share of Branded Voice**   | (Menciones Ford / Total menciones de marca) × 100                                      | < market share real: Subperformance<br>> market share: Momentum                          | Cuota relativa en respuestas con marca; mide competitividad pura |
| 8   | **Share of Voice**           | (Menciones Ford / Total respuestas del estudio) × 100                                  | <4%: Penetración insuficiente<br>>4%: Overperformance vs 4% market                       | Penetración absoluta en IA; benchmark vs market share real       |

> **Cómo usar este Índice**
>
> 1. Localiza rápidamente la métrica en el índice (columna Nº).
> 2. Refiérete al "Rango / Valores críticos" para diagnosticar la salud de la métrica.
> 3. Aplica la "Interpretación principal" para definir acciones inmediatas.

## Explicación Simple de Cada Métrica (Para No Técnicos)

### 📊 **1. Mention Score** - ¿Cuánto se habla de tu marca?

**¿Qué mide?**

- Cuenta las veces que aparece tu marca en las respuestas de IA
- Más menciones = mayor puntuación

**¿Por qué importa?**

- Si no te mencionan, no existes para la IA
- Marcas con muchas menciones dominan la conversación

**Ejemplo práctico:**

- Quilosa aparece 0 veces = puntuación baja (20/100)
- Quilosa aparece 5 veces = puntuación media (45/100)
- Quilosa aparece 10+ veces = puntuación alta (70+/100)

### 📍 **2. Position Score** - ¿Dónde aparece tu marca?

**¿Qué mide?**

- Si tu marca aparece al principio, medio o final de la respuesta
- Inicio = más importante, Final = menos importante

**¿Por qué importa?**

- Las marcas mencionadas primero son las que la IA considera más relevantes
- Aparecer al final sugiere que eres una opción secundaria

**Ejemplo práctico:**

- "Para adhesivos, Quilosa es la mejor opción..." = puntuación máxima (100)
- "...también podrías considerar Quilosa" = puntuación baja (40)

### 😊 **3. Sentiment Score** - ¿Qué opinión transmite la IA?

**¿Qué mide?**

- Si la IA habla positiva, negativa o neutralmente de tu marca
- Se calcula como balance entre comentarios buenos y malos

**¿Por qué importa?**

- Define tu reputación en el mundo digital
- Afecta directamente las decisiones de compra

**Ejemplo práctico:**

- "Quilosa ofrece excelente calidad y durabilidad" = positivo (+80)
- "Quilosa es una opción más en el mercado" = neutral (0)
- "Quilosa tiene problemas de adherencia" = negativo (-60)

### 🏆 **4. Competitive Score** - ¿Cómo estás vs la competencia?

**¿Qué mide?**

- Compara tus menciones con las de tus competidores directos
- Muestra tu cuota de voz en el mercado

**¿Por qué importa?**

- Indica si estás ganando o perdiendo terreno
- Ayuda a identificar quién domina la conversación

**Ejemplo práctico:**

- Si Quilosa tiene 5 menciones y Ceys solo 2 = ganando (75/100)
- Si Quilosa tiene 2 menciones y Ceys tiene 5 = perdiendo (25/100)
- Si ambas tienen 3 menciones = empate técnico (50/100)

### 🎯 **5. Overall Score** - Tu calificación general

**¿Qué mide?**

- Combina todas las métricas anteriores en una sola calificación
- Es como el "promedio final" de tu rendimiento

**¿Por qué importa?**

- Ofrece una vista rápida del estado general de tu marca
- Facilita la comparación mes a mes

**Cómo se calcula (simplificado):**

- 30% qué tanto te mencionan
- 30% qué tan bien hablan de ti
- 20% dónde te mencionan
- 20% cómo estás vs competencia

### 💯 **6. Brand Impact Score (BIS)** - Tu impacto en escala 0-100

**¿Qué mide?**

- Es el Overall Score convertido a porcentaje
- Tu "nota final" en una escala familiar de 0 a 100

**¿Por qué importa?**

- Fácil de comunicar a directivos y equipos
- Permite comparaciones rápidas
- Es el KPI principal para reportes ejecutivos

**Interpretación:**

- 0-40: Necesitas acción urgente
- 41-70: Hay espacio de mejora
- 71-100: Estás dominando el mercado

### 📢 **7. Share of Branded Voice** - Tu cuota entre respuestas con marca

**¿Qué mide?**

- Entre todas las respuestas que mencionan alguna marca, ¿qué porcentaje es tuyo?
- Es tu participación en conversaciones donde hay competencia directa

**¿Por qué importa?**

- Mide tu competitividad real cuando hay comparación directa
- Indica si dominas cuando la IA habla de marcas

**Ejemplo práctico:**

- Si en 100 respuestas con marcas: Ford aparece 40 veces = 40% Share of Branded Voice
- Si tu market share real es 30% y tienes 40% = Momentum positivo
- Si tu market share real es 50% y tienes 40% = Subperformance

### 📊 **8. Share of Voice** - Tu penetración total en IA

**¿Qué mide?**

- Del total de TODAS las respuestas analizadas, ¿en qué porcentaje apareces?
- Incluye respuestas sin marcas y con marcas

**¿Por qué importa?**

- Mide tu penetración absoluta en el ecosistema IA
- Benchmark directo contra tu market share real

**Ejemplo práctico:**

- Si analizamos 1000 respuestas y Ford aparece en 50 = 5% Share of Voice
- Market share real de Ford: 4% → 5% en IA = Overperformance
- Si solo apareces en 2% = Penetración insuficiente, necesitas más presencia

## ¿Qué son las Menciones y Atributos?

> **⚠️ IMPORTANTE**: Todas las métricas de GEORADAR (Mention Score, Position Score, Sentiment Score, Competitive Score, Overall Score, BIS, Share of Voice) se calculan EXCLUSIVAMENTE a partir de las **menciones de marca**. Los atributos se utilizan para análisis complementarios pero NO influyen en el cálculo de las métricas principales.

### 🏷️ **Menciones de Marca**

Son las veces que aparece el nombre de tu marca en las respuestas de IA.

**Ejemplos de menciones:**

- "Quilosa es una marca reconocida en el sector"
- "Los productos de Quilosa son duraderos"
- "Recomiendo Quilosa para sellar baños"
- "Entre las opciones está Quilosa"

**Lo que medimos de cada mención:**

- ¿Dónde aparece? (inicio, medio o final)
- ¿Cómo se habla? (positivo, negativo, neutral)
- ¿Con qué confianza la IA la menciona?

### 🔍 **Atributos de Marca**

Son las características que la IA asocia con tu marca.

**📌 Nota**: Los atributos NO se utilizan para calcular las métricas principales. Se analizan por separado para entender la percepción cualitativa de la marca.

**Ejemplos de atributos comunes:**

- **Calidad**: "Quilosa ofrece alta calidad"
- **Precio**: "Quilosa tiene precios competitivos"
- **Innovación**: "Quilosa innova constantemente"
- **Durabilidad**: "Los selladores Quilosa duran años"
- **Facilidad de uso**: "Quilosa es fácil de aplicar"
- **Disponibilidad**: "Quilosa se encuentra en todas las tiendas"

**Por qué son importantes los atributos:**

- Muestran cómo percibe la IA tu marca
- Identifican fortalezas y debilidades
- Ayudan a mejorar el posicionamiento

### 📊 **Diferencia Principal**

| Concepto     | Menciones                       | Atributos                                |
| ------------ | ------------------------------- | ---------------------------------------- |
| **Qué mide** | Cuántas veces aparece tu marca  | Qué características asocian con tu marca |
| **Ejemplo**  | "Quilosa es líder en adhesivos" | Quilosa + "liderazgo" (positivo)         |
| **Uso**      | Medir visibilidad               | Entender percepción                      |

## Otras Métricas Disponibles en el Sistema

### 📊 **Métricas de Volumen**

- **Total Respuestas**: Cuántas respuestas de IA analizamos
- **Total Menciones**: Suma de todas las menciones de tu marca
- **Total Marcas**: Cuántas marcas diferentes aparecen
- **Total Atributos Detectados**: Cuántos atributos únicos encontramos

### 🙃 **Métricas de Sentimiento**

- **Menciones Positivas**: Cuántas veces hablan bien de ti
- **Menciones Negativas**: Cuántas veces hablan mal de ti
- **Menciones Neutrales**: Cuántas veces te mencionan sin valoración
- **Atributos Positivos/Negativos**: Qué características valoran o critican

### 🎯 **Métricas de Confianza**

- **Confianza Promedio**: Qué tan segura está la IA de sus detecciones
- **Confianza Mínima/Máxima**: Rango de certeza en las detecciones

### 📈 **Métricas de Tendencia**

- **Evolución Temporal**: Cómo cambian las métricas en el tiempo
- **Comparación por Motor IA**: Diferencias entre ChatGPT, Perplexity, etc.
- **Análisis por Persona**: Cómo varía según el perfil del usuario

## Interpretación para la Toma de Decisiones

### 🚨 **Señales de Alerta** (Requieren acción inmediata)

**Mention Score < 30:**

- 🔴 Tu marca es prácticamente invisible para la IA
- **Acción:** Aumentar presencia digital y contenido de marca

**Sentiment Score < 0:**

- 🔴 Tienes problemas de reputación
- **Acción:** Identificar críticas y plan de mejora urgente

**Competitive Score < 40:**

- 🔴 Estás perdiendo terreno frente a competidores
- **Acción:** Analizar qué hacen mejor los competidores

**Brand Impact Score < 40:**

- 🔴 Situación crítica general
- **Acción:** Revisión completa de estrategia digital

### ✅ **Señales Positivas** (Mantener y potenciar)

**Mention Score > 70:**

- 🔵 Excelente visibilidad en IA
- **Acción:** Mantener estrategia actual

**Position Score > 80:**

- 🔵 Eres top of mind en tu categoría
- **Acción:** Reforzar liderazgo

**Sentiment Score > 60:**

- 🔵 Buena reputación digital
- **Acción:** Amplificar mensajes positivos

**Competitive Score > 70:**

- 🔵 Liderando frente a competencia
- **Acción:** Consolidar ventaja competitiva

## 📨 **Acciones Recomendadas por Métrica**

### Si el Mention Score es bajo:

1. **Aumentar presencia en medios digitales**

   - Crear más contenido sobre tu marca
   - Mejorar SEO y presencia online
   - Participar en foros y comunidades del sector

2. **Optimizar para IA**
   - Asegurar que tu marca aparece en fuentes confiables
   - Mejorar Wikipedia y bases de conocimiento

### Si el Position Score es bajo:

1. **Reforzar mensajes de liderazgo**

   - Destacar por qué eres la primera opción
   - Comunicar diferenciadores únicos

2. **Mejorar autoridad de marca**
   - Generar contenido de **experto**
   - Conseguir reseñas y testimonios destacados

---

### Si el Sentiment Score es negativo:

1. **Gestión de crisis**

   - Identificar fuentes de críticas
   - Responder a problemas específicos

2. **Reforzar positivos**
   - Amplificar historias de éxito
   - Mejorar experiencia del cliente

### Si el Competitive Score es bajo:

1. **Análisis competitivo**

   - Estudiar estrategias de competidores exitosos
   - Identificar brechas en tu propuesta

2. **Diferenciación**
   - Comunicar ventajas únicas
   - Innovar en productos o servicios

## Cómo Leer los Gráficos en las Presentaciones

### 📊 **Gráficos de Barras**

- **Más alto = Mejor** (excepto en menciones negativas)
- Tu marca suele estar destacada en color diferente
- Compara fácilmente con competidores

### 📈 **Gráficos de Evolución**

- **Línea ascendente** = Estás mejorando 🚀
- **Línea descendente** = Necesitas atención 🚨
- **Línea estable** = Mantener estrategia actual

### 🎯 **Gráficos de Radar/Araña**

- **Área más grande** = Mejor desempeño general
- **Picos hacia afuera** = Tus fortalezas
- **Valles hacia adentro** = Áreas de mejora

### 🥧 **Mapas de Calor**

- **Colores cálidos (rojo/naranja)** = Alta actividad o valores altos
- **Colores fríos (azul/verde)** = Baja actividad o valores bajos

## Glosario Simplificado

- **IA/AI**: Inteligencia Artificial (ChatGPT, Perplexity, Claude, etc.)
- **Mención**: Cada vez que aparece el nombre de tu marca
- **Atributo**: Característica asociada a tu marca (calidad, precio, etc.)
- **Sentimiento**: Si hablan bien (positivo), mal (negativo) o neutral
- **Cuota de voz**: Porcentaje de conversación que domina tu marca
- **Top of mind**: Ser la primera marca que menciona la IA
- **KPI**: Indicador clave de rendimiento para medir éxito
- **Benchmark**: Punto de comparación (competidores o período anterior)
- **Motor IA**: Sistema de inteligencia artificial específico (GPT, Perplexity)
- **Persona**: Perfil de usuario simulado (profesional, consumidor, etc.)

---

**Nota importante**: Todos los valores y porcentajes se calculan automáticamente basados en el análisis de miles de respuestas de IA. Las métricas se actualizan periódicamente para reflejar los cambios en la percepción de marca.

**Recuerda**: El objetivo principal de GEORADAR es ayudarte a entender y mejorar cómo la Inteligencia Artificial presenta tu marca a millones de usuarios cada día.
