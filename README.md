# MarketAI - M�dulo SEO

Sistema automatizado de generaci�n de contenido SEO con Inteligencia Artificial.

---

## ?? Inicio R�pido (5 minutos)

### 1. Inicia los servicios
```powershell
cd n8n
docker compose up -d
```

### 2. Accede a n8n
Abre http://localhost:5678 y crea tu cuenta.

### 3. Importa workflows
Importa los 13 workflows desde `n8n/workflows/` en n8n.

### 4. Configura credenciales PostgreSQL
- Settings ? Credentials ? PostgreSQL
- Host: `postgres`, Database: `marketai_seo`
- User: `marketai_user`, Password: `marketai_secure_password`

### 5. Activa workflows
Activa los 13 workflows (switch verde).

### 6. Verifica
```powershell
cd scripts
.\verificar_sistema.ps1
.\test_workflows.ps1
```

?? **[Gu�a completa](docs/quickstart.md)** | ?? **[Troubleshooting](docs/troubleshooting.md)**

---

## Panel de Aprobacion Editorial

```powershell
cd approval-ui
npm install
npm run dev
```

- SPA: http://localhost:5173 (proxy /api -> http://localhost:3001)
- API: http://localhost:3001/api
- Las variables APPROVAL_API_PORT y PG* se cargan desde seo-module/.env

## ?? Estructura del Proyecto

```
seo-module/
+-- docs/                    # ?? Documentaci�n completa
�   +-- quickstart.md       # Gu�a de inicio r�pido
�   +-- workflows/          # Docs de cada workflow
�   +-- troubleshooting.md  # Soluci�n de problemas
+-- scripts/                 # ?? Scripts de prueba
�   +-- verificar_sistema.ps1
�   +-- test_workflows.ps1
�   +-- test_ingesta.ps1
�   +-- limpiar_datos_test.ps1
+-- n8n/                     # ?? Configuraci�n n8n
�   +-- workflows/          # 11 workflows JSON
�   +-- migrations/         # Migraciones SQL
�   +-- docker-compose.yml
+-- prompts/                 # ?? Prompts IA versionados
    +-- v1/                 # Versi�n 1.0
```

---

## ?Y"" Workflows Disponibles (13)

| #  | Workflow | Funci??n | Endpoint |
|----|----------|---------|----------|
| 1  | Keywords Analysis | Analiza y genera keywords base | `/webhook/seo/keywords` |
| 2  | Ideas Generator (v1) | Clasifica ideas generales por intenci�n | `/webhook/seo/ideas` |
| 3  | Redacci�n (v1) | Redacta art�culos r�pidos (sin research) | `/webhook/seo/redaccion` |
| 4  | Formateo HTML | Convierte JSON de contenido en HTML SEO | `/webhook/seo/formatear` |
| 5  | Ingesta CSV | Importa keywords desde Google Ads | `/webhook/seo/ingesta/csv` |
| 6  | Ingesta Manual | Ingreso manual de keywords | `/webhook/seo/ingesta/manual` |
| 7  | Clustering de Keywords | Agrupa keywords por tem�tica usando LLM | `/webhook/seo/clustering` |
| 8  | Generaci�n de Ideas (v2) | Crea 30 ideas por cluster y las categoriza | `/webhook/seo/ideas-generation` |
| 9  | Redacci�n Simple | Drafts >600 palabras para ideas sin research | `/webhook/seo/redaccion/simple` |
| 10 | Investigacion Deep Research | Normaliza research y fuentes (o4-mini) | `/webhook/seo/investigacion` |
| 11 | Redacci�n Investigada | Redacci�n >800 palabras citando fuentes | `/webhook/seo/redaccion/investigada` |
| 12 | Generaci�n de Im�genes | Prompt visual + imagen (Gemini) y subida a WordPress | `/webhook/seo/imagenes/generar` |
| 13 | QA SEO Automatizado | Valida drafts con checks SEO y actualiza `qa_passed` | `/webhook/seo/qa` |

?Y"- **[Documentaci??n completa de workflows](docs/workflows/overview.md)**

---
```powershell
.\test_workflows.ps1        # Prueba los 13 workflows
.\test_ingesta.ps1          # Prueba workflows 5 y 6
```

### Mantenimiento
```powershell
.\limpiar_datos_test.ps1    # Elimina keywords de prueba
```

---

