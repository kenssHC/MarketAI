# 🎯 Implementación del Sistema de Publicación Programada

## ✅ FASE 1 COMPLETADA: Base de Datos

### 📦 Archivos Creados

1. **`n8n/migrations/003_add_scheduled_publications.sql`**
   - Nueva tabla `scheduled_publications`
   - Campos agregados a `drafts` para WordPress
   - Índices optimizados para consultas
   - Vista `v_upcoming_publications`
   - Triggers para `updated_at`

2. **`scripts/apply_migration_003.ps1`**
   - Script automatizado para aplicar la migración
   - Verifica Docker y PostgreSQL
   - Valida la creación de tablas

3. **`docs/publicacion-programada.md`**
   - Documentación completa del sistema
   - Arquitectura detallada
   - Ejemplos de API
   - Código de implementación

4. **`n8n/migrations/README.md`** (actualizado)
   - Documentación de la migración 003
   - Diagrama de relaciones actualizado
   - Queries de ejemplo

---

## 🚀 Cómo Aplicar la Migración

### Opción 1: Script Automatizado (Recomendado)

```powershell
cd seo-module/scripts
.\apply_migration_003.ps1
```

### Opción 2: Manual

```powershell
cd seo-module/n8n
docker-compose up -d
Get-Content ..\n8n\migrations\003_add_scheduled_publications.sql | docker-compose exec -T postgres psql -U marketai_user -d marketai_seo
```

### Verificar que se aplicó correctamente

```powershell
cd seo-module/n8n
docker-compose exec postgres psql -U marketai_user -d marketai_seo -c "\d scheduled_publications"
```

Deberías ver la estructura de la tabla con todos los campos.

---

## 📊 Qué se Creó en la Base de Datos

### Nueva Tabla: `scheduled_publications`

```sql
CREATE TABLE scheduled_publications (
    id UUID PRIMARY KEY,
    draft_id UUID NOT NULL REFERENCES drafts(id),
    
    -- Programación
    scheduled_date DATE NOT NULL,
    scheduled_time TIME DEFAULT '09:00:00',
    scheduled_datetime TIMESTAMP GENERATED ALWAYS AS (scheduled_date + scheduled_time) STORED,
    
    -- Estado
    status VARCHAR(50) DEFAULT 'pending',
    
    -- WordPress
    wordpress_post_id BIGINT,
    wordpress_post_url VARCHAR(500),
    wordpress_status VARCHAR(50),
    
    -- Tracking
    published_at TIMESTAMP,
    attempts INT DEFAULT 0,
    last_error TEXT,
    
    -- Metadata
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Campos Agregados a `drafts`

- `scheduled_publish_date` - Fecha/hora programada
- `wordpress_post_id` - ID del post en WordPress
- `wordpress_post_url` - URL completa del post
- `published_at` - Timestamp de publicación real
- `publish_attempts` - Contador de intentos
- `publish_last_error` - Último error registrado

### Vista Creada: `v_upcoming_publications`

Vista pre-construida que une `scheduled_publications` con `drafts` y `keywords` para mostrar publicaciones próximas con todos sus metadatos.

```sql
SELECT * FROM v_upcoming_publications;
```

---

## 📋 Próximos Pasos

### Fase 2: Workflow 14 - Publicación en WordPress

**Archivo a crear:** `n8n/workflows/SEO - 14 Publicacion en WordPress.json`

**Estructura del workflow:**

```
Webhook (recibe draft_id)
    ↓
Obtener Draft Completo (PostgreSQL)
    ↓
Validar Datos (Code)
    ↓
Preparar Payload WordPress (Code)
    ↓
Publicar en WordPress (HTTP Request)
    ↓
Actualizar Draft (PostgreSQL)
    ↓
Actualizar Scheduled Publications (PostgreSQL)
    ↓
Registrar Job Log (PostgreSQL)
    ↓
Preparar Respuesta (Code)
```

**Endpoint:** `/webhook/seo/publicar`

**Entrada:**
```json
{
  "draft_id": "uuid-del-draft",
  "force": false
}
```

**Salida:**
```json
{
  "status": "success",
  "wordpress_post_id": 12345,
  "wordpress_post_url": "https://larabs.pe/articulo",
  "published_at": "2025-11-01T09:00:35Z"
}
```

---

### Fase 3: Backend API Endpoints

**Archivo a modificar:** `approval-ui/server/routes/drafts.js`

#### Endpoints a agregar:

1. **POST /api/drafts/:id/schedule**
   - Programa una publicación
   - Crea registro en `scheduled_publications`

2. **POST /api/drafts/:id/publish-now**
   - Publica inmediatamente
   - Llama a Workflow 14

3. **GET /api/drafts/scheduled**
   - Lista publicaciones programadas
   - Filtros: status, date_from, date_to

4. **DELETE /api/drafts/schedule/:schedule_id**
   - Cancela una publicación programada
   - Marca como 'cancelled'

---

### Fase 4: Scheduler Service (Cron Job)

**Archivo a crear:** `approval-ui/server/services/scheduler.js`

**Función principal:**
```javascript
export async function checkAndPublishScheduled() {
  // 1. Buscar publicaciones con scheduled_datetime <= NOW()
  // 2. Para cada una, llamar a Workflow 14
  // 3. Actualizar status según resultado
  // 4. Registrar errores para reintentos
}

export function startScheduler() {
  setInterval(checkAndPublishScheduled, 60000); // Cada 1 minuto
}
```

**Modificar:** `approval-ui/server/index.js`
```javascript
import { startScheduler } from './services/scheduler.js';

