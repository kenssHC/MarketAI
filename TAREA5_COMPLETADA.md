# ✅ Tarea 5 Completada: Job "Cluster de Keywords"

**Fecha:** 18 de Octubre, 2025  
**Estado:** ✅ **COMPLETADA**

---

## 🎯 Objetivo Cumplido

Se ha implementado el job/workflow que toma keywords importadas (Tarea 4) y las agrupa en clusters temáticos usando el Prompt #1, guardando los resultados en PostgreSQL.

---

## 📦 Entregables

### 1. ✅ Workflow 7: SEO - 07 Clustering de Keywords

**Archivo:** `seo-module/n8n/workflows/SEO - 07 Clustering de Keywords.json`

**Especificaciones:**
- 15 nodos interconectados
- Endpoint: `POST /webhook-test/seo/clustering`
- Lee keywords pendientes de PostgreSQL
- Usa Prompt #1 oficial con OpenAI (GPT-4o)
- Guarda clusters en PostgreSQL
- Marca keywords originales como 'archived'
- Respuesta JSON estructurada

**Nodos implementados:**
1. Webhook (POST /seo/clustering)
2. Leer Keywords Pendientes (PostgreSQL)
3. Check Keywords Existen (IF)
4. Preparar Array Keywords (Code)
5. Construir Prompt (Code - Prompt #1)
6. OpenAI Chat (GPT-4o, temp 0.7, 2000 tokens)
7. Parse JSON Response (Code)
8. Preparar Datos Cluster (Code)
9. Insertar Cluster (PostgreSQL)
10. Archivar Keywords Originales (PostgreSQL)
11. Aggregate Clusters (Aggregate)
12. Preparar Respuesta Final (Code)
13. Respond to Webhook Success (Webhook Response)
14. Mensaje No Keywords (Code - para caso sin keywords)
15. Respond to Webhook No Keywords (Webhook Response)

---

### 2. ✅ Script de Prueba Individual

**Archivo:** `seo-module/scripts/test_workflow7.ps1`

**Funcionalidad:**
- Prueba el Workflow 7 individualmente
- Soporta filtros opcionales (project_name, limit)
- Muestra clusters generados
- Timeout de 60 segundos
- Instrucciones de troubleshooting incluidas

**Uso:**
```powershell
cd seo-module\scripts
.\test_workflow7.ps1
```

---

### 3. ✅ Script E2E (Ingesta + Clustering)

**Archivo:** `seo-module/scripts/test_e2e_ingesta_clustering.ps1`

**Funcionalidad:**
- Test completo del flujo Tarea 4 → Tarea 5
- Limpia datos previos
- Importa 10 keywords de prueba
- Ejecuta clustering
- Muestra resultados completos
- Verifica ambos workflows

**Flujo:**
1. Limpia datos de tests anteriores
2. Importa keywords (Workflow 5)
3. Verifica keywords pendientes en DB
4. Ejecuta clustering (Workflow 7)
5. Muestra estadísticas y clusters

**Uso:**
```powershell
cd seo-module\scripts
.\test_e2e_ingesta_clustering.ps1
```

---

### 4. ✅ Actualización de test_workflows.ps1

**Modificado:** `seo-module/scripts/test_workflows.ps1`

**Cambios:**
- Agregado test del Workflow 7
- Actualizado de "6 workflows" a "7 workflows"
- Incluido endpoint `/webhook/seo/clustering`
- Timeout de 30 segundos para clustering
- Detecta errores de OpenAI API key

---

### 5. ✅ Documentación Técnica

**Archivo:** `seo-module/TAREA5_ANALISIS.md`

**Contenido:**
- Análisis completo del Prompt #1
- Diseño detallado del workflow (537 líneas)
- Flujo de 14 nodos documentado
- Código JavaScript de cada nodo
- Queries SQL completos
- Plan de pruebas
- Consideraciones de performance
- Métricas de éxito

---

## 🧪 Pruebas Realizadas

### ✅ Test 1: Workflow Individual
```powershell
.\test_workflow7.ps1
```
**Resultado:** Funciona correctamente con keywords pendientes

### ✅ Test 2: Flujo E2E
```powershell
.\test_e2e_ingesta_clustering.ps1
```
**Resultado:** 
- Importa 10 keywords ✅
- Genera 2-3 clusters ✅
- Archiva keywords originales ✅

### ✅ Test 3: Verificación de Todos los Workflows
```powershell
.\test_workflows.ps1
```
**Resultado:** 7 de 7 workflows verificados

---

## 📊 Cómo se Demuestra "Terminado"

Según la lista de tareas original:

| Criterio | Estado |
|----------|--------|
| **JSON agrupado guardado en DB** | ✅ Clusters guardados con keyword_principal + keywords_secundarias[] |
| **Archivo de muestra** | ✅ `SEO - 07 Clustering de Keywords.json` |
| **Endpoint funcional** | ✅ `POST /webhook/seo/clustering` |
| **Usa Prompt #1** | ✅ Implementado textualmente |
| **Guarda en PostgreSQL** | ✅ Tabla `keywords` con status='processed' |
| **Keywords archivadas** | ✅ Keywords originales con status='archived' |
| **Test automatizado** | ✅ `test_workflow7.ps1` y `test_e2e_ingesta_clustering.ps1` |

---

## 🎨 Estructura de Datos

### Entrada (Body del Webhook)
```json
{
  "project_name": "Proyecto X",  // Opcional
  "limit": 50                     // Opcional (default: 100)
}
```

### Salida (Response)
```json
{
  "status": "success",
  "total_keywords_processed": 10,
  "total_clusters_created": 3,
  "clusters": [
    {
      "cluster_name": "Cluster 1",
      "keyword_principal": "cafe organico",
      "keywords_secundarias": ["cafe saludable", "cafe sin pesticidas"],
      "id": "uuid-123"
    }
  ],
  "processing_time": "2025-10-18T03:15:30.000Z"
}
```

### Base de Datos (PostgreSQL)
```sql
-- Keywords Procesadas
SELECT cluster_name, keyword_principal, keywords_secundarias, status
FROM keywords 
WHERE status = 'processed';

-- Keywords Archivadas
SELECT keyword_principal, status
FROM keywords 
WHERE status = 'archived';
```

---

## 📈 Métricas Alcanzadas

- ✅ Workflow ejecuta sin errores
- ✅ Keywords se agrupan correctamente por similitud semántica
- ✅ Cada cluster tiene 1 principal + 2-5 secundarias
- ✅ Status se actualiza a 'processed' y 'archived'
- ✅ Response JSON válido y completo
- ✅ Idempotente (se puede ejecutar múltiples veces)
- ✅ Maneja caso sin keywords pendientes
- ✅ Timeout configurado apropiadamente
- ✅ Logs claros de errores

---

## 🚀 Cómo Usar

### Setup Inicial

1. **Importar workflow en n8n:**
   - Abrir http://localhost:5678
   - Import → Seleccionar `SEO - 07 Clustering de Keywords.json`
   - Configurar credenciales de PostgreSQL y OpenAI
   - Activar el workflow (toggle en verde)

2. **Verificar configuración:**
   ```powershell
   cd seo-module\scripts
   .\verificar_sistema.ps1
   ```

### Uso Diario

**Opción A: Flujo E2E completo**
```powershell
# 1. Importar keywords
.\test_workflow5.ps1  # O test_workflow6.ps1

# 2. Ejecutar clustering
.\test_workflow7.ps1

# O todo junto:
.\test_e2e_ingesta_clustering.ps1
```

**Opción B: Solo clustering (con keywords ya importadas)**
```powershell
.\test_workflow7.ps1
```

**Opción C: Via API directa**
```powershell
Invoke-WebRequest `
  -Uri "http://localhost:5678/webhook-test/seo/clustering" `
  -Method Post `
  -Headers @{'Content-Type'='application/json'} `
  -Body '{"project_name":"Mi Proyecto","limit":50}'
```

---

## 🔄 Flujo Completo (Tarea 4 + 5)

```
┌─────────────────────────────────────────────────────────────────┐
│                     TAREA 4: INGESTA                             │
├─────────────────────────────────────────────────────────────────┤
│  Workflow 5 (CSV) o Workflow 6 (Manual)                         │
│  ↓                                                                │
│  Keywords guardadas en PostgreSQL                                │
│  - status: 'pending'                                             │
│  - cluster_name: 'Import X'                                      │
│  - keywords_secundarias: []                                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    TAREA 5: CLUSTERING                           │
├─────────────────────────────────────────────────────────────────┤
│  Workflow 7 (Clustering)                                         │
│  ↓                                                                │
│  1. Lee keywords con status='pending'                            │
│  2. Agrupa con OpenAI (Prompt #1)                               │
│  3. Crea clusters en PostgreSQL                                  │
│     - status: 'processed'                                        │
│     - cluster_name: 'Cluster X'                                  │
│     - keyword_principal: 'keyword principal'                     │
│     - keywords_secundarias: ['kw1', 'kw2', ...]                 │
│  4. Archiva keywords originales                                  │
│     - status: 'archived'                                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                 PRÓXIMA TAREA 6: IDEAS                           │
├─────────────────────────────────────────────────────────────────┤
│  Lee clusters con status='processed'                             │
│  Genera 30 ideas por cluster                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Consideraciones de Producción

1. **Límite de Keywords:** Default 100 para evitar prompts muy largos
2. **Costo OpenAI:** ~0.01-0.05 USD por ejecución (dependiendo de cantidad de keywords)
3. **Timeout:** 60 segundos configurado, ajustar si hay muchas keywords
4. **Duplicados:** El UNIQUE constraint en `keyword_principal` previene duplicados
5. **Idempotencia:** Se puede ejecutar múltiples veces con ON CONFLICT DO UPDATE
6. **Performance:** Para miles de keywords, considerar batching

---

## 📚 Archivos Relacionados

### Workflows
- `n8n/workflows/SEO - 07 Clustering de Keywords.json` - Workflow principal
- `n8n/workflows/SEO - 05 Ingesta Keywords CSV.json` - Ingesta CSV
- `n8n/workflows/SEO - 06 Ingesta Keywords Manual.json` - Ingesta Manual

### Scripts
- `scripts/test_workflow7.ps1` - Test individual Workflow 7
- `scripts/test_e2e_ingesta_clustering.ps1` - Test E2E completo
- `scripts/test_workflows.ps1` - Test todos los workflows (1-7)

### Documentación
- `TAREA5_ANALISIS.md` - Análisis técnico detallado (537 líneas)
- `prompts/v1/01_keywords_clustering.md` - Prompt #1 oficial
- `TAREA5_COMPLETADA.md` - Este documento

### Base de Datos
- `n8n/migrations/001_initial_schema.sql` - Esquema PostgreSQL

---

## 🎓 Lecciones Aprendidas

1. **Estructura de n8n:** Los workflows 5 y 6 que funcionaban bien fueron la mejor referencia
2. **Manejo de NULL en PostgreSQL:** Usar ON CONFLICT con UPSERT funciona perfectamente
3. **OpenAI Response:** Necesita limpieza de markdown code blocks
4. **Testing:** Scripts E2E son esenciales para validar flujo completo
5. **Documentación:** El análisis previo (TAREA5_ANALISIS.md) fue clave para implementación sin errores

---

## ✅ Criterios de Aceptación

- [x] Workflow 7 creado e importable
- [x] Usa Prompt #1 oficial
- [x] Lee keywords de PostgreSQL (status='pending')
- [x] Llama a OpenAI con configuración correcta
- [x] Parsea JSON response correctamente
- [x] Guarda clusters en PostgreSQL
- [x] Archiva keywords originales
- [x] Retorna response JSON estructurada
- [x] Script de prueba individual creado
- [x] Script E2E creado
- [x] test_workflows.ps1 actualizado
- [x] Documentación completa
- [x] Maneja errores apropiadamente
- [x] Timeout configurado
- [x] Credenciales de PostgreSQL configuradas
- [x] Credenciales de OpenAI configuradas

---

**Estado Final:** ✅ **TAREA 5 COMPLETADA**

**Próxima tarea:** Tarea 6 - Job "30 ideas y clasificación" (LLM)

---

**Timestamp:** 2025-10-18T03:30:00Z  
**Implementado por:** Claude (Cursor Agent)  
**Revisado:** Pendiente

