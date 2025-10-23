# Checklist Tarea 9 – Redacción desde JSON investigado

## Pre-requisitos
- Workflows 7, 8, 9, 10 y 11 activados en n8n (switch verde).
- Variables `OPENAI_API_KEY` (gpt-4o u o4-mini) configuradas en `.env` y credenciales n8n.
- PostgreSQL con las migraciones `001_initial_schema.sql` y `002_add_research_reports.sql` aplicadas.
- Ideas marcadas como `research_ready` disponibles en la tabla `ideas` (se generan vía WF8 + WF10).

## Pasos de verificación
1. **Generar/actualizar research** (si es necesario)  
   ```powershell
   cd seo-module/scripts
   .\test_workflow10.ps1   # limit = 1 por defecto
   ```
2. **Ejecutar redacción investigada**  
   ```powershell
   .\test_workflow11.ps1   # procesa una idea con research_ready
   ```
3. **Validar en PostgreSQL**  
   ```powershell
   docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
   SELECT d.id, d.idea_id, d.word_count, jsonb_array_length(d.research_sources) AS fuentes, d.created_at
   FROM drafts d
   ORDER BY d.created_at DESC
   LIMIT 5;
   "
   ```
4. **Revisar logs del job**  
   ```powershell
   docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
   SELECT job_name, status, related_idea_id, related_draft_id, completed_at
   FROM jobs_log
   WHERE job_name = 'SEO - 11 Redaccion Investigada'
   ORDER BY completed_at DESC
   LIMIT 5;
   "
   ```
5. (Opcional) Ejecutar el chequeo global:  
   ```powershell
   .\test_workflows.ps1
   ```

## Evidencias recomendadas
- Captura de la ejecución OK del workflow en n8n (módulo “Executions”).
- JSON de respuesta de `test_workflow11.ps1` mostrando `total_drafts_created`.
- Consulta SQL que muestre el draft generado con `research_sources` > 0.
- Registro correspondiente en `jobs_log` con `status = 'success'`.
- Enlace o export del markdown generado para revisión editorial.

