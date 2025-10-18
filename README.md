# MarketAI - Módulo SEO

Sistema automatizado de generación de contenido SEO con Inteligencia Artificial.

---

## 🚀 Inicio Rápido (5 minutos)

### 1. Inicia los servicios
```powershell
cd n8n
docker compose up -d
```

### 2. Accede a n8n
Abre http://localhost:5678 y crea tu cuenta.

### 3. Importa workflows
Importa los 6 workflows desde `n8n/workflows/` en n8n.

### 4. Configura credenciales PostgreSQL
- Settings → Credentials → PostgreSQL
- Host: `postgres`, Database: `marketai_seo`
- User: `marketai_user`, Password: `marketai_secure_password`

### 5. Activa workflows
Activa los 6 workflows (switch verde).

### 6. Verifica
```powershell
cd scripts
.\verificar_sistema.ps1
.\test_workflows.ps1
```

📚 **[Guía completa](docs/quickstart.md)** | 🔧 **[Troubleshooting](docs/troubleshooting.md)**

---

## 📂 Estructura del Proyecto

```
seo-module/
├── docs/                    # 📚 Documentación completa
│   ├── quickstart.md       # Guía de inicio rápido
│   ├── workflows/          # Docs de cada workflow
│   └── troubleshooting.md  # Solución de problemas
├── scripts/                 # 🧪 Scripts de prueba
│   ├── verificar_sistema.ps1
│   ├── test_workflows.ps1
│   ├── test_ingesta.ps1
│   └── limpiar_datos_test.ps1
├── n8n/                     # ⚙️ Configuración n8n
│   ├── workflows/          # 6 workflows JSON
│   ├── migrations/         # Migraciones SQL
│   └── docker-compose.yml
└── prompts/                 # 🤖 Prompts IA versionados
    └── v1/                 # Versión 1.0
```

---

## 🔄 Los 6 Workflows

| # | Workflow | Función | Endpoint |
|---|----------|---------|----------|
| 1 | Keywords Analysis | Analiza y genera keywords | `/webhook/seo/keywords` |
| 2 | Ideas Generator | Genera 30 ideas de contenido | `/webhook/seo/ideas` |
| 3 | Redacción | Redacta artículos SEO | `/webhook/seo/redaccion` |
| 4 | Formateo HTML | Convierte JSON a HTML | `/webhook/seo/formatear` |
| 5 | Ingesta CSV | Importa keywords desde CSV | `/webhook/seo/ingesta/csv` |
| 6 | Ingesta Manual | Ingreso manual de keywords | `/webhook/seo/ingesta/manual` |

📖 **[Documentación completa de workflows](docs/workflows/overview.md)**

---

## 🧪 Scripts Disponibles

### Verificación del Sistema
```powershell
cd scripts
.\verificar_sistema.ps1    # Verifica Docker, n8n, PostgreSQL
```

### Pruebas de Workflows
```powershell
.\test_workflows.ps1        # Prueba los 6 workflows
.\test_ingesta.ps1          # Prueba workflows 5 y 6
```

### Mantenimiento
```powershell
.\limpiar_datos_test.ps1    # Elimina keywords de prueba
```

---

## 🗄️ Base de Datos

**PostgreSQL** con 5 tablas principales:
- `keywords` - Keywords y clusters
- `ideas` - Ideas de contenido generadas
- `drafts` - Artículos con metadatos SEO
- `jobs_log` - Registro de ejecuciones
- `images` - Metadatos de imágenes

📊 **[Documentación del esquema](n8n/migrations/README.md)**

---

## 🤖 Prompts de IA

Sistema de prompts versionados para generación de contenido:

- **v1/01** - Clustering de keywords
- **v1/02** - Generación de ideas
- **v1/03** - Redacción simple
- **v1/04** - Redacción investigada
- **v1/05** - Generación de imágenes

📝 **[Documentación de prompts](prompts/README.md)**

---

## 🎯 Pipeline Completo

```
Ingesta Keywords (WF 5-6)
    ↓
Clustering IA (WF 1)
    ↓
Ideas (WF 2)
    ↓
Redacción (WF 3)
    ↓
Formateo HTML (WF 4)
    ↓
Publicación (Futuro)
```

---

## 📚 Documentación

### Guías
- **[Inicio Rápido](docs/quickstart.md)** - Configuración en 5 minutos
- **[Troubleshooting](docs/troubleshooting.md)** - Solución de problemas comunes

### Workflows
- **[Resumen de Workflows](docs/workflows/overview.md)** - Los 6 workflows
- **[Ingesta CSV](docs/workflows/ingesta-csv.md)** - Workflow 5
- **[Ingesta Manual](docs/workflows/ingesta-manual.md)** - Workflow 6

### Base de Datos
- **[Esquema PostgreSQL](n8n/migrations/README.md)** - Tablas y relaciones

---

## 🆘 Solución de Problemas

### Servicios no inician
```powershell
docker compose restart
```

### Workflows devuelven 404
- Verifica que estén **ACTIVOS** (switch verde) en n8n

### Workflows devuelven "Workflow was started"
- Asegúrate de usar `/webhook/...` (no `/webhook-test/...`)
- El workflow debe estar ACTIVO

📖 **[Guía completa de troubleshooting](docs/troubleshooting.md)**

---

## 🔗 Enlaces Útiles

- **n8n UI:** http://localhost:5678
- **PostgreSQL:** localhost:5432
- **Base de datos:** `marketai_seo`

---

## 📊 Estado del Proyecto

**Versión:** v0.4  
**Última actualización:** 17 Octubre 2025

### Completado ✅
- [x] Infraestructura (Docker + n8n + PostgreSQL)
- [x] Base de datos (5 tablas + vistas)
- [x] Prompts IA (5 prompts v1)
- [x] 6 Workflows funcionales
- [x] Ingesta de Keywords (CSV + Manual)
- [x] Documentación completa

### En Desarrollo 🔄
- Clustering automático con IA (Tarea 5)
- Generación de 30 ideas (Tarea 6)

### Planificado 📅
- Redacción de artículos
- Generación de imágenes
- QA SEO automático
- Publicación WordPress

---

## 📝 Notas

- Los workflows 1-4 requieren `OPENAI_API_KEY` configurada
- Los workflows 5-6 solo requieren PostgreSQL
- Todos los datos se guardan en volúmenes de Docker

---

**Desarrollado para MarketAI**  
**Documentación completa:** [docs/README.md](docs/README.md)
