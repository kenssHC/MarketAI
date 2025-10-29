# ✅ FASE 1 COMPLETADA: Base de Datos para Publicación Programada

## 🎉 ¿Qué se ha hecho?

Se ha implementado **completamente la capa de base de datos** para el sistema de publicación programada automática de artículos en WordPress.

---

## 📦 Archivos Creados

### 1. Migración SQL
**Archivo:** `n8n/migrations/003_add_scheduled_publications.sql`

✅ Nueva tabla `scheduled_publications` (14 campos + constraints)  
✅ 6 campos nuevos en tabla `drafts` para WordPress  
✅ 5 índices optimizados para consultas rápidas  
✅ Vista `v_upcoming_publications` con JOIN automático  
✅ Trigger para actualizar `updated_at` automáticamente  

### 2. Script de Aplicación
**Archivo:** `scripts/apply_migration_003.ps1`

✅ Verifica Docker corriendo  
✅ Verifica PostgreSQL activo  
✅ Aplica la migración automáticamente  
✅ Valida que las tablas se crearon  
✅ Muestra la estructura de la nueva tabla  

### 3. Documentación Completa
**Archivos:**
- `docs/publicacion-programada.md` (Guía completa - 300+ líneas)
- `docs/IMPLEMENTACION_PUBLICACION_PROGRAMADA.md` (Roadmap detallado)
- `n8n/migrations/README.md` (Actualizado con migración 003)

✅ Arquitectura del sistema explicada  
✅ Diagramas de flujo  
✅ Ejemplos de código completos  
✅ Queries SQL útiles  
✅ Troubleshooting  

---

## 🗄️ Estructura de la Base de Datos

### Tabla Principal: `scheduled_publications`

```
┌───────────────────────┬──────────┬─────────────────────────────┐
│ Campo                 │ Tipo     │ Descripción                 │
├───────────────────────┼──────────┼─────────────────────────────┤
│ id                    │ UUID     │ PK                          │
│ draft_id              │ UUID     │ FK → drafts(id)             │
│ scheduled_date        │ DATE     │ Fecha de publicación        │
│ scheduled_time        │ TIME     │ Hora (default 09:00)        │
│ scheduled_datetime    │ TIMESTAMP│ Columna computada           │
│ status                │ VARCHAR  │ pending/published/failed    │
│ wordpress_post_id     │ BIGINT   │ ID en WordPress             │
│ wordpress_post_url    │ VARCHAR  │ URL del post                │
│ published_at          │ TIMESTAMP│ Cuándo se publicó           │
│ attempts              │ INT      │ Intentos de publicación     │
│ last_error            │ TEXT     │ Último error                │
│ created_by            │ VARCHAR  │ Usuario que programó        │
│ created_at            │ TIMESTAMP│ Timestamp creación          │
│ updated_at            │ TIMESTAMP│ Timestamp última actualiz.  │
└───────────────────────┴──────────┴─────────────────────────────┘
```

### Relaciones

```
drafts (1) ←─────→ (1) scheduled_publications

Un draft puede tener UNA programación de publicación
```

---

## 🚀 Cómo Aplicar la Migración

### Paso 1: Verifica que Docker esté corriendo

```powershell
docker ps
```

### Paso 2: Aplica la migración

```powershell
cd D:\Trabajo\Larabs - Novaly AI\MarketAi\seo-module\scripts
.\apply_migration_003.ps1
```

**Salida esperada:**
```
============================================
  Aplicando Migración 003
  Sistema de Publicación Programada
============================================

✅ Archivo de migración encontrado
✅ Docker está corriendo
✅ PostgreSQL está listo

📝 Aplicando migración...

✅ Migración aplicada exitosamente
✅ Tabla 'scheduled_publications' creada correctamente

🎉 Migración completada con éxito
```

### Paso 3: Verifica que se aplicó

```powershell
cd ..\n8n
docker-compose exec postgres psql -U marketai_user -d marketai_seo -c "\d scheduled_publications"
```

---

## 📊 Consultas Útiles

### Ver todas las publicaciones programadas
```sql
SELECT * FROM v_upcoming_publications;
```

### Ver publicaciones del próximo mes
```sql
SELECT 
    scheduled_date,
    COUNT(*) as total_publicaciones
FROM scheduled_publications
WHERE scheduled_date >= CURRENT_DATE
  AND scheduled_date < CURRENT_DATE + INTERVAL '1 month'
  AND status = 'pending'
GROUP BY scheduled_date
ORDER BY scheduled_date;
```

### Crear una publicación de prueba
```sql
INSERT INTO scheduled_publications (
    draft_id, 
    scheduled_date, 
    scheduled_time, 
    created_by
) 
SELECT 
    id,
    CURRENT_DATE + 1, -- Mañana
    '10:00:00',
    'test@larabs.pe'
FROM drafts 
WHERE status = 'approved' 
LIMIT 1;
```

