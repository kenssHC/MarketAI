# Workflow 13 - QA SEO Automatizado

El workflow **SEO - 13 QA SEO** valida los drafts generados por los workflows de redacción (WF9 y WF11) y produce un reporte estructurado con los checks de calidad más relevantes. Cada ejecución actualiza los campos `qa_passed`, `qa_report` y `qa_checked_at` en la tabla `drafts`, además de registrar un `jobs_log` detallado.

---

## Objetivos

- Verificar que los metadatos SEO cumplen con las longitudes recomendadas.
- Confirmar la presencia y densidad adecuada de la keyword principal.
- Revisar encabezados (H1/H2), enlaces internos/externos y word count.
- Emitir advertencias (`warn`) y fallas (`fail`) agrupadas en `qa_report`.
- Exponer un resumen JSON para consumo de UI o scripts posteriores.

---

## Requisitos previos

- Workflows 9, 10 y 11 generando drafts en la tabla `drafts`.
- Conexión PostgreSQL configurada en n8n (mismo `Postgres account` que el resto).
- Opcional: parámetro `internal_domain` para distinguir enlaces internos.

---

## Nodos principales

1. **Webhook**  
   - Método: `POST`  
   - Path: `/webhook/seo/qa`  
   - Modo de respuesta: `responseNode`

2. **Seleccionar Drafts QA (Postgres)**  
   - Filtra drafts con `content_markdown` y, por defecto, `qa_passed = false`.  
   - Respeta parámetros opcionales: `draft_id`, `idea_id`, `keyword_cluster_id`, `project_name`, `include_passed`, `include_published`, `force`, `limit`.

3. **Preparar Contexto QA (Code)**  
   - Inyecta el cuerpo del request (filtros) y genera marcas de tiempo para el job.

4. **Evaluar QA (Code)**  
   - Calcula métricas clave:  
     - Longitud de `meta_title` (min 35, max 60)  
     - Longitud de `meta_description` (min 110, max 165)  
     - Word count recomendado (`>= 600`)  
     - Presencia de H1/H2  
     - Keyword principal en los primeros 100 términos  
     - Densidad objetivo (0.8% - 2.5%, con tolerancias `warn`)  
     - Tags y enlaces internos/externos  
   - Genera `qa_report.summary`, `qa_report.stats` y la matriz de `checks` (`pass`, `warn`, `fail`).  
   - Define `qa_status` (`pass`, `pass_with_warnings`, `fail`) y la bandera `qa_passed`.

5. **Actualizar Draft QA (Postgres)**  
   - Persiste `qa_passed`, `qa_report` y `qa_checked_at`.

6. **Preparar / Insertar Job Log (Code + Postgres)**  
   - Registra `job_type = qa` con duración, filtros aplicados, resumen y métricas.

7. **Responder Webhook**  
   - Devuelve un JSON con el resumen de drafts procesados, `qa_status`, advertencias y `job_log_id`.
   - En ausencia de drafts responde `status: "empty"` (no es error).

---

## Parámetros del webhook

```json
{
  "limit": 3,
  "force": false,
  "include_passed": false,
  "include_published": false,
  "draft_id": "opcional",
  "idea_id": "opcional",
  "keyword_cluster_id": "opcional",
  "project_name": "opcional",
  "internal_domain": "dominio.com"
}
```

- `force = true` ignora el filtro `qa_passed` para reevaluar drafts aprobados.
- `include_passed = true` trae drafts aprobados además de los pendientes.
- `internal_domain` ayuda a catalogar enlaces internos (`url` que contiene el dominio o empieza con `/`).

---

## Respuesta de ejemplo

```json
{
  "status": "success",
  "summary": {
    "total": 2,
    "passed": 1,
    "warnings": 1,
    "failed": 0
  },
  "drafts": [
    {
      "draft_id": "d9c1…",
      "qa_status": "pass_with_warnings",
      "qa_checked_at": "2025-10-22T21:58:10.123Z",
      "qa_stats": {
        "word_count": 612,
        "keyword_density": 1.2,
        "links_total": 3,
        "links_internal": 1
      },
      "warnings": [
        { "id": "meta_description_length", "message": "Meta description con 108 caracteres..." }
      ],
      "failures": [],
      "job_log_id": "5c4b…"
    }
  ],
  "generated_at": "2025-10-22T21:58:11.002Z"
}
```

---

## Notas operativas

- `qa_report.checks` clasifica cada regla:  
  - `pass` → OK  
  - `warn` → aceptable pero requiere revisión manual  
  - `fail` → bloqueo crítico (`qa_passed = false`)
- `qa_report.summary.critical_failed` lista los check IDs críticos que fallaron.
- Úsalo antes de la UI de aprobación (Tarea 12) o como guardia antes de publicar en CMS.
- Ejecuta `test_workflow13.ps1 -VerboseReport` para ver detalles por terminal.

