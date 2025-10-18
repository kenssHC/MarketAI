# 🔄 Resumen de Workflows

El módulo SEO cuenta con 6 workflows que automatizan el proceso completo de creación de contenido optimizado.

---

## 📊 Los 6 Workflows

| # | Nombre | Función | Estado | Endpoint |
|---|--------|---------|--------|----------|
| 1 | Keywords Analysis | Analiza y genera keywords con IA | Listo | `/webhook/seo/keywords` |
| 2 | Ideas Generator | Genera 30 ideas de contenido | Listo | `/webhook/seo/ideas` |
| 3 | Redacción | Redacta artículos optimizados | Listo | `/webhook/seo/redaccion` |
| 4 | Formateo HTML | Convierte JSON a HTML SEO | Listo | `/webhook/seo/formatear` |
| 5 | Ingesta CSV | Importa keywords desde CSV | Listo | `/webhook/seo/ingesta/csv` |
| 6 | Ingesta Manual | Ingreso manual de keywords | Listo | `/webhook/seo/ingesta/manual` |

---

## 🔄 Pipeline Completo

```
┌──────────────────┐
│  Ingesta         │  WF 5: CSV de Google Ads
│  Keywords        │  WF 6: Ingreso manual
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│  Clustering      │  WF 1: Agrupa keywords
│  con IA          │  por temáticas
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│  Generación      │  WF 2: 30 ideas de
│  de Ideas        │  contenido por cluster
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│  Redacción       │  WF 3: Artículo SEO
│  de Contenido    │  optimizado
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│  Formateo        │  WF 4: HTML con
│  HTML            │  etiquetas semánticas
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│  Publicación     │  WordPress
│  (Futuro)        │  automática
└──────────────────┘
```

---

## 📝 Descripción Detallada

### Workflow 1: Keywords Analysis
**Función:** Analiza un tema y genera palabras clave relevantes con intención de búsqueda.

**Input:**
```json
{
  "tema": "marketing digital",
  "nicho": "tecnologia",
  "intencion": "informacional"
}
```

**Output:** Lista de keywords con volumen estimado y dificultad.

**Prompt usado:** `prompts/v1/01_keywords_clustering.md`

---

### Workflow 2: Ideas Generator
**Función:** Genera y clasifica ideas de contenido basadas en keywords.

**Input:**
```json
{
  "keywords": ["seo", "marketing", "contenido"],
  "tema": "marketing digital",
  "objetivo": "generar trafico"
}
```

**Output:** 30 ideas organizadas por categorías con relevancia.

**Prompt usado:** `prompts/v1/02_ideas_generator.md`

---

### Workflow 3: Redacción
**Función:** Genera artículos completos optimizados para SEO.

**Input:**
```json
{
  "keyword_principal": "marketing digital",
  "keywords_secundarias": ["seo", "contenido"],
  "tono": "profesional",
  "extension": 500
}
```

**Output:** Artículo con título, meta descripción y secciones estructuradas.

**Prompts usados:**
- `prompts/v1/03_redaccion_simple.md` (sin investigación)
- `prompts/v1/04_redaccion_investigada.md` (con fuentes)

---

### Workflow 4: Formateo HTML
**Función:** Convierte el JSON del artículo en HTML optimizado.

**Input:**
```json
{
  "contenido": {
    "titulo": "...",
    "secciones": [...]
  }
}
```

**Output:** HTML con etiquetas semánticas y estadísticas.

**Prompt usado:** `prompts/v1/04_redaccion_investigada.md`

---

### Workflow 5: Ingesta CSV
**Función:** Importa keywords desde CSV de Google Keyword Planner.

**Documentación completa:** [ingesta-csv.md](ingesta-csv.md)

**Endpoint:** `POST /webhook/seo/ingesta/csv`

---

### Workflow 6: Ingesta Manual
**Función:** Permite ingresar keywords manualmente.

**Documentación completa:** [ingesta-manual.md](ingesta-manual.md)

**Endpoint:** `POST /webhook/seo/ingesta/manual`

---

## 🎯 Workflows por Estado

### ✅ Completados y Funcionales (6/6)
- Workflow 1: Keywords Analysis
- Workflow 2: Ideas Generator
- Workflow 3: Redacción
- Workflow 4: Formateo HTML
- Workflow 5: Ingesta CSV
- Workflow 6: Ingesta Manual

### 🔄 En Desarrollo (0)
Ninguno actualmente

### 📅 Planificados
- Workflow 7: Generación de imágenes (DALL-E/Leonardo)
- Workflow 8: QA SEO automático
- Workflow 9: Publicación WordPress
- Workflow 10: Copys para redes sociales

---

## 🧪 Cómo Probar

**Verifica todos los workflows:**
```powershell
cd scripts
.\test_workflows.ps1
```

**Prueba workflows de ingesta:**
```powershell
.\test_ingesta.ps1
```

---

## 📚 Documentación Relacionada

- [Ingesta CSV](ingesta-csv.md) - Workflow 5 detallado
- [Ingesta Manual](ingesta-manual.md) - Workflow 6 detallado
- [Troubleshooting](../troubleshooting.md) - Solución de problemas
- [Quickstart](../quickstart.md) - Configuración inicial

---

**Última actualización:** 17 Octubre 2025

