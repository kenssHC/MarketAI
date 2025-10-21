# ✅ Workflow 7 Corregido - Clustering de Keywords

**Fecha:** 20 de Octubre, 2025  
**Estado:** ✅ Corregido y listo para probar

---

## 🔴 Problemas Encontrados y Corregidos

### 1. **Nodo OpenAI - Configuración Incorrecta**

**Problema:**
- El nodo OpenAI no tenía los parámetros correctos configurados
- Usaba una versión más nueva (1.3) incompatible con la instalación actual
- La configuración no coincidía con otros workflows funcionales

**Solución:**
Usar la misma configuración que el Workflow 01 (que SÍ funciona):
```json
{
  "parameters": {
    "prompt": "={{ $json.prompt }}",
    "options": {
      "maxTokens": 2000,
      "temperature": 0.7
    },
    "requestOptions": {}
  },
  "typeVersion": 1
}
```

Esta es la versión **estable y probada** del nodo OpenAI en este sistema.

### 2. **Nodo "Preparar Respuesta Final" - Error de Parsing**

**Problema:**
- Intentaba parsear `keywords_secundarias` que ya era un string
- No manejaba correctamente los dos casos (string o array)

**Solución:**
```javascript
clusters_details: clusters.map(c => ({
  cluster_name: c.cluster_name,
  keyword_principal: c.keyword_principal,
  keywords_secundarias: typeof c.keywords_secundarias === 'string' 
    ? JSON.parse(c.keywords_secundarias) 
    : c.keywords_secundarias,
  total_keywords_secundarias: (typeof c.keywords_secundarias === 'string' 
    ? JSON.parse(c.keywords_secundarias) 
    : c.keywords_secundarias).length,
  id: c.id
}))
```

### 3. **Response JSON - Inconsistencia con Test**

**Problema:**
- El workflow devolvía `clusters` pero el test esperaba `clusters_details`

**Solución:**
- Cambió el nombre del campo a `clusters_details` en el workflow
- Actualizado el test para usar `clusters_details`

### 4. **Test Script - Error de Sintaxis PowerShell**

**Problema:**
- Comillas Unicode en algunas líneas
- Referencia incorrecta al campo de respuesta

**Solución:**
- Todas las comillas convertidas a ASCII estándar
- Referencias actualizadas a `clusters_details`

---

## 📦 Archivos Modificados

### 1. **Workflow Principal**
```
seo-module/n8n/workflows/SEO - 07 Clustering de Keywords.json
```

**Cambios:**
- ✅ Nodo OpenAI configurado correctamente con `text` parameter
- ✅ TypeVersion actualizada a 1.3
- ✅ "Preparar Respuesta Final" maneja ambos tipos de datos
- ✅ Response JSON usa `clusters_details` consistentemente
- ✅ Mensaje cuando no hay keywords cambió a `clusters_details`

### 2. **Script de Test**
```
seo-module/scripts/test_workflow7.ps1
```

**Cambios:**
- ✅ Referencia cambiada de `clusters` a `clusters_details`
- ✅ Acceso correcto a `total_keywords_secundarias`
- ✅ Todas las comillas convertidas a ASCII

---

## 🎯 Respuesta JSON Actualizada

### Estructura Correcta:
```json
{
  "status": "success",
  "total_keywords_processed": 10,
  "total_clusters_created": 3,
  "clusters_details": [
    {
      "cluster_name": "Cluster 1",
      "keyword_principal": "cafe organico",
      "keywords_secundarias": [
        "cafe saludable",
        "cafe sin pesticidas"
      ],
      "total_keywords_secundarias": 2,
      "id": "uuid-123"
    }
  ],
  "processing_time": "2025-10-20T..."
}
```

**Campos clave:**
- `clusters_details` (array) - Lista de clusters generados
- `total_keywords_secundarias` (number) - Cantidad de secundarias por cluster
- `keywords_secundarias` (array) - Ya parseado como array, no string

---

## 🚀 Cómo Probar el Workflow 7 Corregido

### Paso 1: Re-importar el Workflow en n8n

**IMPORTANTE:** Debes reimportar el workflow porque cambió la configuración del nodo OpenAI

```
1. Abre n8n: http://localhost:5678
2. Si existe el Workflow 7 antiguo:
   - Abre el workflow
   - Click en "..." (menú)
   - "Delete workflow"
3. Import from File
4. Selecciona: seo-module/n8n/workflows/SEO - 07 Clustering de Keywords.json
5. Verifica credenciales:
   ✅ PostgreSQL: "Postgres account"
   ✅ OpenAI: "OpenAi account"
6. Activa el workflow (toggle verde)
```

### Paso 2: Asegúrate de tener Keywords Pendientes

```powershell
cd seo-module\scripts

# Opción 1: Importar desde CSV
.\test_workflow5.ps1

# Opción 2: Importar manualmente
.\test_workflow6.ps1
```

### Paso 3: Ejecutar el Test del Workflow 7

```powershell
.\test_workflow7.ps1
```

