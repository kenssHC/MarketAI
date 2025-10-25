# Guía de Implementación: Sistema de Preview de Imágenes

## 📋 Resumen de Cambios

Se implementó un sistema de preview de imágenes que permite:
1. Generar y visualizar imágenes **antes** de subirlas a WordPress
2. Aprobar drafts y subir automáticamente la imagen de preview a WordPress
3. Reutilizar la imagen generada sin regenerarla al aprobar

---

## 📦 Archivos Modificados

### 1. Workflow n8n
**Archivo:** `seo-module/n8n/workflows/SEO - 12 Generacion de Imagenes.json`
- **Cambio:** Nodo "Convertir Imagen a Binario1" ahora incluye campos de preview

### 2. API Server
**Archivo:** `seo-module/approval-ui/server/routes/drafts.js`
- **Cambios:**
  - Endpoint `POST /api/drafts/:id/image` modificado
  - Endpoint `POST /api/drafts/:id/approve` modificado

### 3. Documentación
**Nuevos archivos:**
- `seo-module/docs/CHANGELOG_IMAGEN_PREVIEW.md` (changelog detallado)
- `seo-module/scripts/test_image_preview_flow.ps1` (script de prueba)

---

## 🚀 Pasos de Implementación

### Paso 1: Actualizar el Workflow en n8n

1. Abre n8n en tu navegador: `http://localhost:5678`
2. Ve a la sección de Workflows
3. Localiza el workflow **"SEO - 12 Generacion de Imagenes"**
4. Importa el archivo modificado:
   - Clic en "..." (menú) → "Import from File"
   - Selecciona: `seo-module/n8n/workflows/SEO - 12 Generacion de Imagenes.json`
   - Confirma la importación (reemplazará el workflow actual)
5. Verifica que el workflow esté **Activo** (toggle en la esquina superior derecha)
6. Guarda los cambios

### Paso 2: Reiniciar el Servidor de Approval UI

#### Opción A: Usando PowerShell (Windows)
```powershell
cd seo-module/approval-ui
npm install  # Por si acaso
npm run dev  # O el comando que uses para iniciar el servidor
```

#### Opción B: Usando Docker (si aplica)
```bash
docker-compose restart approval-ui
```

### Paso 3: Verificar la Configuración

Asegúrate de que las siguientes variables de entorno estén configuradas en `approval-ui/server/config.js`:

```javascript
n8n: {
  baseUrl: 'http://localhost:5678/webhook',  // URL de tu n8n
  basicAuth: {
    user: process.env.N8N_AUTH_USER || '',
    password: process.env.N8N_AUTH_PASSWORD || ''
  }
}
```

---

## 🧪 Testing

### Test Manual desde la UI

1. Abre la UI: `http://localhost:3001`
2. Navega a un draft que tenga contenido pero sin imagen
3. Haz clic en **"Generar imagen"**
4. Verifica que:
   - Se muestre un spinner mientras genera
   - La imagen aparezca en la sección "Imagen principal"
   - Debajo diga: "Preview temporal. La imagen se subirá a WordPress cuando apruebes el artículo."
5. Haz clic en **"Aprobar"**
6. Verifica que:
   - El draft cambie a estado "approved"
   - La imagen se haya subido a WordPress (si está configurado)

### Test Automatizado con PowerShell

```powershell
cd seo-module/scripts

# Reemplaza <draft-uuid> con un ID de draft real
.\test_image_preview_flow.ps1 -DraftId "<draft-uuid>"
```

El script:
1. ✅ Consulta el draft
2. ✅ Genera preview de imagen
3. ✅ Verifica que la BD no se haya modificado
4. ⚠️ Opcionalmente aprueba el draft (te preguntará antes)

### Test con Postman/cURL

#### 1. Generar Preview
```bash
POST http://localhost:3001/api/drafts/{draft_id}/image
Content-Type: application/json

{}
```

**Respuesta esperada:**
```json
{
  "message": "Preview de imagen generada",
  "draft": {
    "id": "...",
    "featured_image_url": null,  // ← No se modifica
    ...
  },
  "preview": {
    "imageDataUrl": "data:image/png;base64,...",  // ← Data URL completo
    "base64": "...",  // ← Base64 puro
    "format": "png",
    "altText": "Texto alternativo de la imagen",
    "visualPrompt": "A modern illustration showing..."
  }
}
```

