# ✅ FASE 2 COMPLETADA: Workflow 14 - Publicación WordPress

## 📦 Archivos Creados

1. **`n8n/workflows/SEO - 14 Publicacion WordPress.json`**
   - Workflow completo con 15 nodos
   - Endpoint: `/webhook/seo/publicar`
   - Integración completa con WordPress REST API

2. **`scripts/test_workflow14.ps1`**
   - Script de prueba para el workflow
   - Parámetros: `DraftId` (requerido), `WpStatus`, credenciales WP

---

## 🔄 Flujo del Workflow 14

```
1. Webhook → Recibe draft_id
2. Query BD → Obtiene draft completo (con idea y keywords)
3. IF → ¿Draft existe y está aprobado?
4. Validar → Verifica título, contenido, meta datos
5. Preparar Payload → Construye objeto POST para WordPress
6. HTTP POST → Publica en /wp-json/wp/v2/posts
7. Extraer Datos → Obtiene wordpress_post_id y URL
8. Update drafts → Guarda post_id, URL, published_at
9. Update scheduled_publications → Marca como 'published'
10. Preparar Job Log → Construye registro completo
11. Insert Job Log → Guarda en BD
12. Respuesta → Devuelve resultado JSON
```

---

## 🚀 Cómo Usar

### 1. Importar en n8n
- Ve a n8n → Import Workflow
- Selecciona: `n8n/workflows/SEO - 14 Publicacion WordPress.json`
- Activa el workflow

### 2. Probar el workflow

```powershell
cd seo-module/scripts

# Publicar un draft específico
.\test_workflow14.ps1 -DraftId "uuid-del-draft-aprobado"

# Con estado draft (no publicado)
.\test_workflow14.ps1 -DraftId "uuid" -WpStatus "draft"

# Con credenciales específicas
.\test_workflow14.ps1 -DraftId "uuid" `
  -WordpressEndpoint "https://larabs.pe/wp-json/wp/v2" `
  -WordpressAuthHeader "Basic dXNlcjpwYXNz"
```

### 3. Desde el backend (cuando esté implementado)

```javascript
const response = await callN8nWebhook('seo/publicar', {
  draft_id: 'uuid-del-draft'
});
```

---

## 📊 Respuesta del Workflow

### Éxito
```json
{
  "status": "success",
  "message": "Artículo publicado exitosamente en WordPress",
  "draft_id": "uuid",
  "wordpress_post_id": 12345,
  "wordpress_post_url": "https://larabs.pe/articulo",
  "wordpress_status": "publish",
  "published_at": "2025-10-27T10:30:00Z",
  "job_log_id": "uuid",
  "draft_title": "Título del artículo",
  "project_name": "Nombre del proyecto"
}
```

### Error (draft no encontrado)
```json
{
  "status": "error",
  "message": "Draft no encontrado o no está aprobado",
  "draft_id": "uuid"
}
```

---

## ✅ Características Implementadas

- ✅ Validación completa de datos obligatorios
- ✅ Publicación en WordPress con estado configurable (publish/draft)
- ✅ Soporte para featured_media (imagen destacada)
- ✅ Metadatos Yoast SEO (title, description)
- ✅ Tags automáticos
- ✅ Actualización de `drafts` con post_id y URL
- ✅ Actualización de `scheduled_publications` (si existe)
- ✅ Registro completo en `jobs_log`
- ✅ Manejo de errores robusto
- ✅ Respuesta JSON estructurada

---

## 🔗 Integración con WordPress

El workflow envía a WordPress:

```json
{
  "title": "Título del artículo",
  "content": "<p>Contenido HTML completo...</p>",
  "excerpt": "Meta description",
  "status": "publish",
  "featured_media": 12345,
  "tags": ["tag1", "tag2"],
  "meta": {
    "_yoast_wpseo_title": "Título SEO",
    "_yoast_wpseo_metadesc": "Meta descripción"
  }
}
```

---

## 📋 Próxima Fase

**Fase 3: Backend API Endpoints** (1-2 horas)

Archivos a modificar:
- `approval-ui/server/routes/drafts.js`

Endpoints a crear:
1. `POST /api/drafts/:id/schedule` - Programar publicación
2. `POST /api/drafts/:id/publish-now` - Publicar inmediatamente (llama a WF14)
3. `GET /api/drafts/scheduled` - Listar programadas
4. `DELETE /api/drafts/schedule/:id` - Cancelar programación

---

**Estado:** ✅ Fase 2 completada  
**Siguiente:** Fase 3 - Backend API Endpoints

