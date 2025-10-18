# 📝 Prompts del Módulo SEO - MarketAI

Sistema de prompts versionados para generación automática de contenido SEO optimizado.

---

## 📋 Índice

- [Descripción General](#descripción-general)
- [Estructura de Prompts](#estructura-de-prompts)
- [Versión Actual: v1](#versión-actual-v1)
- [Flujo Completo](#flujo-completo)
- [Uso de Prompts](#uso-de-prompts)
- [Versionado](#versionado)
- [Ejemplos](#ejemplos)

---

## 🎯 Descripción General

Este directorio contiene todos los prompts utilizados en el pipeline de generación de contenido SEO. Cada prompt está diseñado para una etapa específica del proceso y está versionado para facilitar el mantenimiento y evolución del sistema.

### Pipeline Completo:

```
Keywords (CSV/Manual)
    ↓
[Prompt #1] Clustering
    ↓
[Prompt #2] 30 Ideas + Clasificación
    ↓
[Prompt #3 o #4] Redacción (con/sin investigación)
    ↓
[Prompt #5] Generación de Imagen
    ↓
Publicación en WordPress
```

---

## 📁 Estructura de Prompts

```
prompts/
├── v1/                                    # Versión 1 (Actual)
│   ├── 01_keywords_clustering.md         # Agrupación de keywords
│   ├── 02_ideas_generator.md             # Generación de 30 ideas
│   ├── 03_redaccion_simple.md            # Redacción sin investigación
│   ├── 04_redaccion_investigada.md       # Redacción con investigación
│   └── 05_imagen_generator.md            # Generación de prompts visuales
├── README.md                              # Este archivo
└── CHANGELOG.md                           # Historial de cambios
```

---

## 🔖 Versión Actual: v1

**Fecha de creación:** 17 Octubre 2025  
**Estado:** Activa

### Prompts Disponibles:

| # | Nombre | Tarea | Workflow | Archivo |
|---|--------|-------|----------|---------|
| 1 | **Clustering de Keywords** | Tarea 5 | `seo_01_keywords` | [01_keywords_clustering.md](v1/01_keywords_clustering.md) |
| 2 | **Generador de Ideas** | Tarea 6 | `seo_02_ideas` | [02_ideas_generator.md](v1/02_ideas_generator.md) |
| 3 | **Redacción Simple** | Tarea 7 | `seo_03_redaccion` | [03_redaccion_simple.md](v1/03_redaccion_simple.md) |
| 4 | **Redacción Investigada** | Tarea 9 | `seo_03_redaccion` | [04_redaccion_investigada.md](v1/04_redaccion_investigada.md) |
| 5 | **Generador de Imágenes** | Tarea 10 | `seo_06_imagen` | [05_imagen_generator.md](v1/05_imagen_generator.md) |

---

## 🔄 Flujo Completo

### 1️⃣ **Ingesta de Keywords** (Manual o CSV)

**Input:** Lista de keywords desde Google Keyword Planner o ingreso manual

```json
{
  "keywords": ["cafe organico", "beneficios del cafe", "cafe de altura"],
  "source": "gkp",
  "nicho": "salud y bienestar"
}
```

**Output:** Keywords guardadas en PostgreSQL (tabla `keywords`)

---

### 2️⃣ **Clustering** (Prompt #1)

**Input:** Keywords de la base de datos

**Prompt:** [01_keywords_clustering.md](v1/01_keywords_clustering.md)

**Output:**
```json
{
  "Tema_1": {
    "Keyword_Principal": "café orgánico",
    "Keywords_Secundarias": ["café saludable", "café sin pesticidas"]
  },
  "Tema_2": {
    "Keyword_Principal": "beneficios del café",
    "Keywords_Secundarias": ["propiedades del café", "café y salud"]
  }
}
```

---

### 3️⃣ **Generación de Ideas** (Prompt #2)

**Input:** Clusters de keywords

**Prompt:** [02_ideas_generator.md](v1/02_ideas_generator.md)

**Output:**
```json
{
  "Ideas": [
    {
      "Idea": "Estadísticas de consumo de café orgánico 2024",
      "Categoria": "Requiere investigación"
    },
    {
      "Idea": "Cómo preparar café orgánico en casa",
      "Categoria": "No requiere investigación"
    }
    // ... 28 ideas más
  ]
}
```

---

### 4️⃣ **Redacción de Artículos**

#### **Opción A: Sin Investigación** (Prompt #3)

**Input:** Ideas clasificadas como "No requiere investigación"

**Prompt:** [03_redaccion_simple.md](v1/03_redaccion_simple.md)

**Output:**
```markdown
---
Meta Title: Cómo Preparar Café Orgánico en Casa
Meta Description: Guía completa para preparar café orgánico...
Tags: café orgánico, preparación de café, café en casa
---

# Cómo Preparar Café Orgánico en Casa

[Contenido del artículo de 600+ palabras]
```

#### **Opción B: Con Investigación** (Prompt #4)

**Input:** Datos de investigación (Perplexity) + idea

**Prompt:** [04_redaccion_investigada.md](v1/04_redaccion_investigada.md)

**Output:**
```markdown
---
Meta Title: Estadísticas de Consumo de Café Orgánico 2024
Meta Description: Datos actualizados sobre el mercado...
Tags: café orgánico, estadísticas, consumo de café
---

# Estadísticas de Consumo de Café Orgánico 2024

Según datos de la FAO (2024), el consumo de café orgánico...

[Contenido con citas y fuentes]
```

---

### 5️⃣ **Generación de Imagen** (Prompt #5)

**Input:** Artículo completo en texto

**Prompt:** [05_imagen_generator.md](v1/05_imagen_generator.md)

**Output (Prompt Visual):**
```
Close-up of hands pouring hot water over organic coffee grounds in ceramic dripper, 
rustic wooden table, steam rising, warm morning sunlight, photorealistic style, 
earthy brown and cream tones.
```

**Este prompt se envía a:** Leonardo AI / DALL-E 3 → Imagen generada

---

## 📖 Uso de Prompts

### **En n8n:**

1. Importa el workflow correspondiente
2. El nodo OpenAI usa el prompt del archivo .md
3. Configura las credenciales de OpenAI
4. Activa el workflow

### **Ejemplo de configuración en n8n:**

```javascript
// Nodo OpenAI - Configuración
{
  "model": "gpt-4o",
  "temperature": 0.7,
  "maxTokens": 2500,
  "systemMessage": "[contenido del prompt .md]",
  "userMessage": "{{$json.input}}"
}
```

### **Vía API directa (Python):**

```python
import openai

# Leer prompt desde archivo
with open('prompts/v1/02_ideas_generator.md', 'r') as f:
    prompt_template = f.read()

# Usar con OpenAI
response = openai.ChatCompletion.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": prompt_template},
        {"role": "user", "content": json.dumps(input_data)}
    ]
)
```

---

## 🔄 Versionado

### **Nomenclatura:**

- **v1/** - Primera versión estable (actual)
- **v2/** - Próxima versión mayor (cuando se cree)

### **Cuándo crear una nueva versión:**

- ✅ Cambios significativos en la estructura del prompt
- ✅ Modificación del formato de entrada/salida
- ✅ Optimizaciones importantes de rendimiento
- ✅ Cambios en el modelo de IA requerido

### **Cuándo NO crear nueva versión:**

- ❌ Correcciones de typos
- ❌ Mejoras menores en wording
- ❌ Ajustes de ejemplos

**Registra todos los cambios en:** [CHANGELOG.md](CHANGELOG.md)

---

## 📊 Métricas de Rendimiento

### **Costos Estimados (GPT-4o):**

| Prompt | Tokens Aprox. | Costo/Uso | Tiempo |
|--------|---------------|-----------|--------|
| #1 Clustering | 1,000 - 1,500 | $0.015 - $0.023 | ~3-5s |
| #2 Ideas (x30) | 2,000 - 2,500 | $0.030 - $0.038 | ~5-8s |
| #3 Redacción Simple | 3,000 - 3,500 | $0.045 - $0.053 | ~10-15s |
| #4 Redacción Investigada | 3,500 - 4,000 | $0.053 - $0.060 | ~12-18s |
| #5 Prompt Imagen | 150 - 200 | $0.002 - $0.003 | ~2-3s |

**Total por artículo completo:** ~$0.15 - $0.20

---

## 💡 Ejemplos Completos

### **Ejemplo 1: Pipeline Completo (Sin Investigación)**

```bash
# Input: Keywords
["cafe organico", "preparacion cafe", "cafe en casa"]

# Paso 1: Clustering
{"Tema_1": {"Keyword_Principal": "cafe organico", ...}}

# Paso 2: Ideas
{"Ideas": [{"Idea": "Cómo preparar café orgánico", "Categoria": "No requiere investigación"}]}

# Paso 3: Redacción
[Artículo de 800 palabras con metadatos]

# Paso 4: Imagen
[URL de imagen generada]

# Output: Artículo listo para WordPress
```

### **Ejemplo 2: Pipeline con Investigación**

```bash
# Input: Keywords
["estadisticas cafe organico 2024", "mercado cafe sostenible"]

# Paso 1: Clustering
{"Tema_1": {"Keyword_Principal": "estadisticas cafe organico", ...}}

# Paso 2: Ideas
{"Ideas": [{"Idea": "Estadísticas del mercado 2024", "Categoria": "Requiere investigación"}]}

# Paso 2.5: Investigación con Perplexity
{"DatosClave": ["Consumo global creció 15%..."], "Fuentes": ["FAO, 2024"]}

# Paso 3: Redacción con fuentes
[Artículo con citas y fuentes]

# Paso 4: Imagen
[URL de imagen generada]

# Output: Artículo con autoridad para WordPress
```

---

## 🔧 Mantenimiento

### **Actualizar un prompt:**

1. Edita el archivo .md correspondiente
2. Actualiza el campo "Fecha" en el encabezado
3. Documenta el cambio en CHANGELOG.md
4. Reinicia el workflow en n8n si es necesario

### **Crear nueva versión:**

```bash
cd seo-module/prompts
mkdir v2
cp -r v1/* v2/
# Edita los archivos en v2/
# Actualiza CHANGELOG.md
```

---

## 📚 Referencias

- [Documentación OpenAI](https://platform.openai.com/docs)
- [Guía de Prompt Engineering](https://www.promptingguide.ai/)
- [Lista de tareas del módulo](../../Herramientas/Lista%20de%20tareas%20del%20modulo%20SEO.txt)
- [n8n Workflows](../n8n/workflows/)

---

## 🆘 Soporte

**¿Problemas con los prompts?**

1. Verifica que la sintaxis JSON de entrada sea correcta
2. Revisa los logs del workflow en n8n
3. Confirma que las credenciales de OpenAI estén activas
4. Consulta los ejemplos en cada archivo .md

**Contacto:** Equipo de desarrollo MarketAI

---

**Última actualización:** 17 Octubre 2025  
**Versión de prompts:** v1.0  
**Estado:** Producción

