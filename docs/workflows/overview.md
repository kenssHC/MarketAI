# Resumen de Workflows

El módulo SEO cuenta con 13 workflows activos que automatizan la cadena de valor desde la ingesta de keywords hasta la publicación del contenido en WordPress.

---

## Lista de Workflows

| # | Nombre | Función | Estado | Endpoint |
|---|--------|---------|--------|----------|
| 1 | Keywords Analysis | Genera keywords base desde tema/nicho | Listo | `/webhook/seo/keywords` |
| 2 | Ideas Generator (v1) | Clasifica ideas generales por intención | Listo | `/webhook/seo/ideas` |
| 3 | Redacción (v1) | Redacta artículos rápidos (sin investigación) | Listo | `/webhook/seo/redaccion` |
| 4 | Formateo HTML | Convierte estructuras JSON a HTML SEO | Listo | `/webhook/seo/formatear` |
| 5 | Ingesta CSV | Importa keywords desde Google Ads CSV | Listo | `/webhook/seo/ingesta/csv` |
| 6 | Ingesta Manual | Alta manual de keywords | Listo | `/webhook/seo/ingesta/manual` |
| 7 | Clustering de Keywords | Agrupa keywords por proximidad semántica (LLM) | Listo | `/webhook/seo/clustering` |
| 8 | Generación de Ideas (v2) | Produce 30 ideas por cluster y las categoriza | Listo | `/webhook/seo/ideas-generation` |
| 9 | Redacción Simple | Redacción >600 palabras para ideas sin investigación | Listo | `/webhook/seo/redaccion/simple` |
|10 | Investigación Deep Research | Normaliza research con o4-mini y guarda sources | Listo | `/webhook/seo/investigacion` |
|11 | Redacción Investigada | Redacción >800 palabras citando fuentes verificadas | Listo | `/webhook/seo/redaccion/investigada` |
|12 | Generación de Imágenes | Prompt visual + imagen (Gemini) y subida a WordPress | Listo | `/webhook/seo/imagenes/generar` |
|13 | QA SEO Automatizado | Revisa drafts y genera reporte SEO con bandera de calidad | Listo | `/webhook/seo/qa` |

---

## Pipeline Actual

```
Ingesta de Keywords (WF5/WF6)
        └─ Clustering IA (WF7)
              └─ Generación de Ideas por cluster (WF8)
                    ├─ Redacción simple (WF9)
                    └─ Investigación profunda (WF10)
                            └─ Redacción investigada (WF11)
                                    └─ QA SEO Automatizado (WF13)
                                        └─ Generación de Imágenes (WF12)
                                            └─ Formateo HTML (WF4)
                                                    └─ Publicación / QA (WFs futuros)
```

Los workflows 1-3 brindan compatibilidad con la versión inicial del módulo, pero la ruta recomendada para producción sigue la secuencia 5 → 7 → 8 → (9 o 10+11) → 12 → 4.

---

## Descripción Detallada

### Workflow 1: Keywords Analysis
Genera keywords base a partir de tema, nicho e intención de búsqueda. Utiliza OpenAI y devuelve volumen estimado y dificultad relativa.

**Input ejemplo**
```json
{
  "tema": "marketing digital",
  "nicho": "tecnologia",
  "intencion": "informacional"
}
```

---

### Workflow 2: Ideas Generator (v1)
Clasifica ideas generales en función de las keywords iniciales (útil para validación rápida o brainstorming manual).

---

### Workflow 3: Redacción (v1)
Redacta artículos rápidos (~500 palabras) sin investigación previa. Usa `prompts/v1/03_redaccion_simple.md`.

---

### Workflow 4: Formateo HTML
Recibe un JSON estructurado de contenido y produce HTML con semántica SEO. Ideal para consumir los drafts generados en WF9 o WF11.

---

### Workflow 5: Ingesta CSV
Importa keywords desde Google Keyword Planner. Cuenta con validaciones de formato y escritura en PostgreSQL.

