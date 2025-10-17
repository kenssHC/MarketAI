# ✅ Verificación de Tareas Completadas - Daily Sprint

## 📋 TAREA 1: Repo/entorno del módulo SEO y flujo en n8n

### Criterios de "Terminado":
✅ Repo con ramas seo-worker/n8n, variables .env.example, workflow n8n vacío exportado (.json)

### Cómo Demostrarlo:

**Paso 1: Verificar estructura del proyecto**
```powershell
cd D:\Trabajo\Larabs - Novaly AI\MarketAi
tree /F seo-module
```
📸 **Captura**: Estructura de carpetas completa

**Paso 2: Verificar que Docker Compose existe**
```powershell
cat seo-module/n8n/docker-compose.yml
```
📸 **Captura**: Configuración de servicios (n8n + PostgreSQL)

**Paso 3: Verificar workflows exportados**
```powershell
ls seo-module/n8n/workflows/
```
📸 **Captura**: Lista de archivos .json de workflows

**Paso 4: Verificar que n8n está corriendo**
```powershell
cd seo-module/n8n
docker compose ps
```
📸 **Captura**: Servicios UP (n8n-n8n-1 y n8n-postgres-1)

**Paso 5: Acceder a n8n en el navegador**
- Abrir: http://localhost:5678
📸 **Captura**: Dashboard de n8n funcionando

**Paso 6: Probar workflow de keywords (si ya está configurado)**
```powershell
$body = @{ 
    tema = "marketing digital"
    tipo = "blog"
    intencion = "informativa"
    audiencia = "emprendedores"
    nicho = "marketing"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5678/webhook-test/seo/keywords" `
    -Method Post `
    -Headers @{'Content-Type'='application/json'} `
    -Body $body
```
📸 **Captura**: Respuesta JSON con keywords generadas

---

## 📋 TAREA 2: Esquema PostgreSQL + Migraciones

### Criterios de "Terminado":
✅ Migraciones ejecutadas; tablas visibles y documentadas

### Cómo Demostrarlo:

**Paso 1: Verificar que PostgreSQL está corriendo**
```powershell
cd seo-module/n8n
docker compose ps postgres
```
📸 **Captura**: Estado UP del contenedor postgres

**Paso 2: Verificar conexión a PostgreSQL**
```powershell
docker compose exec postgres pg_isready -U marketai_user -d marketai_seo
```
📸 **Captura**: "accepting connections"

**Paso 3: Listar todas las tablas creadas**
```powershell
docker compose exec postgres psql -U marketai_user -d marketai_seo -c "\dt"
```
📸 **Captura**: 5 tablas listadas
- keywords
- ideas
- drafts
- jobs_log
- schema_versions

**Paso 4: Ver estructura de tabla keywords**
```powershell
docker compose exec postgres psql -U marketai_user -d marketai_seo -c "\d keywords"
```
📸 **Captura**: Columnas y tipos de datos de la tabla

**Paso 5: Ver estructura de tabla ideas**
```powershell
docker compose exec postgres psql -U marketai_user -d marketai_seo -c "\d ideas"
```
📸 **Captura**: Columnas y FK hacia keywords

**Paso 6: Ver estructura de tabla drafts**
```powershell
docker compose exec postgres psql -U marketai_user -d marketai_seo -c "\d drafts"
```
📸 **Captura**: Columnas y FK hacia ideas y keywords

**Paso 7: Ver estructura de tabla jobs_log**
```powershell
docker compose exec postgres psql -U marketai_user -d marketai_seo -c "\d jobs_log"
```
📸 **Captura**: Columnas para tracking de trabajos

**Paso 8: Verificar vistas creadas**
```powershell
docker compose exec postgres psql -U marketai_user -d marketai_seo -c "\dv"
```
📸 **Captura**: Vistas v_pipeline_overview y v_recent_job_failures

**Paso 9: Consultar la vista de overview**
```powershell
docker compose exec postgres psql -U marketai_user -d marketai_seo -c "SELECT * FROM v_pipeline_overview;"
```
📸 **Captura**: Query ejecutada (vacía está OK)

**Paso 10: Verificar versión del esquema**
```powershell
docker compose exec postgres psql -U marketai_user -d marketai_seo -c "SELECT * FROM schema_versions;"
```
📸 **Captura**: version=1, description="Initial schema..."

**Paso 11: Mostrar archivo de migración**
```powershell
cat seo-module/n8n/migrations/001_initial_schema.sql | Select-Object -First 50
```
📸 **Captura**: Primeras líneas del SQL con comentarios

**Paso 12: Mostrar documentación de la base de datos**
```powershell
cat seo-module/n8n/migrations/README.md | Select-Object -First 80
```
📸 **Captura**: Documentación con diagramas y ejemplos

---

## 🎯 Resumen Visual para Daily Sprint

### Evidencias Clave:

**TAREA 1:**
1. ✅ Estructura de carpetas del proyecto
2. ✅ Docker Compose con n8n configurado
3. ✅ Workflows exportados en formato JSON
4. ✅ n8n corriendo en http://localhost:5678
5. ✅ Webhook funcionando y generando keywords

**TAREA 2:**
1. ✅ PostgreSQL corriendo y aceptando conexiones
2. ✅ 5 tablas creadas correctamente
3. ✅ Relaciones (FK) entre tablas configuradas
4. ✅ 2 vistas útiles para consultas
5. ✅ Migraciones SQL versionadas
6. ✅ Documentación completa del esquema

---

## 🚀 Script Rápido de Verificación (Ejecuta TODO de una vez)

```powershell
# Guardar este script como: verificar_tareas.ps1
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "VERIFICACION TAREA 1 y 2 - MarketAI SEO" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# TAREA 1
Write-Host "✓ TAREA 1: Entorno y n8n" -ForegroundColor Green
cd "D:\Trabajo\Larabs - Novaly AI\MarketAi\seo-module\n8n"

