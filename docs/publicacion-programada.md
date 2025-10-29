# 📅 Sistema de Publicación Programada

Sistema completo para programar y publicar automáticamente artículos en WordPress en fechas y horas específicas.

---

## 📋 Visión General

El sistema de publicación programada permite:

✅ **Aprobar artículos** con fecha de publicación futura  
✅ **Programar múltiples publicaciones** al día  
✅ **Publicar automáticamente** sin intervención manual  
✅ **Reintentos automáticos** en caso de fallo  
✅ **Dashboard visual** con calendario de publicaciones  
✅ **Integración completa** con WordPress REST API  

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      FLUJO COMPLETO                          │
└─────────────────────────────────────────────────────────────┘

1. Usuario aprueba draft + selecciona fecha
   ↓
2. Se crea registro en scheduled_publications
   ↓
3. Scheduler Service revisa cada minuto
   ↓
4. ¿Es hora de publicar? → Llama a Workflow 14
   ↓
5. Workflow 14 publica en WordPress
   ↓
6. Actualiza status → "published"
   ↓
7. Usuario ve en dashboard: ✅ Publicado
```

---

## 🗄️ Estructura de Base de Datos

### Tabla: `scheduled_publications`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `draft_id` | UUID | Referencia al draft aprobado |
| `scheduled_date` | DATE | Fecha de publicación |
| `scheduled_time` | TIME | Hora de publicación (default: 09:00) |
| `scheduled_datetime` | TIMESTAMP | Columna computada (date + time) |
| `status` | VARCHAR | pending, published, failed, cancelled |
| `wordpress_post_id` | BIGINT | ID del post en WordPress |
| `wordpress_post_url` | VARCHAR | URL del post publicado |
| `published_at` | TIMESTAMP | Cuándo se publicó realmente |
| `attempts` | INT | Intentos de publicación |
| `last_error` | TEXT | Último error (si aplica) |
| `created_by` | VARCHAR | Usuario que programó |

### Campos agregados a `drafts`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `scheduled_publish_date` | TIMESTAMP | Fecha/hora programada |
| `wordpress_post_id` | BIGINT | ID del post en WordPress |
| `wordpress_post_url` | VARCHAR | URL completa del post |
| `published_at` | TIMESTAMP | Cuándo se publicó |
| `publish_attempts` | INT | Intentos fallidos |
| `publish_last_error` | TEXT | Último error |

---

## 🔌 API Endpoints

### 1. Programar Publicación

```http
POST /api/drafts/:id/schedule
Content-Type: application/json

{
  "scheduled_date": "2025-11-01",
  "scheduled_time": "09:00:00",
  "created_by": "editor@example.com"
}
```

**Respuesta:**
```json
{
  "message": "Publicación programada",
  "scheduled_date": "2025-11-01",
  "scheduled_time": "09:00:00",
  "scheduled_datetime": "2025-11-01T09:00:00Z"
}
```

---

### 2. Publicar Inmediatamente

```http
POST /api/drafts/:id/publish-now
```

**Respuesta:**
```json
{
  "message": "Publicado exitosamente",
  "wordpress_post_id": 12345,
  "wordpress_post_url": "https://larabs.pe/articulo-ejemplo"
}
```

---

### 3. Obtener Publicaciones Programadas

```http
GET /api/drafts/scheduled?status=pending&date_from=2025-11-01&date_to=2025-11-30
```

**Respuesta:**
```json
{
  "total": 15,
  "scheduled": [
    {
      "id": "uuid",
      "draft_id": "uuid",
      "title": "Cómo usar IA en marketing",
      "scheduled_date": "2025-11-01",
      "scheduled_time": "09:00:00",
      "status": "pending",
      "featured_image_url": "https://..."
    }
  ]
}
```

---

### 4. Cancelar Publicación Programada

```http
DELETE /api/drafts/schedule/:schedule_id
Content-Type: application/json

{
  "reason": "Contenido desactualizado",
  "cancelled_by": "editor@example.com"
}
```

---

## 🔄 Workflow 14: Publicar en WordPress

### Entrada (Webhook)

```http
POST /webhook/seo/publicar
Content-Type: application/json