Documentación específica: [ingesta-csv.md](ingesta-csv.md)

---

### Workflow 6: Ingesta Manual
Permite ingresar keywords manualmente para escenarios rápidos o pruebas.

Documentación específica: [ingesta-manual.md](ingesta-manual.md)

---

### Workflow 7: Clustering de Keywords
Lee keywords pendientes y agrupa por afinidad semántica utilizando LLM y el prompt oficial `prompts/v1/01_keywords_clustering.md`. Persiste clusters y archiva keywords originales.

---

### Workflow 8: Generación de Ideas (v2)
Genera 30 ideas por cluster, etiquetando cada una como "Requiere investigación" o "No requiere investigación" según el prompt `prompts/v1/02_ideas_generator.md`. Las ideas quedan registradas en la tabla `ideas`.

---

### Workflow 9: Redacción Simple
Procesa ideas que **no requieren investigación** y genera drafts en Markdown (>600 palabras) con metadatos SEO, calculando word count automáticamente. Usa `prompts/v1/03_redaccion_simple.md`.

---

### Workflow 10: Investigación Deep Research
Consume ideas "Requiere investigación", llama al modelo `o4-mini-deep-research`, normaliza el JSON (datos, fuentes, insights) y lo almacena en `research_reports`. Cambia la idea a `research_ready`.

---

### Workflow 11: Redacción Investigada
Convierte los `research_reports` en artículos >800 palabras citando fuentes, guarda el draft en `drafts` con `research_data` y `research_sources`, actualiza idea a `draft_created` y registra la ejecución en `jobs_log`.

Prompt principal: `prompts/v1/04_redaccion_investigada.md`

---

### Workflow 12: Generación de Imágenes
Convierte drafts listos de WF11 en prompts visuales, genera imágenes con Gemini y publica el medio en WordPress, actualizando el draft y registrando la ejecución en `jobs_log`.

Documentación específica: [generacion-imagenes.md](generacion-imagenes.md)

### Workflow 13: QA SEO Automatizado
Evalúa los drafts generados (WF9/WF11) aplicando checks de calidad SEO: longitud de metadatos, densidad de keywords, encabezados, enlaces y presencia en la introducción. Genera un `qa_report` detallado, actualiza `qa_passed` y registra el resultado en `jobs_log`.

**Entradas principales**
```json
{
  "limit": 3,
  "force": false,
  "draft_id": "opcional"
}
```

**Salidas clave**
- `qa_passed` con estados `pass`, `pass_with_warnings` o `fail`.
- `qa_report.summary` con los checks críticos y advertencias.
- Registro en `jobs_log` (`job_type = qa`) con métricas y recomendaciones.

---

## Workflows por Estado

### ● Completados (13/13)
- WF1 – Keywords Analysis
- WF2 – Ideas Generator (v1)
- WF3 – Redacción (v1)
- WF4 – Formateo HTML
- WF5 – Ingesta CSV
- WF6 – Ingesta Manual
- WF7 – Clustering de Keywords
- WF8 – Generación de Ideas (v2)
- WF9 – Redacción Simple
- WF10 – Investigación Deep Research
- WF11 – Redacción Investigada
- WF12 – Generación de Imágenes

### ● Próximos (roadmap)
- WF13 – QA SEO automatizado
- WF14 – UI de aprobación / revisión humana
- WF15 – Publicación WordPress
- WF16 – Copys para redes sociales

---

## Cómo Probar Rápido

```powershell
cd scripts
.\test_workflows.ps1           # Salud general de los 13 workflows
.\test_workflow11.ps1          # Redacción investigada punta a punta
.\test_workflow12.ps1          # Generación de imágenes + subida a WordPress
.\test_e2e_completo_con_redaccion.ps1  # Pipeline completo (ingesta → redacción)
```

---

**Última actualización:** 22 Octubre 2025
