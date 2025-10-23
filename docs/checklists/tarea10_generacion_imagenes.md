# Checklist Tarea 10 - Generación de Imágenes

## Pre-requisitos
- Workflow 11 (`SEO - 11 Redaccion Investigada`) ejecutado y drafts disponibles sin `featured_image_url`.
- `GEMINI_API_KEY` configurada (variable en n8n o body del webhook).
- Endpoint y credenciales de WordPress (Application Password, Basic Auth o header `Authorization`/`X-WP-Nonce`).
- Scripts actualizados (`test_workflow11.ps1`, `test_workflow12.ps1`).

## Pasos de verificación
1. **Generar draft investigado si falta**  
   ```powershell
   cd seo-module/scripts
   .\test_workflow11.ps1 -Limit 1
   ```
2. **Ejecutar generación de imagen en WordPress**  
   ```powershell
   .\test_workflow12.ps1 -Limit 1 -VerboseBody `
     -WordpressEndpoint "https://tu-sitio/wp-json/wp/v2/media" `
     -WordpressAuthHeader "Basic TUAPPPASS"
   ```
3. **Validar en PostgreSQL**  
   ```powershell
   docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
   SELECT id, featured_image_url, featured_image_alt, updated_at
   FROM drafts
   ORDER BY updated_at DESC
   LIMIT 5;
   "
   ```
4. **Revisar registro en jobs_log**  
   ```powershell
   docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
   SELECT job_name, status, related_draft_id, duration_ms, output_data->>'wordpress_media_id' AS media_id, created_at
   FROM jobs_log
   WHERE job_name = 'SEO - 12 Generacion de Imagenes'
   ORDER BY created_at DESC
   LIMIT 5;
   "
   ```
5. **Verificar medio en WordPress** (REST API o dashboard) asegurando `source_url` correcto y alt text si aplica.

## Evidencias recomendadas
- Captura de la ejecución OK del workflow en n8n (`Executions`).
- JSON de respuesta de `test_workflow12.ps1` mostrando `image_url`, `media_id` y `job_log_id`.
- Consulta SQL que muestre el draft con `featured_image_url` y `featured_image_prompt`.
- Registro en `jobs_log` con `job_type = 'image_generation'` y `output_data.wordpress_media_id`.
- Confirmación en WordPress del medio creado (URL accesible + metadatos).
