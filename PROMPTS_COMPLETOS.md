# 📝 PROMPTS COMPLETOS - Módulo SEO MarketAI

**Fecha de creación:** 23 Octubre 2025  
**Versión:** 1.0  
**Estado:** Documentación Completa

Este documento contiene **TODOS los prompts** utilizados en el proyecto MarketAI SEO Module, tanto los definidos en archivos .md como los embebidos en workflows de n8n.

---

## 📑 Tabla de Contenidos

1. [Prompt #1: Clustering de Keywords](#prompt-1-clustering-de-keywords)
2. [Prompt #2: Generación de Ideas](#prompt-2-generación-de-ideas)
3. [Prompt #3: Redacción Simple](#prompt-3-redacción-simple)
4. [Prompt #4: Redacción Investigada](#prompt-4-redacción-investigada)
5. [Prompt #5: Generación de Prompts Visuales](#prompt-5-generación-de-prompts-visuales)
6. [Prompt #6: Investigación Deep Research (o4-mini)](#prompt-6-investigación-deep-research)
7. [Lógica de QA SEO](#lógica-de-qa-seo)
8. [Resumen de Configuraciones](#resumen-de-configuraciones)

---

## Prompt #1: Clustering de Keywords

### 🎯 ¿Qué busca?
Agrupar keywords relacionadas por similitud semántica, identificando una keyword principal y keywords secundarias para cada cluster temático.

### 📍 Dónde se usa
- **Archivo de referencia:** `prompts/v1/01_keywords_clustering.md`
- **Workflow n8n:** `SEO - 07 Clustering de Keywords.json`
- **Nodo:** "Construir Prompt" (línea 92)

### 🔧 ¿Qué hace?
1. Analiza un listado de keywords
2. Elimina duplicados e irrelevantes
3. Detecta keywords con potencial de tráfico orgánico
4. Agrupa por temáticas semánticas
5. Selecciona keyword principal y 2-5 secundarias por cluster

### 📥 Entrada
```json
{
  "keywords": [
    "café orgánico",
    "café saludable",
    "mejores granos de café",
    "cultura cafetera"
  ]
}
```

### 📤 Salida
```json
{
  "Tema_1": {
    "Keyword_Principal": "café orgánico",
    "Keywords_Secundarias": ["café saludable", "café sin pesticidas"]
  },
  "Tema_2": {
    "Keyword_Principal": "cultura cafetera",
    "Keywords_Secundarias": ["recetas con café"]
  }
}
```

### ⚙️ Configuración
```javascript
{
  "model": "gpt-4o",
  "temperature": 0.7,
  "maxTokens": 2000
}
```

### 📜 Prompt Completo

```
Actúa como un especialista en SEO y estrategia de contenidos.

Recibirás un listado de keywords provenientes de Google Keyword Planner o ingreso manual.

Tu objetivo es:
1. Analizar todas las keywords y eliminar las irrelevantes, duplicadas o con muy poca intención de búsqueda.
2. Detectar las que tienen mayor potencial para crear contenido que atraiga tráfico orgánico.
3. Agruparlas por temáticas basadas en similitud semántica.
4. Dentro de cada grupo, seleccionar:
   - Keyword principal: la más representativa y con mejor potencial.
   - Keywords secundarias: complementos y variaciones (2-5 por cluster).
5. Mantener el idioma original de las keywords.

**Entrada:**
${JSON.stringify({keywords: keywords}, null, 2)}

**Formato de salida (JSON válido, sin markdown):**
{
  "Tema_1": {
    "Keyword_Principal": "palabra clave principal",
    "Keywords_Secundarias": ["keyword1", "keyword2", "keyword3"]
  },
  "Tema_2": {
    "Keyword_Principal": "palabra clave principal",
    "Keywords_Secundarias": ["keyword4", "keyword5"]
  }
}

IMPORTANTE: Responde SOLO con el JSON, sin bloques de código markdown.
```

---

## Prompt #2: Generación de Ideas

### 🎯 ¿Qué busca?
Generar exactamente 30 ideas de contenido únicas basadas en clusters de keywords, clasificándolas según requieran o no investigación actualizada.

### 📍 Dónde se usa
- **Archivo de referencia:** `prompts/v1/02_ideas_generator.md`
- **Workflow n8n:** `SEO - 08 Generación de Ideas.json`
- **Nodo:** "Construir Prompt Ideas" (línea 92)

### 🔧 ¿Qué hace?
1. Analiza el conjunto de keywords
2. Identifica temas en común y tendencias
3. Genera 30 ideas únicas (máx. 12 palabras cada una)
4. Clasifica cada idea como "Requiere investigación" o "No requiere investigación"
5. Balancea el mix (aproximadamente 15 de cada tipo)

### 📥 Entrada
```json
{
  "keywords": [
    "café orgánico",
    "beneficios del café",
    "café de altura"
  ]
}
```

### 📤 Salida
```json
{
  "Ideas": [
    {
      "Idea": "Estadísticas globales de consumo de café sostenible",
      "Categoria": "Requiere investigación"
    },
    {
      "Idea": "Cómo diferenciar café orgánico del convencional",
      "Categoria": "No requiere investigación"
    }
  ]
}
```

### ⚙️ Configuración
```javascript
{
  "model": "gpt-4o",
  "temperature": 0.8,
  "maxTokens": 2500
}
```

### 📜 Prompt Completo

```
Actúa como un estratega de contenidos y generador de ideas para blog.

Recibirás un conjunto de keywords principales y secundarias seleccionadas previamente.

Tu objetivo es:
1. Analizar el conjunto total de keywords y encontrar temas en común o tendencias.
2. Generar **30 ideas de contenido únicas** para blog, videos o guías, basadas en el conjunto total (no en cada keyword por separado).
3. Cada idea debe ser breve (máx. 12 palabras) y clara en su enfoque.
4. Clasificar cada idea en dos categorías:
   - **Requiere investigación** → temas que necesitan datos actualizados, estudios recientes o estadísticas.
   - **No requiere investigación** → temas que pueden desarrollarse con conocimiento general, sin datos recientes.
5. Entregar el resultado en formato JSON.

**Entrada:**
${JSON.stringify({keywords: keywords}, null, 2)}

**Formato de salida (JSON válido, sin markdown):**
{
  "Ideas": [
    {
      "Idea": "título de la idea (máx 12 palabras)",
      "Categoria": "Requiere investigación"
    },
    {
      "Idea": "título de la idea (máx 12 palabras)",
      "Categoria": "No requiere investigación"
    }
  ]
}

IMPORTANTE: 
- Responde SOLO con el JSON, sin bloques de código markdown.
- Genera EXACTAMENTE 30 ideas.
- Mix balanceado: aproximadamente 15 con investigación y 15 sin investigación.
```

---

## Prompt #3: Redacción Simple

### 🎯 ¿Qué busca?
Redactar artículos completos optimizados para SEO de contenido evergreen que no requiere datos actualizados.

### 📍 Dónde se usa
- **Archivo de referencia:** `prompts/v1/03_redaccion_simple.md`
- **Workflow n8n:** `SEO - 09 Redacción Simple.json`
- **Nodo:** "Construir Prompt Redacción" (línea 92)

### 🔧 ¿Qué hace?
1. Toma una idea clasificada como "No requiere investigación"
2. Redacta artículo de mínimo 600 palabras
3. Estructura con H1, H2, H3
4. Genera metadatos SEO (Meta Title, Meta Description, Tags)
5. Incluye introducción, desarrollo y conclusión
6. Integra keywords naturalmente

### 📥 Entrada
```json
{
  "idea": "Cómo diferenciar café orgánico del convencional",
  "estimated_word_count": 600
}
```

### 📤 Salida
```markdown
---
Meta Title: Diferencias entre café orgánico y convencional
Meta Description: Aprende a identificar el café orgánico y sus ventajas únicas.
Tags: café orgánico, cultivo sostenible, beneficios del café
---

# Cómo diferenciar café orgánico del convencional

El café orgánico ha ganado popularidad en los últimos años...

## Métodos de cultivo
[Contenido...]

## Certificaciones que debes buscar
[Contenido...]

**Conclusión:** El café orgánico no solo es mejor para el ambiente...
```

### ⚙️ Configuración
```javascript
{
  "model": "gpt-4o",
  "temperature": 0.7,
  "maxTokens": 3500
}
```

### 📜 Prompt Completo

```
Actúa como un redactor profesional especializado en SEO.

Recibirás una idea de contenido clasificada como "No requiere investigación".

**Idea:** ${idea}

Tu tarea es redactar un artículo optimizado para SEO:

1. Usar la idea como título principal (H1)
2. Incluir párrafo introductorio breve y atractivo
3. Desarrollar contenido de al menos ${wordCount} palabras
4. Usar subtítulos (H2, H3) para organizar la información
5. Lenguaje claro, fluido y fácil de leer
6. Integrar keywords naturalmente si son evidentes
7. Conclusión con resumen o CTA cuando sea relevante
8. Contenido 100% original, sin plagio

**Metadatos SEO:**
- Meta Title: máximo 60 caracteres, atractivo, con keyword
- Meta Description: máximo 155 caracteres, persuasiva, invite al clic
- Tags: 5 a 8 etiquetas relevantes separadas por comas

**Formato de salida (Markdown con frontmatter):**
---
Meta Title: [Texto aquí]
Meta Description: [Texto aquí]
Tags: [tag1, tag2, tag3, ...]
---

# [Título del artículo]

[Párrafo introductorio...]

## [Subtítulo H2]
[Contenido de la sección...]

## [Subtítulo H2]
[Contenido de la sección...]

**Conclusión:** [Párrafo final con resumen...]

IMPORTANTE: 
- Responde SOLO con el Markdown completo, sin bloques de código.
- Asegúrate de incluir el frontmatter con los metadatos.
- El contenido debe tener al menos ${wordCount} palabras.
```

---

## Prompt #4: Redacción Investigada

### 🎯 ¿Qué busca?
Convertir datos de investigación (JSON) en artículos completos optimizados para SEO, citando fuentes de manera profesional.

### 📍 Dónde se usa
- **Archivo de referencia:** `prompts/v1/04_redaccion_investigada.md`
- **Workflow n8n:** `SEO - 11 Redaccion Investigada.json`
- **Nodo:** "Construir Prompt Redaccion Investigada" (línea 92)

### 🔧 ¿Qué hace?
1. Interpreta JSON con datos de investigación
2. Redacta artículo extenso (mínimo 800 palabras)
3. Cita fuentes en formato (Nombre, Año)
4. Estructura con H2, H3 siguiendo outline si existe
5. Genera metadatos SEO
6. Incluye sección "Fuentes citadas" al final
7. Mantiene tono profesional pero claro

### 📥 Entrada
```json
{
  "Idea": "Impacto del cambio climático en el café de altura",
  "Resumen": "El cambio climático ha alterado las zonas de cultivo...",
  "DatosClave": [
    "La temperatura media aumentó 1.2°C (FAO, 2024)",
    "La producción podría caer 50% para 2050 (IPCC, 2023)"
  ],
  "Tendencias": [
    "Desplazamiento de cultivos hacia altitudes más altas"
  ],
  "Fuentes": [
    {"Nombre": "FAO", "Cita": "FAO, 2024", "URL": "..."}
  ]
}
```

### 📤 Salida
```markdown
---
Meta Title: Impacto del Cambio Climático en el Café de Altura 2024
Meta Description: Descubre cómo el cambio climático afecta la producción...
Tags: café de altura, cambio climático, producción de café
---

# El Impacto del Cambio Climático en el Café de Altura

El café de altura enfrenta una amenaza sin precedentes...

## El Aumento de las Temperaturas

Según la FAO (2024), la temperatura media en zonas cafetaleras...

---

**Fuentes citadas:**
- FAO (2024)
- IPCC (2023)
```

### ⚙️ Configuración
```javascript
{
  "model": "gpt-4o",
  "temperature": 0.6,
  "maxTokens": 4200
}
```

### 📜 Prompt Completo

```
Actua como un redactor senior SEO y GEO. Genera un articulo extenso (minimo ${wordGoal} palabras) basandote exclusivamente en los datos entregados.

Contexto del proyecto:
- Idea: ${context.idea || 'Sin idea'}
- Cluster: ${context.cluster || 'Sin cluster'}
- Keyword principal: ${context.keyword_principal || 'Sin keyword'}
- Palabras objetivo: ${wordGoal}
- Proyecto: ${context.project_name || 'N/A'}

Datos de investigacion (JSON):
${JSON.stringify({
  Idea: research.idea || context.idea,
  Resumen: research.resumen || '',
  DatosClave: context.datos_clave,
  Tendencias: context.tendencias,
  Insights: context.insights,
  Outline: context.outline,
  Fuentes: context.fuentes
}, null, 2)}

Instrucciones clave:
1. Usa solo la informacion del JSON, sin inventar datos.
2. Cita las fuentes en el texto con el formato (Nombre, Año).
3. Mantene tono profesional pero claro, agrega contexto y analisis.
4. Utiliza H2 y H3 para estructurar el desarrollo y sigue el outline si existe.
5. Incluye una seccion de conclusiones y aprendizajes accionables.
6. Al final agrega la lista **Fuentes citadas** con cada fuente en una linea.

Formato obligatorio de salida:
---
Meta Title: [max 60 caracteres]
Meta Description: [max 155 caracteres]
Tags: [tag1, tag2, tag3, ...]
---

# [Titulo principal con keyword]

[Introduccion]

## [Seccion H2]
[Contenido con datos y citas]

## [Seccion H2]
[Contenido]

**Conclusion:** [Cierre con llamado a la accion]
```

---

## Prompt #5: Generación de Prompts Visuales

### 🎯 ¿Qué busca?
Analizar un artículo completo y generar un prompt optimizado en inglés para crear imágenes con IA (DALL-E, Leonardo AI, Gemini).

### 📍 Dónde se usa
- **Archivo de referencia:** `prompts/v1/05_imagen_generator.md`
- **Workflow n8n:** `SEO - 12 Generacion de Imagenes.json`
- **Nodo:** "Preparar Contexto Imagen" (línea 79)

### 🔧 ¿Qué hace?
1. Analiza el texto completo del artículo
2. Detecta elementos visuales importantes
3. Identifica atmósfera, colores, estilo artístico
4. Genera prompt en inglés (máx. 4 oraciones)
5. Crea alt text en español (máx. 140 caracteres)
6. Retorna JSON con visual_prompt y alt_text

### 📥 Entrada
```json
{
  "article_text": "Durante el otoño, la primera nevada cubrió la aldea...",
  "main_keywords": ["otoño", "nevada", "aldea de montaña"],
  "meta_title": "La primera nevada en la aldea",
  "word_count": 850
}
```

### 📤 Salida
```json
{
  "visual_prompt": "Snow gently covering a small mountain village, golden autumn leaves on the ground, smoke rising from chimneys, cozy warm lights glowing through windows, realistic style.",
  "alt_text": "Nevada cubriendo una aldea de montaña con hojas otoñales"
}
```

### ⚙️ Configuración
```javascript
{
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "maxTokens": 250
}
```

### 📜 Prompt Completo

```
You are a senior visual prompt designer for blog marketing teams.

Craft a rich, specific English prompt (max 4 sentences) for an AI image model focusing on a single scene.

Highlight concrete subjects, environment, lighting, mood, and artistic style. Avoid references to text or typography.

Also produce a concise alt text in Spanish (max 140 characters) describing the resulting image for SEO.

Return only valid JSON using this schema: {
  "visual_prompt": string,
  "alt_text": string
}

Article title: ${context.meta_title}
Meta description: ${context.meta_description}
Main keywords: ${keywords.join(', ')}
Tags: ${tags.join(', ')}
Word count: ${context.word_count}

Article excerpt (Spanish):
${excerpt}
```

---

## Prompt #6: Investigación Deep Research

### 🎯 ¿Qué busca?
Investigar una idea usando el modelo `o4-mini-deep-research` de OpenAI con búsqueda web, encontrando datos recientes, estadísticas y fuentes confiables.

### 📍 Dónde se usa
- **Workflow n8n:** `SEO - 10 Investigacion Deep Research.json`
- **Nodo:** "Preparar Prompt Investigacion" (línea 79)
- **Modelo especial:** `o4-mini-deep-research` con tool `web_search_preview`

### 🔧 ¿Qué hace?
1. Investiga la idea usando búsqueda web en tiempo real
2. Encuentra datos recientes (preferentemente 2021-2026)
3. Identifica estadísticas clave, tendencias y hallazgos
4. Referencia fuentes confiables (organismos, estudios, medios)
5. Prepara resumen ejecutivo y outline de artículo
6. Retorna JSON con estructura completa para redacción

### 📥 Entrada
```json
{
  "idea_title": "Estadísticas de consumo de café orgánico 2024",
  "cluster_name": "Café orgánico",
  "keyword_principal": "café orgánico",
  "keywords_secundarias": ["café sostenible", "mercado café"]
}
```

### 📤 Salida
```json
{
  "Idea": "Estadísticas de consumo de café orgánico 2024",
  "Resumen": "El mercado de café orgánico ha crecido 15% anualmente...",
  "DatosClave": [
    "El consumo global aumentó 15% en 2024 (FAO, 2024)",
    "Brasil lidera producción con 35% del mercado (ICO, 2024)"
  ],
  "Tendencias": [
    "Crecimiento de certificaciones orgánicas",
    "Mayor demanda en mercados asiáticos"
  ],
  "Insights": [
    "Los consumidores pagan hasta 30% más por café certificado"
  ],
  "Fuentes": [
    {
      "Nombre": "FAO",
      "Cita": "FAO, 2024",
      "URL": "https://...",
      "Tipo": "Reporte",
      "Notas": "Datos de producción y consumo global"
    }
  ],
  "ConsultasSugeridas": [
    "Proyecciones mercado café orgánico 2025-2030"
  ],
  "Outline": [
    {
      "Seccion": "Panorama del Mercado Global",
      "Enfoque": "Estadísticas de producción y consumo",
      "Preguntas": ["¿Cuáles son los principales países productores?"]
    }
  ]
}
```

### ⚙️ Configuración
```javascript
{
  "model": "o4-mini-deep-research",
  "maxTokens": 3500,
  "tools": [{"type": "web_search_preview"}],
  "timeout": 100000
}
```

### 📜 Prompt Completo

```
Eres un analista senior de contenidos SEO con acceso a internet. Debes investigar la idea descrita a continuacion usando el modelo o4-mini-deep-research de OpenAI.

Objetivo:
1. Encontrar datos recientes (maximo 2021-2026 preferentemente) que respalden la idea.
2. Identificar estadisticas clave, tendencias y hallazgos relevantes.
3. Referenciar fuentes confiables (organismos, estudios, medios reconocidos).
4. Preparar un resumen ejecutivo y un outline de articulo basado en la evidencia.

Contexto de la idea (JSON):
${JSON.stringify(context, null, 2)}

Instrucciones importantes:
- Usa las consultas sugeridas como punto de partida y agrega las que estimes necesarias.
- Verifica que los datos sean consistentes y cita siempre la fuente con formato ORGANIZACION, AÑO.
- Responde EXCLUSIVAMENTE con JSON valido (sin markdown, sin comentarios).
- Usa exactamente la siguiente estructura con claves en mayuscula/minuscula segun se muestra:
{
  "Idea": "Resumen de la idea investigada",
  "Resumen": "Parrafo sintetico de maximo 4 oraciones",
  "DatosClave": [
    "Dato concreto con cifra o hallazgo (Fuente, Año)",
    "Otro dato relevante (Fuente, Año)"
  ],
  "Tendencias": [
    "Tendencia explicada brevemente (Fuente, Año)",
    "Otra tendencia"
  ],
  "Insights": [
    "Insight accionable derivado de la investigacion"
  ],
  "Fuentes": [
    {
      "Nombre": "Organizacion o medio",
      "Cita": "Nombre corto, Año",
      "URL": "https://...",
      "Tipo": "Reporte | Estudio | Articulo",
      "Notas": "Una frase con lo mas relevante"
    }
  ],
  "ConsultasSugeridas": [
    "Consulta recomendada para profundizar",
    "Otra consulta"
  ],
  "Outline": [
    {
      "Seccion": "Titulo de la seccion",
      "Enfoque": "Que cubrir",
      "Preguntas": ["Pregunta opcional"]
    }
  ]
}

Si no encuentras suficientes datos fiables, indica "Resumen" vacio y deja comentarios en "Insights" explicando la limitacion.
```

---

## Lógica de QA SEO

### 🎯 ¿Qué busca?
Evaluar la calidad SEO de artículos verificando metadatos, densidad de keywords, estructura de encabezados, enlaces y otros criterios.

### 📍 Dónde se usa
- **Workflow n8n:** `SEO - 13 QA SEO.json`
- **Nodo:** "Evaluar QA" (línea 92)
- **Tipo:** Lógica de validación en JavaScript (no usa prompts de OpenAI)

### 🔧 ¿Qué hace?
1. Verifica Meta Title (30-60 caracteres)
2. Verifica Meta Description (90-165 caracteres)
3. Calcula word count real del contenido
4. Valida presencia de H1 y H2
5. Calcula densidad de keyword principal (0.8-2.5%)
6. Verifica keyword en primeros 100 términos
7. Cuenta enlaces internos y externos
8. Verifica tags definidos
9. Genera reporte detallado con checks pass/warn/fail
10. Marca draft como aprobado o rechazado

### 📥 Entrada
```json
{
  "draft_id": "uuid",
  "title": "Cómo preparar café orgánico",
  "meta_title": "Preparar Café Orgánico en Casa",
  "meta_description": "Aprende a preparar café orgánico...",
  "content_markdown": "# Cómo preparar café orgánico\n\n...",
  "keyword_principal": "café orgánico",
  "tags": ["café", "orgánico", "preparación"]
}
```

### 📤 Salida
```json
{
  "draft_id": "uuid",
  "qa_passed": true,
  "qa_status": "pass",
  "qa_report": {
    "generated_at": "2025-10-23T10:00:00Z",
    "summary": {
      "total_checks": 11,
      "passed": 9,
      "warnings": 2,
      "failed": 0,
      "message": "QA aprobado con observaciones."
    },
    "stats": {
      "word_count": 650,
      "heading_h1": 1,
      "heading_h2": 3,
      "keyword_occurrences": 8,
      "keyword_density": 1.23,
      "keyword_in_intro": true,
      "links_total": 3,
      "links_internal": 2,
      "links_external": 1,
      "tags_total": 3
    },
    "checks": [
      {
        "id": "meta_title_length",
        "label": "Meta Title",
        "status": "pass",
        "message": "Meta title con 32 caracteres.",
        "value": 32,
        "expected": "35-60 caracteres"
      }
    ]
  }
}
```

### ⚙️ Configuración (Parámetros QA)
```javascript
{
  "meta_title_min": 35,
  "meta_title_warn_min": 30,
  "meta_title_max": 60,
  "meta_description_min": 110,
  "meta_description_warn_min": 90,
  "meta_description_max": 165,
  "word_count_min": 600,
  "word_count_warn": 550,
  "keyword_density_min": 0.8,
  "keyword_density_warn_min": 0.6,
  "keyword_density_max": 2.5,
  "keyword_density_warn_max": 3.0
}
```

### 🧪 Checks Realizados

| Check ID | Descripción | Critical | Criterio Pass |
|----------|-------------|----------|---------------|
| `meta_title_presence` | Verifica presencia de meta title | ✅ | Meta title no vacío |
| `meta_title_length` | Longitud de meta title | ✅ | 35-60 caracteres |
| `meta_description_presence` | Verifica presencia de meta description | ✅ | Meta description no vacía |
| `meta_description_length` | Longitud de meta description | ✅ | 110-165 caracteres |
| `word_count` | Conteo de palabras | ✅ | >= 600 palabras |
| `heading_h1` | Presencia de H1 | ✅ | >= 1 H1 |
| `heading_h2` | Presencia de H2 | ✅ | >= 1 H2 |
| `keyword_in_intro` | Keyword en introducción | ✅ | Aparece en primeros 100 términos |
| `keyword_density` | Densidad de keyword | ✅ | 0.8-2.5% |
| `keyword_occurrences` | Ocurrencias de keyword | ✅ | > 0 apariciones |
| `links_total` | Total de enlaces | ❌ | >= 1 enlace (opcional) |
| `links_internal` | Enlaces internos | ❌ | >= 1 enlace interno (opcional) |
| `tags_presence` | Presencia de tags | ❌ | >= 1 tag (opcional) |

---

## Resumen de Configuraciones

### Modelos y Parámetros por Prompt

| Prompt | Modelo | Temperature | Max Tokens | Tiempo Aprox. | Costo Aprox. |
|--------|--------|-------------|------------|---------------|--------------|
| #1 Clustering | gpt-4o | 0.7 | 2000 | 3-5s | $0.015-$0.023 |
| #2 Ideas | gpt-4o | 0.8 | 2500 | 5-8s | $0.030-$0.038 |
| #3 Redacción Simple | gpt-4o | 0.7 | 3500 | 10-15s | $0.045-$0.053 |
| #4 Redacción Investigada | gpt-4o | 0.6 | 4200 | 12-18s | $0.053-$0.060 |
| #5 Prompt Visual | gpt-4o-mini | 0.7 | 250 | 2-3s | $0.002-$0.003 |
| #6 Deep Research | o4-mini-deep-research | - | 3500 | 30-60s | $0.100-$0.150 |
| QA SEO | N/A (JavaScript) | - | - | <1s | $0 |

**Costo total por artículo completo (con investigación):** ~$0.25-$0.35

---

## 🔗 Flujo Completo de Prompts

```
1. Keywords (CSV/Manual)
   ↓
2. [Prompt #1] → Clustering de Keywords
   ↓
3. [Prompt #2] → 30 Ideas + Clasificación
   ↓
   ├─ Ideas SIN investigación
   │  ↓
   │  [Prompt #3] → Redacción Simple
   │
   └─ Ideas CON investigación
      ↓
      [Prompt #6] → Deep Research (o4-mini)
      ↓
      [Prompt #4] → Redacción Investigada
   ↓
4. Artículos Generados
   ↓
5. [Prompt #5] → Generación de Prompt Visual
   ↓
6. Imagen Generada (Gemini/DALL-E)
   ↓
7. [Lógica QA] → Control de Calidad SEO
   ↓
8. Publicación en WordPress
```

---

## 📊 Estadísticas del Proyecto

- **Total de prompts documentados:** 6 prompts + 1 lógica QA
- **Prompts en archivos .md:** 5
- **Prompts embebidos en workflows:** 6
- **Workflows activos:** 13
- **Versión de prompts:** v1.0
- **Fecha de última actualización:** 23 Octubre 2025

---

## 📝 Notas Importantes

### Mejores Prácticas
- ✅ Usar siempre JSON válido sin markdown
- ✅ Mantener idioma original de keywords
- ✅ Validar respuestas antes de guardar en DB
- ✅ Citar fuentes con formato (Nombre, Año)
- ✅ Revisar límites de caracteres en metadatos

### Versionado
- Los prompts están versionados en `prompts/v*/`
- Cambios mayores requieren nueva versión
- Cambios menores se documentan en `CHANGELOG.md`

### Mantenimiento
- Revisar rendimiento cada sprint
- Actualizar parámetros según métricas
- Optimizar temperature y maxTokens según resultados

---

## 🆘 Soporte y Referencias

- **Documentación prompts:** `seo-module/prompts/README.md`
- **Workflows n8n:** `seo-module/n8n/workflows/`
- **Scripts de testing:** `seo-module/scripts/`
- **Documentación completa:** `seo-module/docs/README.md`

---

**Generado:** 23 Octubre 2025  
**Autor:** Sistema MarketAI  
**Estado:** Producción

