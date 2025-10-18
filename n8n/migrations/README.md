# Migraciones de Base de Datos - MarketAI SEO Module

## 📋 Descripción General

Este directorio contiene las migraciones SQL para el módulo SEO de MarketAI. Las migraciones se ejecutan automáticamente cuando se inicia el contenedor de PostgreSQL por primera vez.

## 🗄️ Esquema de Base de Datos

### Diagrama de Relaciones

```
┌─────────────────┐
│    keywords     │
│                 │
│ - id (PK)       │
│ - cluster_name  │◄───┐
│ - keyword_prin..│    │
│ - keywords_sec..│    │
│ - source        │    │
│ - status        │    │
└─────────────────┘    │
                       │
                       │  FK
┌─────────────────┐    │
│     ideas       │    │
│                 │    │
│ - id (PK)       │    │
│ - keyword_clus..├────┘
│ - idea_title    │◄───┐
│ - categoria     │    │
│ - status        │    │
└─────────────────┘    │
                       │  FK
┌─────────────────┐    │
│     drafts      │    │
│                 │    │
│ - id (PK)       │    │
│ - idea_id       ├────┘
│ - title         │
│ - content_md    │
│ - content_html  │
│ - qa_passed     │
│ - status        │
│ - wp_post_url   │
└─────────────────┘

┌─────────────────┐
│    jobs_log     │
│                 │
│ - id (PK)       │
│ - job_name      │
│ - job_type      │
│ - status        │
│ - duration_ms   │
│ - error_message │
└─────────────────┘
```

## 📊 Tablas Principales

### 1. **keywords**
Almacena las keywords analizadas y agrupadas en clusters temáticos.

**Campos principales:**
- `cluster_name`: Nombre del grupo temático
- `keyword_principal`: Keyword más representativa del cluster
- `keywords_secundarias`: Array JSON de keywords relacionadas
- `source`: Origen ('gkp' para Google Keyword Planner, 'manual' para ingesta manual)
- `search_volume`, `competition`, `search_intent`: Metadatos SEO

**Estados:** `pending` → `processed` → `used` → `archived`

---

### 2. **ideas**
Contiene las 30 ideas de contenido generadas por IA para cada cluster de keywords.

**Campos principales:**
- `idea_title`: Título de la idea (máx. 12 palabras)
- `categoria`: 'Requiere investigación' o 'No requiere investigación'
- `priority`: Orden de importancia (para priorización)

**Estados:** `pending` → `in_progress` → `draft_created` → `published` | `rejected`

**Relación:** Cada idea está vinculada a un cluster de keywords (`keyword_cluster_id`)

---

### 3. **drafts**
Almacena los borradores de artículos con todo el contenido y metadatos SEO.

**Campos principales:**
- **Contenido:**
  - `title`, `meta_title`, `meta_description`, `tags`
  - `content_markdown`, `content_html`
  - `word_count`

- **Investigación:**
  - `research_data`: JSON con datos de Perplexity/Serper
  - `research_sources`: Array de fuentes citadas (autor, año, URL)

- **Imágenes:**
  - `featured_image_url`, `featured_image_alt`
  - `featured_image_prompt`: Prompt usado para generar la imagen
  - `additional_images`: Array JSON de imágenes adicionales

- **QA SEO:**
  - `qa_passed`: Boolean si pasó todos los checks
  - `qa_report`: JSON con detalles de los checks (longitud meta, densidad keywords, H1/H2, etc.)

- **WordPress:**
  - `wordpress_post_id`, `wordpress_post_url`, `wordpress_permalink`
  - `published_at`

- **Social Media:**
  - `linkedin_copy`, `facebook_copy`

**Estados:** `draft` → `review` → `approved` → `publishing` → `published` | `rejected`

---

### 4. **jobs_log**
Registro detallado de todos los trabajos ejecutados en el pipeline.

**Campos principales:**
- `job_name`, `job_type`: Identificación del trabajo
- `status`: 'started' → 'success' | 'failed' | 'retry' | 'dlq'
- `started_at`, `completed_at`, `duration_ms`
- `input_data`, `output_data`: JSON con los datos procesados
- `error_message`, `error_stack`: Para debugging
- `retry_count`, `max_retries`: Control de reintentos
- `moved_to_dlq_at`, `dlq_reason`: Dead Letter Queue para fallos persistentes
- `api_calls_made`, `tokens_used`, `cost_estimate`: Tracking de costos

