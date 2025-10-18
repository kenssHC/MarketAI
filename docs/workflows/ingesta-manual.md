# 📝 Workflow 6: Ingesta Manual

Permite ingresar keywords manualmente mediante API, soportando tanto keywords simples como con metadatos completos.

---

## 🎯 Descripción

El Workflow 6 facilita el ingreso manual de keywords desde aplicaciones, scripts o directamente mediante API calls. Soporta dos formatos: strings simples o objetos con metadatos completos.

**Archivo:** `n8n/workflows/seo_06_ingesta_manual.json`

---

## 🔌 Endpoint

```
POST http://localhost:5678/webhook/seo/ingesta/manual
```

---

## 📋 Parámetros de Entrada

### Headers
```json
{
  "Content-Type": "application/json"
}
```

### Opción A: Keywords Simples (Strings)

```json
{
  "keywords": [
    "marketing digital para pymes",
    "estrategias de contenido 2025",
    "SEO local para negocios"
  ],
  "cluster_name": "Marketing Digital",
  "project_name": "Proyecto 2025"
}
```

### Opción B: Keywords con Metadatos (Objetos)

```json
{
  "keywords": [
    {
      "keyword": "marketing digital premium",
      "search_volume": 1200,
      "competition": "Medium",
      "intent": "informacional"
    },
    {
      "keyword": "comprar curso marketing",
      "search_volume": 890,
      "competition": "High",
      "intent": "transaccional"
    }
  ],
  "cluster_name": "Cursos Marketing",
  "project_name": "Academia Online"
}
```

### Descripción de Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `keywords` | array | ✅ Sí | Array de keywords (strings o objetos) |
| `cluster_name` | string | ❌ No | Nombre del cluster (default: "Manual Import") |
| `project_name` | string | ❌ No | Nombre del proyecto (opcional) |

#### Campos de Keyword (cuando se usa objeto)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `keyword` | string | ✅ Sí | La palabra clave |
| `search_volume` | number | ❌ No | Volumen de búsqueda (default: 0) |
| `competition` | string | ❌ No | Low/Medium/High (default: "Unknown") |
| `intent` | string | ❌ No | informacional/transaccional/navegacional |

---

## 📤 Respuesta

### Respuesta Exitosa (200)
```json
{
  "status": "success",
  "total_saved": 5,
  "message": "5 keywords guardadas correctamente",
  "cluster_name": "Marketing Digital"
}
```

---

## 💻 Ejemplos de Uso

### Ejemplo 1: Keywords Simples

```powershell
$body = @{
    keywords = @(
        "marketing digital",
        "seo local",
        "email marketing"
    )
    cluster_name = "Marketing Basico"
    project_name = "Blog 2025"
} | ConvertTo-Json

Invoke-WebRequest `
    -Uri "http://localhost:5678/webhook/seo/ingesta/manual" `
    -Method Post `
    -Headers @{'Content-Type'='application/json'} `
    -Body $body
```

### Ejemplo 2: Keywords con Metadatos

```powershell
$body = @{
    keywords = @(
        @{
            keyword = "zapatos deportivos"
            search_volume = 12000
            competition = "High"
            intent = "transaccional"
        },
        @{
            keyword = "zapatillas running"
            search_volume = 8500
            competition = "Medium"
            intent = "transaccional"
        }
    )
    cluster_name = "Calzado Deportivo"
    project_name = "Ecommerce Deportes"
} | ConvertTo-Json -Depth 10

Invoke-WebRequest `
    -Uri "http://localhost:5678/webhook/seo/ingesta/manual" `
    -Method Post `
    -Headers @{'Content-Type'='application/json'} `
    -Body $body
```

### Ejemplo 3: Sin project_name (Opcional)

```powershell
$body = @{
    keywords = @("ia empresarial", "automatizacion ia")
    cluster_name = "Inteligencia Artificial"
} | ConvertTo-Json

Invoke-WebRequest `
    -Uri "http://localhost:5678/webhook/seo/ingesta/manual" `
    -Method Post `
    -Headers @{'Content-Type'='application/json'} `
    -Body $body
```

### Ejemplo 4: cURL

```bash
curl -X POST http://localhost:5678/webhook/seo/ingesta/manual \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["keyword 1", "keyword 2"],
    "cluster_name": "Test Cluster"
  }'
```

---

## 🗄️ Estructura del Workflow

### Nodos (6 en total)

1. **Webhook** - Recibe la petición POST
2. **Parse Keywords** - Procesa y normaliza keywords
3. **Guardar en PostgreSQL** - INSERT en tabla `keywords`
4. **Aggregate** - Agrupa todos los resultados
5. **Preparar Respuesta** - Formatea JSON de respuesta
6. **Respond to Webhook** - Devuelve respuesta al cliente

