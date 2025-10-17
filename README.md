# MarketAI - Módulo SEO

Sistema automatizado para generación de contenido SEO optimizado utilizando IA.

## 🎯 Descripción

Este módulo automatiza el proceso completo de creación de contenido SEO, desde la investigación de keywords hasta la publicación en WordPress, incluyendo generación de imágenes y copys para redes sociales.

## 📋 Estructura del Proyecto

```
seo-module/
  README.md
  .gitignore
  .env.example
  prompts/                  # Prompts versionados para IA
    prompt_1_keywords.md
    prompt_2_ideas_clasifica.md
    prompt_3_redaccion.md
    prompt_4_json_a_articulo.md
  n8n/
    docker-compose.yml      # n8n + PostgreSQL + Adminer
    migrations/             # Migraciones SQL
      001_initial_schema.sql
      README.md             # Documentación detallada del esquema
    storage/                # Datos de n8n (auto-generado)
    workflows/              # Workflows exportados de n8n
      seo_01_keywords_workflow.json
      seo_02_ideas_workflow.json
      seo_03_redaccion_workflow.json
      seo_04_formateo_workflow.json
```

## 🗄️ Base de Datos (PostgreSQL)

### Tablas Principales:
- **keywords**: Clusters de keywords analizadas (GKP + manual)
- **ideas**: 30 ideas de contenido por cluster (con/sin investigación)
- **drafts**: Artículos con metadatos SEO, imágenes y QA
- **jobs_log**: Registro de trabajos ejecutados (para monitoreo)

### Vistas:
- **v_pipeline_overview**: Resumen del estado del pipeline
- **v_recent_job_failures**: Últimos fallos para debugging

📚 **Documentación completa**: Ver `n8n/migrations/README.md`

## 🚀 Inicio Rápido

### 1. Requisitos Previos
- Docker Desktop instalado
- Credenciales de OpenAI (API key)

### 2. Configuración

**Opción A: Variables en línea (recomendado para MVP)**
```powershell
cd seo-module/n8n
$env:OPENAI_API_KEY="sk-tu-api-key-aqui"
$env:POSTGRES_PASSWORD="tu-password-seguro"
docker compose up -d postgres n8n
```

**Opción B: Archivo .env**
1. Crea `seo-module/.env` basado en `.env.example`
2. Completa las variables necesarias
3. Ejecuta: `docker compose up -d postgres n8n`

### 3. Verificar Instalación

```powershell
# Ver servicios corriendo
docker compose ps

# Verificar tablas creadas
docker compose exec postgres psql -U marketai_user -d marketai_seo -c "\dt"
```

**Servicios disponibles:**
- 🌐 n8n: http://localhost:5678
- 🗄️ PostgreSQL: localhost:5432
- 💾 Base de datos: `marketai_seo`
- 👤 Usuario DB: `marketai_user`

### 4. Acceso a n8n

1. Abre http://localhost:5678
2. Crea tu cuenta de administrador (primera vez)
3. Importa los workflows desde `n8n/workflows/`

## 🔄 Pipeline de Contenido (18 Tareas)

### ✅ Tareas Completadas:
- [x] **Tarea 1**: Repo/entorno del módulo SEO
- [x] **Tarea 2**: Esquema PostgreSQL + migraciones ← **ACTUAL**

### 🔜 Próximas Tareas:
- [ ] **Tarea 3**: Cargar prompts versionados
- [ ] **Tarea 4**: Endpoint ingesta de keywords
- [ ] **Tarea 5**: Job "cluster de keywords"
- [ ] **Tarea 6**: Job "30 ideas y clasificación"
- [ ] **Tarea 7**: Job "redacción sin investigación"
- [ ] **Tarea 8**: Integración Perplexity/Serper
- [ ] **Tarea 9**: Job "artículo desde JSON investigado"
- [ ] **Tarea 10**: Generación de imágenes (Leonardo/DALL-E)
- [ ] **Tarea 11**: QA SEO automático
- [ ] **Tarea 12**: UI de aprobación
- [ ] **Tarea 13**: Publicación WordPress
- [ ] **Tarea 14**: Copys para LinkedIn/Facebook
- [ ] **Tarea 15**: Logs y métricas
- [ ] **Tarea 16**: Manejo de errores y reintentos
- [ ] **Tarea 17**: Documentación SOP
- [ ] **Tarea 18**: Demo E2E