{
  "draft_id": "uuid-del-draft",
  "force": false
}
```

### Nodos del Workflow

1. **Webhook** - Recibe draft_id
2. **Obtener Draft Completo** (PostgreSQL)
   - Query: `SELECT * FROM drafts WHERE id = $draft_id`
3. **Validar Datos** (Code)
   - Verifica que tenga título, contenido, imagen
4. **Preparar Payload WordPress** (Code)
   - Construye objeto POST completo
5. **Publicar en WordPress** (HTTP Request)
   - `POST /wp-json/wp/v2/posts`
6. **Actualizar Draft** (PostgreSQL)
   - Guarda `wordpress_post_id`, `published_at`
7. **Actualizar Scheduled Publications** (PostgreSQL)
   - Cambia status a 'published'
8. **Registrar en Jobs Log** (PostgreSQL)
   - Guarda ejecución
9. **Preparar Respuesta** (Code)
   - Devuelve resultado

### Payload WordPress

```json
{
  "title": "Título del artículo",
  "content": "<p>Contenido HTML completo...</p>",
  "excerpt": "Meta description del artículo",
  "status": "publish",
  "featured_media": 12345,
  "categories": [1],
  "tags": [5, 8, 12],
  "meta": {
    "_yoast_wpseo_title": "Título SEO optimizado",
    "_yoast_wpseo_metadesc": "Meta description SEO"
  }
}
```

### Salida

```json
{
  "status": "success",
  "draft_id": "uuid",
  "wordpress_post_id": 12345,
  "wordpress_post_url": "https://larabs.pe/articulo",
  "published_at": "2025-11-01T09:00:35Z"
}
```

---

## ⏰ Scheduler Service (Cron Job)

### Implementación Node.js

**Archivo:** `approval-ui/server/services/scheduler.js`

```javascript
import { query } from '../db.js';
import callN8nWebhook from './n8n.js';

export async function checkAndPublishScheduled() {
  console.log('[scheduler] Revisando publicaciones programadas...');
  
  try {
    // Obtener publicaciones listas para publicar
    const result = await query(`
      SELECT sp.*, d.title
      FROM scheduled_publications sp
      JOIN drafts d ON d.id = sp.draft_id
      WHERE sp.status = 'pending'
        AND sp.scheduled_datetime <= NOW()
      ORDER BY sp.scheduled_datetime ASC
      LIMIT 10
    `);

    console.log(`[scheduler] Encontradas ${result.rowCount} publicaciones`);

    for (const pub of result.rows) {
      try {
        console.log(`[scheduler] Publicando: ${pub.title}`);
        
        // Actualizar intento
        await query(
          `UPDATE scheduled_publications 
           SET attempts = attempts + 1, last_attempt_at = NOW() 
           WHERE id = $1`,
          [pub.id]
        );

        // Llamar al workflow 14
        const wpResponse = await callN8nWebhook('seo/publicar', {
          draft_id: pub.draft_id
        });

        // Marcar como publicado
        await query(
          `UPDATE scheduled_publications 
           SET status = 'published', 
               published_at = NOW(),
               wordpress_post_id = $1,
               wordpress_post_url = $2
           WHERE id = $3`,
          [
            wpResponse.wordpress_post_id,
            wpResponse.wordpress_post_url,
            pub.id
          ]
        );

        console.log(`[scheduler] ✅ Publicado: ${pub.title}`);
        
      } catch (error) {
        console.error(`[scheduler] ❌ Error al publicar ${pub.title}:`, error);
        
        // Registrar error (si menos de 3 intentos, se reintentará)
        await query(
          `UPDATE scheduled_publications 
           SET last_error = $1,
               status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'pending' END
           WHERE id = $2`,
          [error.message, pub.id]
        );
      }
    }
    
  } catch (error) {
    console.error('[scheduler] Error general:', error);
  }
}

// Ejecutar cada 1 minuto
export function startScheduler() {
  console.log('[scheduler] Iniciando servicio de publicación programada');
  setInterval(checkAndPublishScheduled, 60000);
  
  // Ejecutar una vez al inicio
  checkAndPublishScheduled();
}
```

### Integrar en el servidor

**Archivo:** `approval-ui/server/index.js`

```javascript
import { startScheduler } from './services/scheduler.js';

// ... resto del código ...

app.listen(config.apiPort, () => {
  console.log(`API running on http://localhost:${config.apiPort}`);
  
  // Iniciar el scheduler
  startScheduler();
});
```

---

## 🎨 UI de Programación

### En la pantalla de Editar Artículo

```jsx
// Sección de programación
<div className="publish-scheduler">
  <h3>📅 Programar Publicación</h3>
  
  <div className="scheduler-grid">
    <div className="form-group">
      <label htmlFor="publish-date">Fecha de publicación</label>
      <input 
        id="publish-date"
        type="date" 
        value={publishDate}
        onChange={(e) => setPublishDate(e.target.value)}
        min={new Date().toISOString().split('T')[0]}
      />
    </div>
    
    <div className="form-group">
      <label htmlFor="publish-time">Hora</label>
      <input 
        id="publish-time"
        type="time" 
        value={publishTime}
        onChange={(e) => setPublishTime(e.target.value)}
      />
    </div>
  </div>

  {publishDate && (
    <p className="info-text">
      📌 Este artículo se publicará el {formatDate(publishDate)} a las {publishTime}
    </p>
  )}
  
  <div className="button-group">
    <button 
      className="btn btn--primary"
      onClick={handleScheduleAndApprove}
      disabled={!publishDate}
    >
      Aprobar y Programar
    </button>
    
    <button 
      className="btn btn--secondary"
      onClick={handlePublishNow}
    >
      Publicar Ahora
    </button>
  </div>