**Tipos de trabajos:**
- `keyword_analysis`: Análisis y clustering de keywords
- `idea_generation`: Generación de 30 ideas
- `draft_creation`: Redacción de artículos
- `research`: Búsqueda de información (Perplexity)
- `image_generation`: Creación de imágenes
- `qa_check`: Control de calidad SEO
- `wordpress_publish`: Publicación en WordPress
- `social_media_copy`: Generación de copys para redes

---

## 🔍 Vistas Útiles

### `v_pipeline_overview`
Vista resumen del estado del pipeline por cada cluster de keywords:
- Total de ideas generadas
- Ideas con/sin investigación
- Drafts creados y aprobados
- Artículos publicados

```sql
SELECT * FROM v_pipeline_overview;
```

### `v_recent_job_failures`
Últimos 100 trabajos fallidos para monitoreo:

```sql
SELECT * FROM v_recent_job_failures;
```

---

## 🚀 Uso

### Primera vez (inicialización)

```bash
# 1. Asegúrate de tener un archivo .env con la variable POSTGRES_PASSWORD
cd seo-module/n8n

# 2. Inicia los contenedores
docker compose up -d

# 3. Verifica que las tablas se crearon
docker compose exec postgres psql -U marketai_user -d marketai_seo -c "\dt"
```

### Conectarse a la base de datos

**Opción 1: Via Adminer (UI Web)**
```
URL: http://localhost:8080
Sistema: PostgreSQL
Servidor: postgres
Usuario: marketai_user
Contraseña: [tu POSTGRES_PASSWORD]
Base de datos: marketai_seo
```

**Opción 2: Via psql (CLI)**
```bash
docker compose exec postgres psql -U marketai_user -d marketai_seo
```

**Opción 3: Cliente externo (DBeaver, pgAdmin, etc.)**
```
Host: localhost
Port: 5432
Database: marketai_seo
Username: marketai_user
Password: [tu POSTGRES_PASSWORD]
```

---

## 📝 Ejemplos de Queries

### Insertar un cluster de keywords
```sql
INSERT INTO keywords (cluster_name, keyword_principal, keywords_secundarias, source, search_volume, search_intent)
VALUES (
    'Marketing Digital',
    'marketing digital para emprendedores',
    '["estrategias de marketing", "publicidad online", "redes sociales"]'::jsonb,
    'manual',
    5000,
    'informacional'
);
```

### Ver todas las ideas pendientes de un cluster
```sql
SELECT i.idea_title, i.categoria, i.priority
FROM ideas i
JOIN keywords k ON i.keyword_cluster_id = k.id
WHERE k.cluster_name = 'Marketing Digital'
  AND i.status = 'pending'
ORDER BY i.priority DESC;
```

### Ver drafts que pasaron QA pero no están publicados
```sql
SELECT 
    d.title,
    d.word_count,
    d.qa_passed,
    d.status,
    d.created_at
FROM drafts d
WHERE d.qa_passed = true
  AND d.status != 'published'
ORDER BY d.created_at DESC;
```

### Estadísticas de trabajos ejecutados
```sql
SELECT 
    job_type,
    status,
    COUNT(*) as total,
    AVG(duration_ms) as avg_duration_ms,
    SUM(tokens_used) as total_tokens,
    SUM(cost_estimate) as total_cost_usd
FROM jobs_log
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY job_type, status
ORDER BY job_type, status;
```

---

## 🔄 Futuras Migraciones

Para agregar nuevas migraciones:

1. Crea un nuevo archivo: `002_nombre_descriptivo.sql`
2. Incrementa el número de versión
3. Documenta los cambios aquí
4. **NO modifiques migraciones ya aplicadas**

**Formato de nombres:**
```
001_initial_schema.sql
002_add_user_preferences.sql
003_add_seo_score_column.sql
```

---

## ⚠️ Notas Importantes

1. **Primera ejecución:** Las migraciones se ejecutan automáticamente cuando PostgreSQL inicia por primera vez.
2. **Volumen persistente:** Los datos se guardan en el volumen `postgres_data` de Docker.
3. **Backup:** Antes de cambios importantes, haz backup de la base de datos:
   ```bash
   docker compose exec postgres pg_dump -U marketai_user marketai_seo > backup_$(date +%Y%m%d).sql
   ```
4. **Restaurar backup:**
   ```bash
   docker compose exec -T postgres psql -U marketai_user marketai_seo < backup_20241017.sql
   ```

---

## 📚 Referencias

- [PostgreSQL JSON Types](https://www.postgresql.org/docs/current/datatype-json.html)
- [n8n Database Nodes](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.postgres/)
- [Docker Compose PostgreSQL](https://hub.docker.com/_/postgres)