## 🔧 Comandos Útiles

### Docker
```powershell
# Iniciar servicios
cd seo-module/n8n
docker compose up -d postgres n8n

# Ver logs
docker compose logs -f

# Detener servicios
docker compose down

# Reiniciar PostgreSQL (si hay problemas)
docker compose restart postgres
```

### Base de Datos
```powershell
# Conectarse a PostgreSQL
docker compose exec postgres psql -U marketai_user -d marketai_seo

# Ver todas las tablas
docker compose exec postgres psql -U marketai_user -d marketai_seo -c "\dt"

# Ver estructura de una tabla
docker compose exec postgres psql -U marketai_user -d marketai_seo -c "\d keywords"

# Consultar datos
docker compose exec postgres psql -U marketai_user -d marketai_seo -c "SELECT * FROM v_pipeline_overview;"

# Backup
docker compose exec postgres pg_dump -U marketai_user marketai_seo > backup_$(Get-Date -Format yyyyMMdd).sql
```

## 🧪 Probar el Sistema

### Test 1: Verificar n8n y PostgreSQL
```powershell
# 1. Verificar que n8n responde
Invoke-WebRequest -Uri "http://localhost:5678" -UseBasicParsing

# 2. Verificar PostgreSQL
docker compose exec postgres pg_isready -U marketai_user -d marketai_seo
```

### Test 2: Probar workflow de keywords (cuando esté configurado)
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

## 📝 Variables de Entorno Necesarias

### Esenciales (MVP):
```bash
OPENAI_API_KEY=sk-...          # Para generación de contenido
POSTGRES_PASSWORD=...          # Para la base de datos
```

### Opcionales (Funcionalidades Avanzadas):
```bash
PERPLEXITY_API_KEY=...         # Para investigación con IA
SERPER_API_KEY=...             # Para búsqueda en Google
LEONARDO_API_KEY=...           # Para generación de imágenes
AWS_ACCESS_KEY_ID=...          # Para almacenar imágenes en S3
WORDPRESS_SITE_URL=...         # Para publicación automática
```

## 📚 Documentación Adicional

- **Base de Datos**: Ver `n8n/migrations/README.md`
- **Prompts**: Ver archivos en `prompts/`
- **Arquitectura Completa**: Ver `Herramientas/Propuesta de arquitectura de microservicios.txt`
- **Lista de Tareas**: Ver `Herramientas/Lista de tareas del modulo SEO.txt`

## ⚠️ Notas Importantes

1. **Primera ejecución**: Las migraciones SQL se ejecutan automáticamente
2. **Datos persistentes**: Se guardan en volúmenes de Docker
3. **Puerto 5432**: Asegúrate de que no esté ocupado por otra instancia de PostgreSQL
4. **OpenAI API Key**: Necesaria desde la Tarea 4 en adelante

## 🆘 Solución de Problemas

**PostgreSQL no inicia:**
```powershell
docker compose down
docker volume rm n8n_postgres_data
docker compose up -d postgres
```

**n8n no se conecta a OpenAI:**
- Verifica que la variable `OPENAI_API_KEY` esté configurada
- Revisa los logs: `docker compose logs n8n`

**Tablas no se crearon:**
- Verifica los logs de PostgreSQL: `docker compose logs postgres`
- Las migraciones están en: `n8n/migrations/001_initial_schema.sql`

## 📞 Estado del Proyecto

**Versión actual**: MVP v0.1  
**Última actualización**: 17 Octubre 2025  
**Estado**: Tarea 2 completada ✅ (PostgreSQL configurado)