## ??? Base de Datos

**PostgreSQL** con 5 tablas principales:
- `keywords` - Keywords y clusters
- `ideas` - Ideas de contenido generadas
- `drafts` - Art�culos con metadatos SEO
- `jobs_log` - Registro de ejecuciones
- `images` - Metadatos de im�genes

?? **[Documentaci�n del esquema](n8n/migrations/README.md)**

---

## ?? Prompts de IA

Sistema de prompts versionados para generaci�n de contenido:

- **v1/01** - Clustering de keywords
- **v1/02** - Generaci�n de ideas
- **v1/03** - Redacci�n simple
- **v1/04** - Redacci�n investigada
- **v1/05** - Generaci�n de im�genes

?? **[Documentaci�n de prompts](prompts/README.md)**

---

## ?? Pipeline Completo
```
Ingesta Keywords (WF 5-6)
    ??? Clustering IA (WF 7)
          ??? Generaci?n de Ideas (WF 8)
                ??? Redacci?n simple (WF 9)
                ??? Investigaci?n profunda (WF 10)
                        ??? Redacci?n investigada (WF 11)
                              ??? QA SEO automatizado (WF 13)
                                    ??? Generaci?n de Im?genes (WF 12)
                                          ??? Formateo HTML (WF 4)
                                                ??? Publicaci?n / QA (roadmap)
```

---

## ?? Documentaci�n

### Gu�as
- **[Inicio R�pido](docs/quickstart.md)** - Configuraci�n en 5 minutos
- **[Troubleshooting](docs/troubleshooting.md)** - Soluci�n de problemas comunes

### Workflows
- **[Resumen de Workflows](docs/workflows/overview.md)** - Los 13 workflows
- **[Ingesta CSV](docs/workflows/ingesta-csv.md)** - Workflow 5
- **[Ingesta Manual](docs/workflows/ingesta-manual.md)** - Workflow 6

### Base de Datos
- **[Esquema PostgreSQL](n8n/migrations/README.md)** - Tablas y relaciones

---

## ?? Soluci�n de Problemas

### Servicios no inician
```powershell
docker compose restart
```

### Workflows devuelven 404
- Verifica que est�n **ACTIVOS** (switch verde) en n8n

### Workflows devuelven "Workflow was started"
- Aseg�rate de usar `/webhook/...` (no `/webhook-test/...`)
- El workflow debe estar ACTIVO

?? **[Gu�a completa de troubleshooting](docs/troubleshooting.md)**

---

## ?? Enlaces �tiles

- **n8n UI:** http://localhost:5678
- **PostgreSQL:** localhost:5432
- **Base de datos:** `marketai_seo`

---

## ?? Estado del Proyecto
**Versi??n:** v0.5  
**?sltima actualizaci??n:** 22 Octubre 2025

### Completado ?o.
- [x] Infraestructura (Docker + n8n + PostgreSQL)
- [x] Base de datos (5 tablas + vistas + research_reports)
- [x] Prompts IA v1 (clustering, ideas, redacci�n simple e investigada)
- [x] Workflows 1-13 operativos (ingesta, clustering, ideas, investigaci�n, redacci�n e im�genes)
- [x] Scripts de prueba actualizados (`test_workflows.ps1`, `test_workflow11.ps1`)
- [x] Scripts de prueba actualizados (`test_workflow12.ps1`, `test_workflow13.ps1`)
- [x] Documentaci�n funcional actualizada (README + docs/workflows)
- [x] UI de aprobacion editorial (SPA + API interna)

### En Desarrollo ?Y""
- QA SEO autom�tico sobre drafts (Tarea 11)

### Planificado ?Y".
- Publicaci�n WordPress con metadatos completos
- Copys para redes sociales (LinkedIn / Facebook)
- Observabilidad: m�tricas de jobs, alertas y reintentos

---

- Los workflows 1-4 y 7-13 requieren `OPENAI_API_KEY` configurada
- El workflow 12 requiere `GEMINI_API_KEY` y credenciales v�lidas de WordPress (token, Basic Auth o nonce) para `/wp-json/wp/v2/media`
- Los workflows 5-6 solo requieren PostgreSQL
- Todos los datos se guardan en vol�menes de Docker
- Prueba de estado

---

**Desarrollado para MarketAI**  
**Documentaci�n completa:** [docs/README.md](docs/README.md)

