# ⚡ Quick Start - Fase 1: Base de Datos

## 🎯 Aplica la Migración en 30 Segundos

```powershell
cd D:\Trabajo\Larabs - Novaly AI\MarketAi\seo-module\scripts
.\apply_migration_003.ps1
```

**Eso es todo.** ✅

---

## ✅ ¿Qué se Instaló?

- Tabla `scheduled_publications` para programación
- 6 campos nuevos en `drafts` para WordPress
- Vista `v_upcoming_publications` para consultas rápidas
- Índices optimizados

---

## 🧪 Prueba Rápida

```powershell
cd ..\n8n
docker-compose exec postgres psql -U marketai_user -d marketai_seo
```

Dentro de `psql`:

```sql
-- Ver la nueva tabla
\d scheduled_publications

-- Ver publicaciones programadas
SELECT * FROM v_upcoming_publications;

-- Salir
\q
```

---

## 📚 Documentación Completa

- `RESUMEN_FASE1_COMPLETADA.md` - Resumen detallado
- `docs/publicacion-programada.md` - Guía completa
- `docs/IMPLEMENTACION_PUBLICACION_PROGRAMADA.md` - Roadmap

---

## ➡️ Siguiente Paso

**Crear Workflow 14** en n8n para publicar en WordPress.

Ver: `docs/publicacion-programada.md` sección "Workflow 14"