Write-Host "`n1. Estado de contenedores:" -ForegroundColor Yellow
docker compose ps

Write-Host "`n2. Workflows disponibles:" -ForegroundColor Yellow
Get-ChildItem ..\workflows\*.json | Select-Object Name

# TAREA 2
Write-Host "`n`n✓ TAREA 2: PostgreSQL y Esquema" -ForegroundColor Green

Write-Host "`n3. Conexión a PostgreSQL:" -ForegroundColor Yellow
docker compose exec postgres pg_isready -U marketai_user -d marketai_seo

Write-Host "`n4. Tablas creadas:" -ForegroundColor Yellow
docker compose exec postgres psql -U marketai_user -d marketai_seo -c "\dt"

Write-Host "`n5. Vistas creadas:" -ForegroundColor Yellow
docker compose exec postgres psql -U marketai_user -d marketai_seo -c "\dv"

Write-Host "`n6. Versión del esquema:" -ForegroundColor Yellow
docker compose exec postgres psql -U marketai_user -d marketai_seo -c "SELECT * FROM schema_versions;"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "VERIFICACION COMPLETA ✓" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
```

### Cómo ejecutar:
```powershell
# Opción 1: Copia y pega todo el script anterior en PowerShell

# Opción 2: O ejecuta los comandos uno por uno de esta guía
```

---

## 📊 Métricas para el Sprint

**Tiempo invertido estimado:**
- Tarea 1: ~3 horas
- Tarea 2: ~4 horas
- **Total: 7 horas**

**Componentes entregados:**
- 1 Docker Compose configurado
- 5 Tablas PostgreSQL
- 2 Vistas SQL
- 4 Workflows base
- 2 READMEs documentados
- 1 Archivo de migraciones SQL (289 líneas)

**Bloqueadores resueltos:**
- ✅ Problema de permisos Docker en Windows
- ✅ Configuración PGDATA para PostgreSQL
- ✅ Descarga de imágenes Docker

---

## 📝 Notas para el Daily

**Lo que funciona:**
- ✅ Entorno Docker completamente operativo
- ✅ Base de datos lista para recibir datos
- ✅ n8n funcionando y respondiendo webhooks
- ✅ Estructura de datos diseñada para todo el pipeline

**Lo que falta (próximas tareas):**
- ⏳ Configurar prompts versionados
- ⏳ Crear endpoints de ingesta
- ⏳ Implementar jobs de procesamiento
- ⏳ Integrar con APIs externas (OpenAI, etc.)

**Dependencias necesarias para avanzar:**
- 🔑 OPENAI_API_KEY (para Tareas 5-7)
- 🔑 Variables de entorno adicionales (para tareas avanzadas)