#### 2. Aprobar con Preview
```bash
POST http://localhost:3001/api/drafts/{draft_id}/approve
Content-Type: application/json

{
  "reviewer": "editor",
  "previewImage": {
    "base64": "...",  // ← Copiar de la respuesta anterior
    "format": "png",
    "altText": "...",
    "visualPrompt": "..."
  }
}
```

---

## 🔍 Troubleshooting

### Problema: "El workflow no devolvió datos de imagen"

**Causa:** El workflow no está devolviendo la estructura esperada.

**Solución:**
1. Verifica que el workflow esté **activo** en n8n
2. Revisa los logs del workflow en n8n (pestaña "Executions")
3. Verifica que el nodo "Convertir Imagen a Binario1" tenga el código actualizado

### Problema: La imagen no se muestra en la UI

**Causa 1:** El servidor no está devolviendo `response.preview.imageDataUrl`

**Solución:**
```bash
# Verifica la respuesta del endpoint en la consola del navegador
# Debería mostrar el objeto preview completo
```

**Causa 2:** El workflow está subiendo a WordPress cuando no debería

**Solución:**
Verifica que el endpoint esté enviando `upload_to_wordpress: false`:
```javascript
// En drafts.js, línea ~360
upload_to_wordpress: false  // ← Debe estar presente
```

### Problema: Al aprobar, la imagen no se sube a WordPress

**Causa:** Falta configuración de WordPress o credenciales.

**Solución:**
1. Verifica las variables de entorno:
   ```bash
   WORDPRESS_MEDIA_ENDPOINT=https://tu-sitio.com/wp-json/wp/v2/media
   WORDPRESS_AUTH_HEADER=Bearer tu-token
   ```
2. O pasa las credenciales en el body de aprobación:
   ```json
   {
     "reviewer": "editor",
     "previewImage": { ... },
     "wordpress_endpoint": "...",
     "wordpress_auth_header": "..."
   }
   ```

### Problema: Error de CORS

**Causa:** n8n no permite requests desde el servidor de approval-ui.

**Solución:**
```bash
# En n8n/docker-compose.yml
environment:
  - N8N_CORS_ENABLED=true
  - N8N_CORS_ORIGIN=http://localhost:3001
```

---

## 📊 Logs y Debugging

### Logs del Servidor (approval-ui)
```powershell
# Windows PowerShell
cd seo-module/approval-ui
npm run dev

# Busca líneas como:
[api] imagen subida a WordPress durante aprobación { ... }
[api] failed to generate image { ... }
```

### Logs del Workflow (n8n)
1. Abre n8n: `http://localhost:5678`
2. Ve a "Executions" en el sidebar
3. Haz clic en la ejecución más reciente
4. Revisa cada nodo para ver los datos que pasan

**Nodos clave:**
- **Preparar Contexto Imagen1**: Verifica `upload_to_wordpress: false`
- **Convertir Imagen a Binario1**: Verifica que tenga `image_base64`, `preview_image_data_url`
- **Preparar Respuesta Final1**: Verifica el array `drafts[0].preview_image_data_url`

---

## ✅ Checklist de Implementación

- [ ] Workflow actualizado en n8n
- [ ] Workflow está activo
- [ ] Servidor de approval-ui reiniciado
- [ ] Variables de entorno configuradas
- [ ] Test manual desde UI exitoso
- [ ] Preview se muestra correctamente
- [ ] Al aprobar, imagen se sube a WordPress (si aplica)
- [ ] BD se actualiza con la URL de WordPress

---

## 📞 Contacto y Soporte

Si encuentras problemas:
1. Revisa los logs del servidor y workflow
2. Verifica los ejemplos en `CHANGELOG_IMAGEN_PREVIEW.md`
3. Ejecuta el script de test: `test_image_preview_flow.ps1`
4. Revisa la sección de Troubleshooting arriba

---

## 🎯 Próximos Pasos (Opcional)

Posibles mejoras futuras:
- [ ] Agregar soporte para múltiples formatos de imagen (JPEG, WEBP)
- [ ] Permitir editar el prompt visual antes de regenerar
- [ ] Historial de imágenes generadas por draft
- [ ] Optimización de tamaño de imágenes antes de subir
- [ ] Soporte para imágenes locales (upload manual)