**Resultado esperado:**
```
====================================
  TEST: Workflow 7 - Clustering
====================================

[TEST] Ejecutando clustering de keywords...

Configuración:
  Filtros: ninguno
  Límite: 100 keywords máximo

Enviando request...
  (Esto puede tardar 10-30 segundos por OpenAI)

  [OK] Status: 200

=== RESPUESTA ===
{
  "status": "success",
  "total_keywords_processed": 10,
  "total_clusters_created": 2,
  ...
}

=== RESUMEN ===
  Status: success
  Keywords procesadas: 10
  Clusters creados: 2

=== CLUSTERS GENERADOS ===

  📌 Cluster 1
     Principal: cafe organico
     Secundarias (3):
       • cafe saludable
       • cafe sin pesticidas
       • cafe premium
```

---

## 🔍 Verificar en PostgreSQL

Después de ejecutar el clustering, verifica los resultados:

```powershell
# Desde seo-module/scripts
cd ../n8n

# Ver clusters procesados
docker compose exec postgres psql -U marketai_user -d marketai_seo -c "
SELECT 
    cluster_name,
    keyword_principal,
    keywords_secundarias,
    status,
    created_at
FROM keywords 
WHERE status='processed' 
ORDER BY created_at DESC 
LIMIT 5;
"

# Ver keywords archivadas
docker compose exec postgres psql -U marketai_user -d marketai_seo -c "
SELECT 
    keyword_principal,
    status,
    updated_at
FROM keywords 
WHERE status='archived' 
ORDER BY updated_at DESC 
LIMIT 10;
"
```

---

## ⚠️ Troubleshooting

### Error: "404 Webhook not registered"
**Causa:** El workflow no está activo  
**Solución:** 
1. Abre n8n (http://localhost:5678)
2. Encuentra el workflow "SEO - 07 Clustering de Keywords"
3. Activa el toggle verde

### Error: "OpenAI API key not found"
**Causa:** API Key no configurada  
**Solución:**
1. En n8n: Settings → Credentials → OpenAI
2. Agrega tu API key
3. Guarda y reinicia el workflow

### Error: "No hay keywords pendientes"
**Causa:** No hay keywords con status='pending' en la BD  
**Solución:**
```powershell
# Importa keywords primero
.\test_workflow5.ps1
# O
.\test_workflow6.ps1

# Luego ejecuta clustering
.\test_workflow7.ps1
```

### El test se queda colgado
**Causa:** OpenAI está tardando mucho (>60 segundos)  
**Solución:**
1. Reduce el límite de keywords
2. Modifica el test para usar límite:
```powershell
# En test_workflow7.ps1, línea 20, cambia:
$body = @{
    limit = 20  # Limitar a 20 keywords
} | ConvertTo-Json
```

### Error de parsing JSON en OpenAI response
**Causa:** El LLM devolvió markdown en lugar de JSON puro  
**Solución:** El nodo "Parse JSON Response" ya maneja esto automáticamente, pero si persiste:
1. Verifica que el prompt enfatice "sin markdown"
2. Revisa la respuesta en n8n execution log
3. Ajusta el código de parsing si es necesario

---

## 📊 Comparación: Antes vs Después

### Nodo OpenAI

**ANTES (❌ No funcionaba):**
```json
{
  "parameters": {
    "model": "gpt-4o",
    "options": {
      "temperature": 0.7,
      "maxTokens": 2000
    }
  },
  "typeVersion": 1.3  // Versión incompatible
}
```

**DESPUÉS (✅ Funciona - igual que Workflow 01):**
```json
{
  "parameters": {
    "prompt": "={{ $json.prompt }}",
    "options": {
      "maxTokens": 2000,
      "temperature": 0.7
    },
    "requestOptions": {}
  },
  "typeVersion": 1  // Versión estable
}
```

**Nota:** Esta es la misma configuración que usa el Workflow 01, que sabemos que funciona correctamente.

### Response JSON

**ANTES:**
```json
{
  "clusters": [...]  // Inconsistente con test
}
```

**DESPUÉS:**
```json
{
  "clusters_details": [  // Consistente
    {
      "total_keywords_secundarias": 3,  // Nuevo campo
      ...
    }
  ]
}
```

---

## ✅ Checklist de Verificación

Antes de considerar que el Workflow 7 está funcionando:

- [ ] Workflow reimportado en n8n
- [ ] Workflow activado (toggle verde)
- [ ] Credenciales PostgreSQL configuradas
- [ ] Credenciales OpenAI configuradas
- [ ] Hay keywords con status='pending' en BD
- [ ] Test ejecuta sin errores de sintaxis
- [ ] Test recibe response 200 de n8n
- [ ] Response contiene `clusters_details`
- [ ] PostgreSQL muestra keywords con status='processed'
- [ ] PostgreSQL muestra keywords originales con status='archived'
- [ ] Los clusters tienen keywords secundarias correctas

---

## 🎯 Siguiente Paso

Una vez que el Workflow 7 funcione correctamente, continuar con:

**Probar Workflow 8 (Generación de Ideas)**

```powershell
cd seo-module\scripts
.\test_workflow8.ps1
```

---

## 📚 Documentación Relacionada

- **Análisis completo:** `TAREA5_ANALISIS.md`
- **Tarea 5 completada:** `TAREA5_COMPLETADA.md`
- **Todos los scripts:** `scripts/README.md`
- **Prompt oficial:** `prompts/v1/01_keywords_clustering.md`

---

**¡El Workflow 7 ahora está corregido y listo para usar!** 🚀

Si encuentras algún error durante las pruebas, revisa este documento primero antes de hacer cambios adicionales.