### Flujo de Datos

```
JSON → Parse → PostgreSQL → Aggregate → Response
```

### Lógica de Parse

**Si keyword es string:**
```javascript
{
  keyword: "marketing digital",
  search_volume: 0,
  competition: "Unknown",
  search_intent: "informacional",
  cluster_name: clusterName,
  project_name: projectName,
  source: "manual"
}
```

**Si keyword es objeto:**
```javascript
{
  keyword: keyword.keyword,
  search_volume: keyword.search_volume || 0,
  competition: keyword.competition || "Unknown",
  search_intent: keyword.intent || "informacional",
  cluster_name: clusterName,
  project_name: projectName,
  source: "manual"
}
```

---

## 🔍 Verificación en PostgreSQL

### Ver últimas keywords manuales

```sql
SELECT 
    keyword_principal, 
    search_volume, 
    cluster_name, 
    source,
    created_at
FROM keywords
WHERE source = 'manual'
ORDER BY created_at DESC
LIMIT 10;
```

### Resumen por cluster

```sql
SELECT 
    cluster_name,
    COUNT(*) as total,
    AVG(search_volume) as promedio
FROM keywords
WHERE source = 'manual'
GROUP BY cluster_name
ORDER BY total DESC;
```

---

## 🧪 Testing

### Script de Prueba

```powershell
cd seo-module/scripts
.\test_ingesta.ps1 -Workflow 6
```

### Test Manual Rápido

```powershell
$body = @{
    keywords = @("test rapido")
    cluster_name = "Test"
} | ConvertTo-Json

Invoke-WebRequest `
    -Uri "http://localhost:5678/webhook/seo/ingesta/manual" `
    -Method Post `
    -Headers @{'Content-Type'='application/json'} `
    -Body $body
```

---

## ⚙️ Configuración en n8n

### Requisitos

1. **Workflow activo** (switch verde)
2. **Credenciales PostgreSQL configuradas:**
   - Name: `PostgreSQL MarketAI`
   - Host: `postgres`
   - Database: `marketai_seo`
   - User: `marketai_user`
   - Password: `marketai_secure_password`

### Configuración del Webhook

- **Path:** `seo/ingesta/manual`
- **Method:** POST
- **Response Mode:** `Last Node` ⚠️ IMPORTANTE
- **Authentication:** None

---

## 🔄 Comparación: WF5 vs WF6

| Característica | Workflow 5 (CSV) | Workflow 6 (Manual) |
|----------------|------------------|---------------------|
| **Fuente** | Google Keyword Planner | Ingreso manual/API |
| **Formato** | CSV con headers | JSON (strings/objetos) |
| **Metadatos** | Volumen + Competition | Personalizable |
| **Casos de Uso** | Importación masiva | Keywords específicas |
| **Source Tag** | `gkp` | `manual` |
| **Volumen ideal** | 10-100 keywords | 1-10 keywords |

---

## 🐛 Troubleshooting

### Error 404 - Not Found

**Causa:** El workflow no está activo.  
**Solución:**
1. Abre n8n: http://localhost:5678
2. Busca "SEO - 06 Ingesta Keywords Manual"
3. Activa el workflow (switch verde)

### Respuesta vacía

**Causa:** Workflow en modo TEST.  
**Solución:** Desactiva y reactiva el workflow.

### Error 500 - Credential not found

**Causa:** Credenciales PostgreSQL no configuradas.  
**Solución:** Configura las credenciales en Settings → Credentials.

---

## 📊 Casos de Uso

### 1. Integración con Frontend
```javascript
// Desde aplicación web
fetch('http://localhost:5678/webhook/seo/ingesta/manual', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    keywords: userInput.split('\n'),
    cluster_name: selectedCluster,
    project_name: currentProject
  })
});
```

### 2. Importación desde Excel/CSV personalizado
```powershell
# Leer keywords de archivo
$keywords = Get-Content "keywords.txt"

$body = @{
    keywords = $keywords
    cluster_name = "Importacion Excel"
} | ConvertTo-Json

Invoke-WebRequest -Uri "..." -Method Post -Body $body
```

### 3. Scraping + Ingesta
```powershell
# Keywords desde scraping
$scrapedKeywords = Invoke-ScraperScript

$body = @{
    keywords = $scrapedKeywords
    cluster_name = "Keywords Scraped"
} | ConvertTo-Json

Invoke-WebRequest -Uri "..." -Method Post -Body $body
```

---

## 📚 Documentación Relacionada

- [Ingesta CSV](ingesta-csv.md) - Workflow 5
- [Overview de Workflows](overview.md) - Todos los workflows
- [Troubleshooting](../troubleshooting.md) - Problemas comunes

---

**Última actualización:** 17 Octubre 2025

