# ✅ Pruebas del Sistema de Publicación Programada

## 🎯 Fases Completadas

- ✅ **Fase 1:** Base de Datos
- ✅ **Fase 2:** Workflow 14 (n8n)
- ✅ **Fase 3:** Backend API Endpoints
- ✅ **Fase 4:** Scheduler Service
- ✅ **Fase 5:** Frontend UI

---

## 📋 Pasos para Probar

### 1. Aplicar Migración de Base de Datos

```powershell
cd seo-module/scripts
.\apply_migration_003.ps1
```

**Verificar:**
```powershell
cd ..\n8n
docker-compose exec postgres psql -U marketai_user -d marketai_seo -c "\d scheduled_publications"
```

---

### 2. Importar Workflow 14 en n8n

1. Ve a n8n: `http://localhost:5678`
2. Click en "+" → "Import from file"
3. Selecciona: `n8n/workflows/SEO - 14 Publicacion WordPress.json`
4. **Activa el workflow** (toggle verde)

---

### 3. Verificar Configuración de WordPress

Edita `seo-module/n8n/docker-compose.yml`:

```yaml
# Dentro del servicio n8n > environment:
- WORDPRESS_MEDIA_ENDPOINT=https://larabs.pe/wp-json/wp/v2/media
- WORDPRESS_AUTH_HEADER=Basic [tu-token-base64]
```

**Reiniciar n8n:**
```powershell
docker-compose restart n8n
```

---

### 4. Iniciar el Backend (con Scheduler)

```powershell
cd seo-module/approval-ui
npm install  # Si es primera vez
npm run dev
```

**Deberías ver:**
```
Approval API listening on http://localhost:3001
[scheduler] 🚀 Iniciando servicio de publicación programada
[scheduler] ⏰ Revisando cada 60 segundos
```

---

### 5. Iniciar el Frontend

**En otra terminal:**
```powershell
cd seo-module/approval-ui/client
npm install  # Si es primera vez
npm run dev
```

**Abrir:** `http://localhost:5173`

---

## 🧪 Casos de Prueba

### ✅ Caso 1: Publicar Inmediatamente

1. Ve a **Blog** → Editar un draft aprobado
2. Genera una imagen (botón "Generar Imagen")
3. Click **"🚀 Publicar Ahora"**
4. **Resultado esperado:**
   - Toast: "Publicado exitosamente: https://..."
   - Verificar en WordPress: `https://larabs.pe/wp-admin/edit.php`

---

### ✅ Caso 2: Programar Publicación

1. Edita un draft aprobado
2. Click **"📆 Programar Publicación"**
3. Selecciona:
   - **Fecha:** Mañana
   - **Hora:** 10:00
4. Click **"Confirmar Programación"**
5. **Resultado esperado:**
   - Toast: "Programado para YYYY-MM-DD 10:00"
   - Ve a pestaña **"Calendario"**
   - Deberías ver el artículo programado

---

### ✅ Caso 3: Ver Publicaciones Programadas

1. Ve a pestaña **"Calendario"**
2. **Resultado esperado:**
   - Lista de artículos programados
   - Fecha, hora, título, estado

---

### ✅ Caso 4: Scheduler Automático (Prueba Real)

**Opción A: Esperar (más lenta)**
1. Programa un artículo para dentro de 2 minutos
2. Espera 2 minutos
3. Verifica logs del backend
4. Verifica WordPress

**Opción B: Forzar (más rápida)**
```sql
-- Conectarse a BD
docker-compose exec postgres psql -U marketai_user -d marketai_seo

-- Cambiar fecha para que sea "ahora"
UPDATE scheduled_publications
SET scheduled_datetime = NOW() - INTERVAL '1 minute'
WHERE status = 'pending'
LIMIT 1;

-- Salir
\q
```

**Esperar 1 minuto y ver logs del backend:**
```
[scheduler] Encontradas 1 publicaciones para procesar
[scheduler] Publicando: Título del artículo...
[scheduler] ✅ Publicado: Título del artículo
```

---

### ✅ Caso 5: Probar Workflow 14 Directamente

```powershell
cd seo-module/scripts

# Reemplaza con un draft_id real y aprobado
.\test_workflow14.ps1 -DraftId "uuid-del-draft"
```

**Resultado esperado:**
```
✅ Estado: success
📝 Artículo Publicado:
  Título: ...
  WordPress Post ID: 12345
  URL: https://larabs.pe/articulo
```

---

## 🔍 Verificaciones

### Backend funcionando:
```powershell
curl http://localhost:3001/api/health
```
**Respuesta:** `{"status":"ok"}`

### Publicaciones programadas:
```powershell
curl http://localhost:3001/api/drafts/scheduled
```

### Workflow 14 activo:
1. Ve a n8n
2. Workflows
3. "SEO - 14 Publicacion WordPress" debe estar **Active**

---

## 🐛 Problemas Comunes

### Error: "Draft no encontrado"
→ El draft debe estar con `status = 'approved'`

### Error: "wordpress_auth_header falta"
→ Verifica `docker-compose.yml` y reinicia n8n

### Error: "No data supplied" (WordPress)
→ WordPress en modo "Coming Soon" - desactívalo

### Scheduler no ejecuta
→ Verifica logs del backend: `[scheduler]` debe aparecer

### Frontend no conecta
→ Verifica que backend esté en puerto 3001

---

## 📊 Base de Datos - Queries Útiles

```sql
-- Ver publicaciones programadas
SELECT * FROM v_upcoming_publications;

-- Ver todas las publicaciones
SELECT 
  sp.scheduled_date,
  sp.scheduled_time,
  sp.status,
  d.title
FROM scheduled_publications sp
JOIN drafts d ON d.id = sp.draft_id
ORDER BY sp.scheduled_datetime;

-- Ver drafts publicados
SELECT 
  id, 
  title, 
  wordpress_post_id, 
  wordpress_post_url, 
  published_at
FROM drafts
WHERE wordpress_post_id IS NOT NULL
ORDER BY published_at DESC;
```

---

## ✅ Checklist Final

- [ ] Migración 003 aplicada
- [ ] Workflow 14 importado y activo
- [ ] Variables WordPress en docker-compose.yml
- [ ] Backend corriendo (puerto 3001)
- [ ] Frontend corriendo (puerto 5173)
- [ ] Scheduler funcionando (ver logs)
- [ ] Probado "Publicar Ahora"
- [ ] Probado "Programar"
- [ ] Verificado en WordPress

---

**¡Listo para producción!** 🚀