</div>
```

### Dashboard de Calendario

```jsx
function CalendarView() {
  const [scheduled, setScheduled] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchScheduledPublications();
  }, [currentMonth]);

  return (
    <div className="calendar-dashboard">
      <header className="calendar-header">
        <h2>📅 Calendario de Publicaciones</h2>
        <div className="calendar-controls">
          <button onClick={prevMonth}>← Anterior</button>
          <span>{formatMonth(currentMonth)}</span>
          <button onClick={nextMonth}>Siguiente →</button>
        </div>
      </header>
      
      <div className="calendar-grid">
        {/* Renderizar días del mes */}
        {daysInMonth.map(day => (
          <div key={day} className="calendar-day">
            <span className="day-number">{day}</span>
            {getPublicationsForDay(day).map(pub => (
              <div key={pub.id} className="calendar-item">
                <div className="calendar-item__time">{pub.scheduled_time}</div>
                <div className="calendar-item__title">{pub.title}</div>
                <span className={`status status--${pub.status}`}>
                  {pub.status}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## ✅ Checklist de Implementación

### Fase 1: Base de Datos ✅
- [x] Crear migración 003
- [x] Agregar tabla `scheduled_publications`
- [x] Agregar campos a `drafts`
- [x] Crear índices optimizados
- [x] Crear vista `v_upcoming_publications`

### Fase 2: Workflow 14 (Siguiente)
- [ ] Crear workflow en n8n
- [ ] Configurar nodos de publicación
- [ ] Integrar con WordPress REST API
- [ ] Manejar errores y reintentos
- [ ] Probar publicación manual

### Fase 3: Backend
- [ ] Endpoint `POST /drafts/:id/schedule`
- [ ] Endpoint `POST /drafts/:id/publish-now`
- [ ] Endpoint `GET /drafts/scheduled`
- [ ] Endpoint `DELETE /drafts/schedule/:id`
- [ ] Servicio scheduler (cron job)

### Fase 4: Frontend
- [ ] Componente de programación en editor
- [ ] Dashboard de calendario
- [ ] Vista de publicaciones programadas
- [ ] Botón "Publicar ahora"
- [ ] Feedback visual de estados

### Fase 5: Testing
- [ ] Test E2E de programación
- [ ] Test de publicación inmediata
- [ ] Test de reintentos
- [ ] Test de cancelación

---

## 🧪 Cómo Probar

### 1. Aplicar la migración

```powershell
cd seo-module/scripts
.\apply_migration_003.ps1
```

### 2. Verificar tablas creadas

```sql
-- Ver estructura
\d scheduled_publications

-- Ver vista
SELECT * FROM v_upcoming_publications;
```

### 3. Crear publicación de prueba

```sql
INSERT INTO scheduled_publications (
  draft_id, 
  scheduled_date, 
  scheduled_time, 
  created_by
) VALUES (
  'uuid-de-un-draft-aprobado',
  CURRENT_DATE + INTERVAL '1 day',
  '10:00:00',
  'test@example.com'
);
```

### 4. Simular el scheduler

```sql
-- Ver qué se publicaría ahora
SELECT * FROM scheduled_publications
WHERE status = 'pending'
  AND scheduled_datetime <= NOW();
```

---

## 🚨 Manejo de Errores

### Reintentos Automáticos

El sistema reintenta hasta 3 veces antes de marcar como `failed`:

```javascript
if (pub.attempts >= 3) {
  // Marcar como fallido
  status = 'failed';
} else {
  // Reintentar en el próximo ciclo
  status = 'pending';
}
```

### Notificaciones de Fallos

```javascript
if (pub.status === 'failed') {
  // Enviar email al admin
  await sendAlertEmail({
    subject: 'Fallo en publicación programada',
    body: `El artículo "${pub.title}" no pudo publicarse después de 3 intentos.`
  });
}
```

---

## 📊 Monitoreo

### Query para ver estado del sistema

```sql
SELECT 
  status,
  COUNT(*) as total,
  MIN(scheduled_datetime) as proxima_publicacion
FROM scheduled_publications
WHERE scheduled_date >= CURRENT_DATE
GROUP BY status;
```

### Dashboard de métricas

```sql
-- Publicaciones por día (próximos 30 días)
SELECT 
  scheduled_date,
  COUNT(*) as total,
  STRING_AGG(SUBSTRING(d.title, 1, 30), ', ') as articulos
FROM scheduled_publications sp
JOIN drafts d ON d.id = sp.draft_id
WHERE sp.scheduled_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
  AND sp.status = 'pending'
GROUP BY sp.scheduled_date
ORDER BY sp.scheduled_date;
```

---

## 🔗 Referencias

- [WordPress REST API - Posts](https://developer.wordpress.org/rest-api/reference/posts/)
- [PostgreSQL Generated Columns](https://www.postgresql.org/docs/current/ddl-generated-columns.html)
- [Node.js setInterval](https://nodejs.org/api/timers.html#setintervalcallback-delay-args)

---

**Última actualización:** 27 Octubre 2025

