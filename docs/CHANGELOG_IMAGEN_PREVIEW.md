# Changelog: Sistema de Preview de Imágenes

## Fecha: 2025-10-25

## Resumen
Se implementó un sistema de preview de imágenes para el workflow de generación de imágenes, permitiendo visualizar la imagen antes de subirla a WordPress.

## Cambios Realizados

### 1. Workflow: SEO - 12 Generacion de Imagenes

#### Nodo: "Convertir Imagen a Binario1"
**Cambio:** Se agregaron campos de preview en la respuesta del nodo.

**Antes:**
```javascript
return [{
  json: { ...$json, image_file_name: fileName, image_format: 'png' },
  binary: { data: { data: Buffer.from(imgB64, 'base64') } }
}];
```

**Después:**
```javascript
return [{
  json: {
    ...$json,
    image_file_name: fileName,
    image_format: extension,
    image_base64: imgB64,
    preview_image_data_url: `data:image/${extension};base64,${imgB64}`,
    preview_image_base64: imgB64
  },
  binary: {
    data: {
      data: imgB64,
      mimeType: `image/${extension}`,
      fileName
    }
  }
}];
```

**Impacto:** Ahora el workflow devuelve los datos de preview que la UI necesita para mostrar la imagen.

---

### 2. API Server: routes/drafts.js

#### Endpoint: POST /api/drafts/:id/image
**Cambio:** Se modificó para enviar `upload_to_wordpress: false` y capturar la respuesta del workflow.

**Antes:**
- Solo llamaba al workflow sin parámetros específicos
- Consultaba la BD después
- Devolvía únicamente los datos de la BD

**Después:**
- Envía `upload_to_wordpress: false` al workflow
- Captura la respuesta completa del workflow
- Devuelve TANTO los datos de la BD COMO los datos de preview

**Código:**
```javascript
const workflowResponse = await callN8nWebhook('seo/imagenes/generar', {
  draft_id: id,
  limit: 1,
  force: true,
  upload_to_wordpress: false  // ← NUEVO
});

// Extraer preview de la respuesta
const firstDraft = workflowResponse.drafts?.[0];

res.json({
  message: 'Preview de imagen generada',
  draft: refreshed.rowCount ? refreshed.rows[0] : null,
  preview: {  // ← NUEVO
    imageDataUrl: firstDraft.preview_image_data_url || null,
    base64: firstDraft.preview_image_base64 || null,
    format: firstDraft.image_format || null,
    altText: firstDraft.alt_text || null,
    visualPrompt: firstDraft.visual_prompt || null
  }
});
```

**Impacto:** La UI ahora recibe los datos de preview y puede mostrar la imagen inmediatamente.

---

#### Endpoint: POST /api/drafts/:id/approve
**Cambio:** Se agregó lógica para subir la imagen de preview a WordPress al aprobar.

**Funcionalidad:**
- Si el draft tiene una imagen de preview (no subida a WordPress), al aprobar se:
  1. Llama al workflow con `upload_to_wordpress: true`
  2. Envía la imagen base64 existente
  3. El workflow sube la imagen a WordPress y actualiza la BD
  4. Continúa con la aprobación normal

**Código:**
```javascript
if (previewImage?.base64) {
  const workflowResponse = await callN8nWebhook('seo/imagenes/generar', {
    draft_id: req.params.id,
    limit: 1,
    force: true,
    upload_to_wordpress: true,  // ← Ahora sí sube a WordPress
    preview_image_base64: previewImage.base64,
    preview_image_format: previewImage.format || 'png',
    preview_alt_text: previewImage.altText || null,
    preview_visual_prompt: previewImage.visualPrompt || null
  });
}
```

**Impacto:** Las imágenes de preview se suben automáticamente a WordPress al aprobar el draft.

---

## Flujo Completo

### Generación de Preview (Botón "Generar imagen")
```
UI → POST /api/drafts/:id/image
     └─> Server
          ├─> Workflow 12 con upload_to_wordpress=false
          │    ├─> Genera imagen con IA
          │    ├─> NO actualiza BD
          │    └─> Devuelve preview_image_data_url + base64
          └─> Devuelve { draft, preview }
     └─> UI muestra imagen inmediatamente
```

### Aprobación con Upload (Botón "Aprobar")
```
UI → POST /api/drafts/:id/approve + previewImage
     └─> Server
          ├─> Si hay previewImage:
          │    └─> Workflow 12 con upload_to_wordpress=true
          │         ├─> Usa imagen base64 existente
          │         ├─> Sube a WordPress
          │         └─> Actualiza BD con URL de WordPress
          ├─> Marca draft como "approved" en BD
          └─> Devuelve éxito
```

---

## Archivos Modificados

1. `seo-module/n8n/workflows/SEO - 12 Generacion de Imagenes.json`
   - Nodo: "Convertir Imagen a Binario1"
   
2. `seo-module/approval-ui/server/routes/drafts.js`
   - Endpoint: POST `/api/drafts/:id/image`
   - Endpoint: POST `/api/drafts/:id/approve`

---

## Archivos NO Modificados (ya estaban preparados)

1. `seo-module/approval-ui/client/src/App.jsx`
   - Ya esperaba los campos `response.preview.*`
   
2. Workflow - Nodos ya preparados:
   - "Preparar Contexto Imagen1": Ya recoge `preview_image_base64`, etc.
   - "Usar Imagen Proporcionada": Ya maneja imágenes base64
   - "Finalizar Preview Imagen": Ya genera data URLs
   - "Preparar Respuesta Final1": Ya incluye campos de preview

---

## Testing Recomendado

### Test 1: Generar Preview
```bash
POST http://localhost:3001/api/drafts/{draft_id}/image
{}

# Verificar respuesta:
{
  "preview": {
    "imageDataUrl": "data:image/png;base64,...",
    "base64": "...",
    "format": "png",
    "altText": "...",
    "visualPrompt": "..."
  }
}
```

### Test 2: Aprobar con Preview
```bash
POST http://localhost:3001/api/drafts/{draft_id}/approve
{
  "reviewer": "editor",
  "previewImage": {
    "base64": "...",
    "format": "png",
    "altText": "...",
    "visualPrompt": "..."
  }
}

# Verificar:
# 1. Draft marcado como "approved"
# 2. featured_image_url actualizada en BD con URL de WordPress
```

---

## Notas Importantes

1. **El workflow ya estaba preparado** para manejar imágenes proporcionadas y el flag `upload_to_wordpress`.
2. **La UI ya estaba preparada** para mostrar previews, solo faltaba que el servidor devolviera los datos.
3. **Sin cambios en el esquema de BD**: Los datos de preview son temporales y no se persisten.
4. **Backward compatible**: Si no hay preview, el flujo funciona como antes.

---

## Criterios de Aceptación ✅

- [x] Al pulsar "Generar imagen", se llama al Workflow 12 con `upload_to_wordpress=false`
- [x] El workflow genera imagen y devuelve preview en base64
- [x] La UI muestra inmediatamente la imagen en "Imagen principal"
- [x] Al pulsar "Aprobar", se re-usa la imagen y se sube a WordPress
- [x] El workflow actualiza el draft con `image_url` y `wordpress_media_id`

