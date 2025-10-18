# 📥 Ingesta de Keywords - Documentación API

**Tarea 4:** Endpoint/ingesta de keywords (GKP + manual) y guardado

---

## 🎯 Descripción General

Sistema de ingesta de keywords desde dos fuentes:
1. **CSV de Google Keyword Planner** (automatizado)
2. **Ingreso manual** (interfaz o API)

Ambas fuentes guardan las keywords en PostgreSQL (tabla `keywords`) para su posterior procesamiento.

---

## 📋 Índice

- [Endpoint 1: Ingesta CSV](#endpoint-1-ingesta-csv)
- [Endpoint 2: Ingesta Manual](#endpoint-2-ingesta-manual)
- [Formato CSV de Google Ads](#formato-csv-de-google-ads)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Verificación en Base de Datos](#verificación-en-base-de-datos)
- [Scripts de Prueba](#scripts-de-prueba)

---

## 🔌 Endpoint 1: Ingesta CSV

Importa keywords desde un archivo CSV exportado de Google Keyword Planner.

### **URL**
```
POST http://localhost:5678/webhook/seo/ingesta/csv
```

### **Headers**
```json
{
  "Content-Type": "application/json"
}
```

### **Body**
```json
{
  "csv_data": "Keyword,Avg. monthly searches,Competition\ncafe organico,5400,Medium\ncafe de hongo,1200,Low",
  "nicho": "salud y bienestar",
  "cluster_name": "Café Saludable"
}
```

### **Parámetros**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `csv_data` | string | ✅ Sí | Contenido del CSV de Google Ads |
| `nicho` | string | ❌ No | Nicho de mercado (default: "general") |
| `cluster_name` | string | ❌ No | Nombre del cluster (default: "Keywords Import") |

### **Respuesta Exitosa (200)**
```json
{
  "status": "success",
  "message": "7 keywords importadas correctamente",
  "total_imported": 7
}
```

### **Ejemplo PowerShell**
```powershell
$csv = @"
Keyword,Avg. monthly searches,Competition
cafe organico,5400,Medium
cafe de hongo,1200,Low
cafe de ganoderma,800,Low
"@

$body = @{
    csv_data = $csv
    nicho = "salud y bienestar"
    cluster_name = "Café Funcional"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5678/webhook/seo/ingesta/csv" `
    -Method Post `
    -Headers @{'Content-Type'='application/json'} `
    -Body $body
```

---

## 🔌 Endpoint 2: Ingesta Manual

Permite ingresar keywords manualmente desde la aplicación o API.

### **URL**
```
POST http://localhost:5678/webhook/seo/ingesta/manual
```

### **Headers**
```json
{
  "Content-Type": "application/json"
}
```

### **Body (Simple - Array de strings)**
```json
{
  "keywords": [
    "marketing digital para emprendedores",
    "estrategias de marketing online",
    "publicidad en redes sociales"
  ],
  "nicho": "marketing digital",
  "cluster_name": "Marketing para Emprendedores"
}
```

### **Body (Avanzado - Con metadatos)**
```json
{
  "keywords": [
    {
      "keyword": "marketing digital para emprendedores",
      "search_volume": 1200,
      "competition": "Medium",
      "intent": "informacional"
    },
    {
      "keyword": "estrategias de marketing online",
      "search_volume": 800,
      "competition": "Low",
      "intent": "informacional"
    }
  ],
  "nicho": "marketing digital",
  "cluster_name": "Marketing para Emprendedores"
}
```

### **Parámetros**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `keywords` | array | ✅ Sí | Array de keywords (string o objetos) |
| `nicho` | string | ❌ No | Nicho de mercado (default: "general") |
| `cluster_name` | string | ❌ No | Nombre del cluster (default: "Manual Import") |

### **Respuesta Exitosa (200)**
```json
{
  "status": "success",
  "message": "5 keywords guardadas correctamente",
  "total_saved": 5,
  "cluster_name": "Marketing para Emprendedores"
}
```

### **Ejemplo PowerShell**
```powershell
$body = @{
    keywords = @(
        "marketing digital",
        "seo local",
        "email marketing"
    )
    nicho = "marketing"
    cluster_name = "Marketing Digital"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5678/webhook/seo/ingesta/manual" `
    -Method Post `
    -Headers @{'Content-Type'='application/json'} `
    -Body $body
```

---

## 📄 Formato CSV de Google Ads

### **Formato Esperado**

```csv
Keyword,Avg. monthly searches,Competition,Top of page bid (low)
cafe organico,5400,Medium,1.20
cafe de hongo,1200,Low,0.80
beneficios del cafe,9900,High,1.50
```

### **Columnas Requeridas**
- **Keyword** (Requerida): La palabra clave
- **Avg. monthly searches** (Requerida): Volumen de búsquedas mensual
- **Competition** (Opcional): Low, Medium, High
- **Top of page bid** (Opcional): Se ignora en la importación

### **Cómo Exportar desde Google Ads**

1. Ve a Google Ads → **Herramientas → Planificador de Palabras Clave**
2. Realiza tu búsqueda de keywords
3. Click en **Descargar ideas de palabras clave**
4. Selecciona formato **CSV**
5. Copia el contenido completo del archivo

---

## 💡 Ejemplos de Uso

### **Caso 1: Importar CSV completo de Google Ads**

```powershell
# Leer archivo CSV
$csvContent = Get-Content -Path "keywords_google_ads.csv" -Raw

# Enviar a n8n
$body = @{
    csv_data = $csvContent
    nicho = "e-commerce"
    cluster_name = "Keywords Tienda Online"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5678/webhook/seo/ingesta/csv" `
    -Method Post `
    -Headers @{'Content-Type'='application/json'} `
    -Body $body
```

### **Caso 2: Ingreso rápido manual**

```powershell
$body = @{
    keywords = @("producto 1", "producto 2", "producto 3")
    cluster_name = "Productos Nuevos"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5678/webhook/seo/ingesta/manual" `
    -Method Post `
    -Headers @{'Content-Type'='application/json'} `
    -Body $body
```

### **Caso 3: Ingreso manual con metadatos completos**

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
    nicho = "deportes"
    cluster_name = "Calzado Deportivo"
} | ConvertTo-Json -Depth 10

Invoke-WebRequest -Uri "http://localhost:5678/webhook/seo/ingesta/manual" `
    -Method Post `
    -Headers @{'Content-Type'='application/json'} `
    -Body $body
```

---

## 🔍 Verificación en Base de Datos

### **Ver todas las keywords importadas**
```bash
cd seo-module/n8n
docker compose exec postgres psql -U marketai_user -d marketai_seo -c "SELECT * FROM keywords ORDER BY created_at DESC LIMIT 10;"
```

### **Ver keywords por cluster**
```sql
SELECT 
    cluster_name,
    keyword_principal,
    search_volume,
    competition,
    source,
    created_at
FROM keywords
WHERE cluster_name = 'Café Saludable'
ORDER BY search_volume DESC;
```

### **Estadísticas de importación**
```sql
SELECT 
    cluster_name,
    source,
    COUNT(*) as total_keywords,
    AVG(search_volume) as promedio_busquedas
FROM keywords
GROUP BY cluster_name, source
ORDER BY total_keywords DESC;
```

### **Ver logs de trabajos**
```sql
SELECT 
    job_name,
    job_type,
    status,
    started_at,
    completed_at
FROM jobs_log
WHERE job_type = 'keyword_ingestion'
ORDER BY started_at DESC
LIMIT 5;
```

---

## 🧪 Scripts de Prueba

### **Ubicación**
```
seo-module/scripts/
├── test_ingesta_csv.ps1           # Prueba ingesta CSV
├── test_ingesta_manual.ps1        # Prueba ingesta manual
└── test_completo_ingesta.ps1      # Prueba ambos endpoints
```

### **Ejecutar pruebas**

```powershell
# Probar solo CSV
cd seo-module/scripts
.\test_ingesta_csv.ps1

# Probar solo manual
.\test_ingesta_manual.ps1

# Prueba completa (ambos + verificación DB)
.\test_completo_ingesta.ps1
```

---

## ⚙️ Configuración en n8n

### **Paso 1: Importar Workflows**

1. Abre http://localhost:5678
2. Click en **"+"** → **"Import from File"**
3. Importa ambos workflows:
   - `seo_05_ingesta_keywords.json`
   - `seo_06_ingesta_manual.json`

### **Paso 2: Configurar Credenciales PostgreSQL**

1. Ve a **Settings → Credentials**
2. Click en **"Add Credential"** → **PostgreSQL**
3. Configura:
   ```
   Name: PostgreSQL MarketAI
   Host: postgres (nombre del servicio en Docker)
   Port: 5432
   Database: marketai_seo
   User: marketai_user
   Password: [tu POSTGRES_PASSWORD del .env]
   ```
4. **Save**

### **Paso 3: Asignar Credenciales a Workflows**

En cada workflow:
1. Click en el nodo **"Guardar en PostgreSQL"**
2. En "Credential to connect with", selecciona **"PostgreSQL MarketAI"**
3. **Save** el nodo
4. **Save** el workflow

### **Paso 4: Activar Workflows**

1. Abre cada workflow
2. Activa el switch **"Active"** (debe estar en verde/ON)
3. Verifica que no haya errores (⚠️)

---

## 🐛 Troubleshooting

### **Error: "Webhook not registered"**
- ✅ Verifica que el workflow esté **activo** (switch en ON)
- ✅ Revisa que la URL sea `/webhook/` no `/webhook-test/`

### **Error: "Credential not found"**
- ✅ Configura las credenciales de PostgreSQL en n8n
- ✅ Asigna la credencial al nodo de PostgreSQL

### **Error: "Connection refused"**
- ✅ Verifica que PostgreSQL esté corriendo: `docker compose ps`
- ✅ Verifica las variables en el .env

### **Keywords no se guardan**
- ✅ Verifica los logs del workflow en n8n
- ✅ Revisa la consola de PostgreSQL: `docker compose logs postgres`
- ✅ Verifica que la tabla `keywords` exista

---

## 📊 Métricas

- **Tiempo de importación CSV (10 keywords):** ~2-3 segundos
- **Tiempo ingesta manual (5 keywords):** ~1-2 segundos
- **Límite recomendado por batch:** 100 keywords
- **Keywords duplicadas:** Se actualizan (no se insertan de nuevo)

---

## 🔄 Próximos Pasos

Una vez importadas las keywords:

1. **Tarea 5:** Clustering automático con IA (Prompt #1)
2. **Tarea 6:** Generación de 30 ideas (Prompt #2)
3. **Tarea 7-9:** Redacción de artículos
4. **Tarea 10:** Generación de imágenes

---

**Última actualización:** 17 Octubre 2025  
**Estado:** Tarea 4 lista para testing  
**Workflows:** 2 workflows de ingesta creados

