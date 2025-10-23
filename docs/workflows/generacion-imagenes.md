# Workflow 12 - Generación de Imágenes

Convierte drafts con redacción investigada en prompts visuales, genera una imagen con Gemini y la publica en WordPress como medio destacado.

## Requisitos

- Credenciales **OpenAI** configuradas en n8n (se reutiliza para el prompt visual).
- Variable `GEMINI_API_KEY` disponible (n8n > Variables) o enviada en el body.
- Endpoint de medios de WordPress (`https://tu-sitio/wp-json/wp/v2/media`).
- Autenticación WordPress disponible (Application Password, Basic Auth o header `Authorization`/`X-WP-Nonce`).
- Drafts en la tabla `drafts` sin `featured_image_url` (workflow 11 ya ejecutado).

## Entradas (Webhook)

`POST /webhook/seo/imagenes/generar`

```json
{
  "limit": 1,
  "draft_id": "opcional",
  "force": false,
  "wordpress_endpoint": "https://tu-sitio/wp-json/wp/v2/media",
  "wordpress_auth_header": "Basic ...",
  "wordpress_nonce": "opcional",
  "wordpress_title": "opcional",
  "gemini_model": "gemini-1.5-flash-latest",
  "openai_model": "gpt-4o-mini"
}
```

- `force = true` permite regenerar aunque exista `featured_image_url`.
- Si no se envían credenciales se intentan las variables `WORDPRESS_MEDIA_ENDPOINT`, `WORDPRESS_AUTH_HEADER` y `WORDPRESS_NONCE`.

## Flujo de nodos

1. **Webhook**: recibe parámetros de ejecución.
2. **Seleccionar Drafts Imagen** (Postgres): busca drafts pendientes.
3. **Preparar Contexto Imagen** (Code): normaliza texto, keywords y construye el prompt.
4. **Generar Prompt Visual** (HTTP → OpenAI): crea prompt EN + alt_text ES.
5. **Generar Imagen Gemini** (HTTP → Gemini): obtiene imagen base64.
6. **Subir Imagen WordPress** (HTTP): envía la imagen al endpoint `/media` de WordPress.
7. **Actualizar Draft Imagen** (Postgres): persiste `featured_image_url`, alt y prompt en `drafts`.
8. **Insertar Job Log**: registra la ejecución como `image_generation`.
9. **Aggregate Resultados**: prepara respuesta JSON consolidada.

## Salida

```json
{
  "status": "success",
  "total_drafts_processed": 1,
  "drafts": [
    {
      "draft_id": "uuid",
      "idea_id": "uuid",
      "media_id": 1234,
      "image_url": "https://...",
      "alt_text": "...",
      "visual_prompt": "...",
      "job_log_id": "uuid",
      "wordpress_media_url": "https://..."
    }
  ],
  "generated_at": "2025-10-22T04:45:00Z"
}
```

En caso de no encontrar drafts devuelve `status = info` y un mensaje.

## Errores comunes

- `Gemini no devolvió imagen en base64`: revisar `GEMINI_API_KEY` y modelo.
- `WordPress no devolvió source_url`: revisar endpoint, permisos o autenticación.
- `401/403`: credenciales o nonce inválidos en WordPress.
- `Workflow 12 requiere`: confirmar que el draft posee `content_markdown` y proviene del workflow 11.

## Pruebas rápidas

```powershell
cd seo-module/scripts
.	est_workflow12.ps1 -Limit 1 -VerboseBody `
  -WordpressEndpoint "https://tu-sitio/wp-json/wp/v2/media" `
  -WordpressAuthHeader "Basic TUAPPPASS"
```

Recomendado ejecutar antes de la prueba:

```powershell
.	est_workflow11.ps1 -Limit 1
```

## Datos en base de datos

- `drafts`: campos `featured_image_url`, `featured_image_alt`, `featured_image_prompt` actualizados.
- `jobs_log`: registro con `job_type = 'image_generation'`, `output_data.image_url`, `output_data.wordpress_media_id`, `duration_ms`.

## Próximos pasos

- Añadir actualización automática de `alt_text`/`caption` en WordPress si se requiere.
- Validar tamaño/ratio de imagen y registrar metadatos (`image_format`).