---

## 📋 Próximos Pasos (Implementación)

### ✅ Fase 1: Base de Datos (COMPLETADA)
- [x] Crear migración 003
- [x] Aplicar migración
- [x] Documentar

### ⏳ Fase 2: Workflow 14 - Publicación WordPress (SIGUIENTE)
**Tiempo estimado:** 1-2 horas

**Tareas:**
1. Crear workflow en n8n
2. Configurar webhook `/webhook/seo/publicar`
3. Nodos: Obtener draft → Preparar payload → POST a WordPress → Actualizar BD
4. Probar publicación manual

**Referencia:** Ver `docs/publicacion-programada.md` sección "Workflow 14"

---

### ⏳ Fase 3: Backend API Endpoints
**Tiempo estimado:** 1 hora

**Endpoints a crear en `approval-ui/server/routes/drafts.js`:**
- `POST /api/drafts/:id/schedule` - Programar publicación
- `POST /api/drafts/:id/publish-now` - Publicar inmediatamente
- `GET /api/drafts/scheduled` - Listar programadas
- `DELETE /api/drafts/schedule/:id` - Cancelar

---

### ⏳ Fase 4: Scheduler Service (Cron Job)
**Tiempo estimado:** 1 hora

**Archivo a crear:** `approval-ui/server/services/scheduler.js`

**Función:** Cada 1 minuto revisa si hay publicaciones programadas y las ejecuta.

---

### ⏳ Fase 5: Frontend (UI)
**Tiempo estimado:** 2-3 horas

**Componentes:**
1. Formulario de programación en editor
2. Dashboard de calendario
3. Lista de publicaciones programadas

---

### ⏳ Fase 6: Testing
**Tiempo estimado:** 1-2 horas

**Pruebas:**
- Test E2E completo
- Test de reintentos
- Test de cancelación

---

## 📈 Progreso Total

```
[████████░░░░░░░░░░░░] 20% Completado

✅ Fase 1: Base de Datos (100%)
⏳ Fase 2: Workflow 14 (0%)
⏳ Fase 3: Backend API (0%)
⏳ Fase 4: Scheduler (0%)
⏳ Fase 5: Frontend (0%)
⏳ Fase 6: Testing (0%)
```

**Tiempo estimado restante:** 6-8 horas de desarrollo

---

## 🎯 ¿Qué Podrás Hacer Cuando Esté Completo?

1. ✅ **Aprobar artículos** con fecha y hora futura
2. ✅ **Ver calendario mensual** con todas las publicaciones
3. ✅ **Publicar automáticamente** sin intervención manual
4. ✅ **Programar múltiples artículos** al día (1-5 por día)
5. ✅ **Cancelar o reprogramar** publicaciones pendientes
6. ✅ **Reintentos automáticos** si hay errores
7. ✅ **Ver historial** de publicaciones exitosas/fallidas
8. ✅ **Dashboard visual** con estado en tiempo real

---

## 🆘 Si Algo Falla

### La migración no se aplica

```powershell
# Ver logs de PostgreSQL
cd seo-module\n8n
docker-compose logs postgres

# Reiniciar contenedor
docker-compose restart postgres

# Aplicar manualmente
Get-Content ..\n8n\migrations\003_add_scheduled_publications.sql | docker-compose exec -T postgres psql -U marketai_user -d marketai_seo
```

### No puedo ver las tablas

```powershell
# Conectarse directamente
docker-compose exec postgres psql -U marketai_user -d marketai_seo

# Dentro de psql:
\dt                              # Listar tablas
\d scheduled_publications        # Ver estructura
SELECT * FROM v_upcoming_publications; # Ver vista
```

---

## 📚 Documentación

- **[Guía Completa de Publicación Programada](docs/publicacion-programada.md)**
- **[Roadmap de Implementación](docs/IMPLEMENTACION_PUBLICACION_PROGRAMADA.md)**
- **[Migraciones de BD](n8n/migrations/README.md)**

---

## ✅ Validación de Completitud

- [x] Archivos SQL creados y validados
- [x] Script de aplicación probado
- [x] Documentación completa escrita
- [x] Ejemplos de queries incluidos
- [x] Diagrama de relaciones actualizado
- [x] Índices optimizados agregados
- [x] Vista helper creada
- [x] README de migraciones actualizado

---

**Estado:** ✅ FASE 1 COMPLETADA  
**Siguiente:** Crear Workflow 14 en n8n  
**Fecha:** 27 Octubre 2025

---

**¿Listo para continuar con la Fase 2?** 🚀