app.listen(port, () => {
  console.log(`API running on port ${port}`);
  startScheduler(); // ← Agregar esta línea
});
```

---

### Fase 5: Frontend (UI de Programación)

**Archivo a modificar:** `approval-ui/client/src/App.jsx`

#### Componentes a agregar:

1. **Sección de Programación en Editor**
   - Input de fecha
   - Input de hora
   - Botón "Aprobar y Programar"
   - Botón "Publicar Ahora"

2. **Dashboard de Calendario**
   - Vista mensual
   - Marcadores por día
   - Lista de publicaciones programadas
   - Estados visuales (pending, published, failed)

3. **Lista de Publicaciones Programadas**
   - Tabla con filtros
   - Acciones: Ver, Editar fecha, Cancelar
   - Indicadores de estado

---

## 📝 Checklist de Implementación

### ✅ Fase 1: Base de Datos (COMPLETADA)
- [x] Crear migración 003
- [x] Tabla `scheduled_publications`
- [x] Campos en `drafts`
- [x] Índices optimizados
- [x] Vista `v_upcoming_publications`
- [x] Script de aplicación
- [x] Documentación completa

### ⏳ Fase 2: Workflow 14 (SIGUIENTE)
- [ ] Crear workflow en n8n
- [ ] Nodo: Webhook
- [ ] Nodo: Obtener draft de BD
- [ ] Nodo: Validar datos
- [ ] Nodo: Preparar payload WordPress
- [ ] Nodo: HTTP Request a WordPress
- [ ] Nodo: Actualizar draft en BD
- [ ] Nodo: Actualizar scheduled_publications
- [ ] Nodo: Registrar en jobs_log
- [ ] Nodo: Preparar respuesta
- [ ] Probar manualmente

### ⏳ Fase 3: Backend Endpoints
- [ ] Endpoint: POST /drafts/:id/schedule
- [ ] Endpoint: POST /drafts/:id/publish-now
- [ ] Endpoint: GET /drafts/scheduled
- [ ] Endpoint: DELETE /drafts/schedule/:id
- [ ] Validaciones de datos
- [ ] Manejo de errores

### ⏳ Fase 4: Scheduler Service
- [ ] Crear scheduler.js
- [ ] Función checkAndPublishScheduled()
- [ ] Integrar en server/index.js
- [ ] Logs detallados
- [ ] Reintentos automáticos

### ⏳ Fase 5: Frontend
- [ ] Componente de programación
- [ ] Dashboard de calendario
- [ ] Lista de publicaciones
- [ ] Feedback visual
- [ ] Manejo de errores
- [ ] Estados de carga

### ⏳ Fase 6: Testing
- [ ] Test unitarios
- [ ] Test de integración
- [ ] Test E2E completo
- [ ] Test de reintentos
- [ ] Test de cancelación

---

## 🧪 Cómo Probar (Una vez completadas todas las fases)

### 1. Programar una publicación de prueba

```powershell
# En tu navegador, ve a:
http://localhost:5173

# 1. Ve a un draft aprobado
# 2. Selecciona fecha futura (ej: mañana)
# 3. Selecciona hora (ej: 10:00)
# 4. Click "Aprobar y Programar"
```

### 2. Verificar en BD

```sql
SELECT * FROM v_upcoming_publications;
```

### 3. Simular ejecución del scheduler

```sql
-- Cambiar la fecha para que sea "ahora"
UPDATE scheduled_publications
SET scheduled_datetime = NOW() - INTERVAL '1 minute'
WHERE status = 'pending'
LIMIT 1;

-- Esperar 1 minuto y verificar
SELECT * FROM scheduled_publications WHERE status = 'published';
```

### 4. Ver el post en WordPress

```
https://larabs.pe/wp-admin/edit.php
```

---

## 🎯 Objetivo Final

Al completar todas las fases, tendrás un sistema que:

✅ Aprueba artículos con fecha futura de publicación  
✅ Guarda la programación en la BD  
✅ Revisa cada minuto si hay publicaciones pendientes  
✅ Publica automáticamente en WordPress  
✅ Actualiza el estado en la BD  
✅ Muestra un calendario visual  
✅ Permite cancelar o reprogramar  
✅ Reintenta automáticamente si hay fallos  

---

## 📚 Documentación Relacionada

- **[Publicación Programada - Guía Completa](publicacion-programada.md)**
- **[Workflows Overview](workflows/overview.md)**
- **[Base de Datos - Migraciones](../n8n/migrations/README.md)**
- **[Approval UI](approval-ui.md)**

---

## 🆘 Problemas Comunes

### La migración no se aplica

```powershell
# Verificar que PostgreSQL está corriendo
docker ps | Select-String postgres

# Ver logs
docker-compose logs postgres
```

### No puedo ver la tabla

```powershell
# Conectarse a la BD
docker-compose exec postgres psql -U marketai_user -d marketai_seo

# Listar tablas
\dt
```

### Errores de permisos

```sql
-- Verificar permisos del usuario
\du marketai_user

-- Si es necesario, otorgar permisos
GRANT ALL ON ALL TABLES IN SCHEMA public TO marketai_user;
```

---

**Estado actual:** ✅ Fase 1 completada  
**Siguiente paso:** Crear Workflow 14 en n8n  
**Tiempo estimado restante:** 6-8 horas

---

**Última actualización:** 27 Octubre 2025

