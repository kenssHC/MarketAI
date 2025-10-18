# 📥 Workflow 5: Ingesta CSV

Importa keywords desde archivos CSV exportados de Google Keyword Planner.

---

## 🎯 Descripción

El Workflow 5 permite importar keywords masivamente desde archivos CSV generados por Google Ads Keyword Planner, guardándolas automáticamente en PostgreSQL para su posterior procesamiento.

**Archivo:** `n8n/workflows/seo_05_ingesta_keywords.json`

---

## 🔌 Endpoint

```
POST http://localhost:5678/webhook/seo/ingesta/csv
```

---

## 📋 Parámetros de Entrada

### Headers
```json
{
  "Content-Type": "application/json"
}
```

### Body
```json
{
  "csv_data": "Keyword,Avg. monthly searches,Competition\ncafe organico,5400,Medium\ncafe de hongo,1200,Low",
  "cluster_name": "Café Saludable",
  "project_name": "Proyecto Cafe 2025"
}
```

### Descripción de Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `csv_data` | string | ✅ Sí | Contenido del CSV de Google Keyword Planner |
| `cluster_name` | string | ❌ No | Nombre del cluster (default: "Keywords Import") |
| `project_name` | string | ❌ No | Nombre del proyecto (opcional) |

---

## 📤 Respuesta

### Respuesta Exitosa (200)
```json
{
  "status": "success",
  "total_imported": 7,
  "message": "7 keywords importadas correctamente"
}
```

### Errores Comunes

**404 - Not Found**
```json
{
  "message": "Webhook not found"
}
```
**Causa:** El workflow no está activo.  
**Solución:** Activa el workflow en n8n.

**500 - Internal Server Error**
**Causa:** Error en credenciales de PostgreSQL.  
**Solución:** Verifica las credenciales en Settings → Credentials.

---

## 📄 Formato CSV Esperado

### Formato de Google Keyword Planner

```csv
Keyword,Avg. monthly searches,Competition,Top of page bid (low)
cafe organico,5400,Medium,1.20
cafe de hongo,1200,Low,0.80
beneficios del cafe,9900,High,1.50
```

### Columnas Requeridas
- **Keyword** (Requerida): La palabra clave
- **Avg. monthly searches** (Requerida): Volumen de búsquedas mensual
- **Competition** (Opcional): Low, Medium, High

---

## 💻 Ejemplos de Uso

### Ejemplo 1: PowerShell - CSV Básico

```powershell
$csvData = @"
Keyword,Avg. monthly searches,Competition
cafe organico,5400,Medium
cafe de hongo,1200,Low
beneficios del cafe,9900,High
"@

$body = @{
    csv_data = $csvData
    cluster_name = "Cafe Saludable"
    project_name = "Ecommerce Cafe"
} | ConvertTo-Json

$response = Invoke-WebRequest `
    -Uri "http://localhost:5678/webhook/seo/ingesta/csv" `
    -Method Post `
    -Headers @{'Content-Type'='application/json'} `
    -Body $body `
    -UseBasicParsing

$response.Content | ConvertFrom-Json
```

### Ejemplo 2: PowerShell - Desde Archivo

```powershell
# Leer archivo CSV
$csvContent = Get-Content -Path "keywords_google_ads.csv" -Raw

# Enviar a n8n
$body = @{
    csv_data = $csvContent
    cluster_name = "Keywords Tienda Online"
    project_name = "E-commerce 2025"
} | ConvertTo-Json

Invoke-WebRequest `
    -Uri "http://localhost:5678/webhook/seo/ingesta/csv" `
    -Method Post `
    -Headers @{'Content-Type'='application/json'} `
    -Body $body
```

### Ejemplo 3: cURL

```bash
curl -X POST http://localhost:5678/webhook/seo/ingesta/csv \
  -H "Content-Type: application/json" \
  -d '{
    "csv_data": "Keyword,Avg. monthly searches\ncafe organico,5400\ncafe de hongo,1200",
    "cluster_name": "Cafe",
    "project_name": "Test"
  }'
```

---

## 🗄️ Estructura del Workflow

### Nodos (6 en total)

1. **Webhook** - Recibe la petición POST
2. **Parse CSV** - Procesa el CSV y extrae keywords
3. **Guardar en PostgreSQL** - INSERT en tabla `keywords`
4. **Aggregate** - Agrupa todos los resultados
5. **Preparar Respuesta** - Formatea JSON de respuesta
6. **Respond to Webhook** - Devuelve respuesta al cliente

### Flujo de Datos

```
CSV → Parse → PostgreSQL → Aggregate → Response
```

---

## 🔍 Verificación en PostgreSQL

### Ver últimas keywords importadas

```bash
cd seo-module/n8n
docker compose exec postgres psql -U marketai_user -d marketai_seo
```

```sql
SELECT 
    keyword_principal, 
    search_volume, 
    cluster_name, 
    source,
    created_at
FROM keywords
WHERE source = 'gkp'
ORDER BY created_at DESC
LIMIT 10;
```

### Estadísticas de importación

```sql
SELECT 
    cluster_name,
    COUNT(*) as total_keywords,
    AVG(search_volume) as promedio_busquedas,
    MAX(search_volume) as max_busquedas
FROM keywords
WHERE source = 'gkp'
GROUP BY cluster_name
ORDER BY total_keywords DESC;
```

---

## 🧪 Testing

### Script de Prueba

```powershell
cd seo-module/scripts
.\test_ingesta.ps1 -Workflow 5
```

### Test Manual Rápido

```powershell
$csv = "Keyword,Avg. monthly searches`ntest keyword,100"
$body = @{ csv_data = $csv; cluster_name = "Test" } | ConvertTo-Json

Invoke-WebRequest `
    -Uri "http://localhost:5678/webhook/seo/ingesta/csv" `
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

- **Path:** `seo/ingesta/csv`
- **Method:** POST
- **Response Mode:** `Last Node` ⚠️ IMPORTANTE
- **Authentication:** None

---

## 🐛 Troubleshooting

### Error: "Workflow was started" (sin datos)

**Síntoma:** El endpoint devuelve `{"message":"Workflow was started"}` en lugar de datos.

**Causa:** El webhook está en modo TEST en lugar de PRODUCTION.

**Solución:**
1. Abre el workflow en n8n
2. Verifica que esté **ACTIVO** (switch verde)
3. Si ya está activo, desactívalo y vuélvelo a activar
4. Ejecuta el workflow una vez manualmente

### Keywords duplicadas

**Comportamiento:** Las keywords con el mismo `keyword_principal` se actualizan en lugar de duplicarse.

**Esto es normal:** El workflow usa `ON CONFLICT DO UPDATE` para actualizar datos existentes.

---

## 📊 Métricas

- **Tiempo de importación:** ~2-3 segundos por cada 10 keywords
- **Límite recomendado:** 100 keywords por batch
- **Rate limit:** Sin límite (local)

---

## 📚 Documentación Relacionada

- [Ingesta Manual](ingesta-manual.md) - Workflow 6
- [Overview de Workflows](overview.md) - Todos los workflows
- [Troubleshooting](../troubleshooting.md) - Problemas comunes

---

**Última actualización:** 17 Octubre 2025

