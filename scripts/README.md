# 📜 Scripts de Prueba y Verificación

    ??? test_workflow10.ps1 (Investigacion Deep Research) ??? NUEVO
# 📜 Scripts de Prueba y Verificación

Este directorio contiene **16 scripts organizados** para probar y verificar el módulo SEO de MarketAI.

---

## 🎯 Scripts de Verificación General (4)

### 1. `verificar_sistema.ps1`
**Propósito:** Verifica que toda la infraestructura esté funcionando

**Qué verifica:**
- ✅ Docker Desktop instalado y corriendo
- ✅ Contenedores n8n y PostgreSQL activos
- ✅ n8n UI accesible en `http://localhost:5678`
- ✅ PostgreSQL acepta conexiones
- ✅ Tabla `keywords` existe

**Uso:**
```powershell
cd seo-module\scripts
.\verificar_sistema.ps1
```

---

### 2. `verificar_sprint.ps1`
**Propósito:** Verificación completa para Daily Sprint

**Qué verifica:**
- 📁 Estructura del proyecto completa
- 🔧 Workflows exportados (6 en total)
- 🐳 Docker Compose configurado
- 🗄️ PostgreSQL con esquema completo
- 📚 Documentación disponible

**Uso:**
```powershell
.\verificar_sprint.ps1
```

---

### 3. `test_workflows.ps1`
**Propósito:** Prueba todos los 9 workflows a la vez

**Qué hace:**
- 🔄 Ejecuta un test rápido en cada workflow
- ⏱️ Timeout de 10 segundos por workflow
- 📊 Muestra resumen final con estado de cada uno
- 🧹 Limpia datos de test automáticamente

**Uso:**
```powershell
.\test_workflows.ps1
```

**Resultado esperado:**
```
[1/6] Workflow 1 - Keywords Analysis...
  [OK] Activo - Status: 200

[2/6] Workflow 2 - Ideas Generator...
  [OK] Activo - Status: 200

...

[OK] TODOS LOS WORKFLOWS ACTIVOS ✅
```

---

## 🔬 Scripts de Prueba Individual (10)

Cada workflow tiene su propio script de prueba detallado.

### 4. `test_workflow1.ps1` - Keywords Analysis
**Workflow:** SEO - 01 Generación de Keywords  
**Endpoint:** `/webhook-test/seo/keywords`  
**Requiere:** OpenAI API Key

**Prueba:**
```powershell
.\test_workflow1.ps1
```

**Datos de prueba:**
- Tema: "marketing digital"
- Nicho: "tecnologia"
- Intención: "informacional"

---

### 5. `test_workflow2.ps1` - Ideas Generator
**Workflow:** SEO - 02 Clasificación de Ideas  
**Endpoint:** `/webhook-test/seo/ideas`  
**Requiere:** OpenAI API Key

**Prueba:**
```powershell
.\test_workflow2.ps1
```

**Datos de prueba:**
- Keywords: ["seo", "marketing digital", "contenido"]
- Tema: "marketing digital"
- Objetivo: "generar trafico organico"

---

### 6. `test_workflow3.ps1` - Redacción de Contenido
**Workflow:** SEO - 03 Redacción de Contenido  
**Endpoint:** `/webhook-test/seo/redaccion`  
**Requiere:** OpenAI API Key

**Prueba:**
```powershell
.\test_workflow3.ps1
```

**Datos de prueba:**
- Keyword principal: "marketing digital"
- Keywords secundarias: ["seo", "contenido", "estrategias"]
- Tono: "profesional"
- Extensión: 500 palabras

---

### 7. `test_workflow4.ps1` - Formateo a HTML
**Workflow:** SEO - 04 Formateo a HTML  
**Endpoint:** `/webhook-test/seo/formatear`  
**Requiere:** Nada (no usa OpenAI)

**Prueba:**
```powershell
.\test_workflow4.ps1
```

**Datos de prueba:**
- Título: "Guía de Marketing Digital"
- 2 secciones con contenido

---

### 8. `test_workflow5.ps1` - Ingesta CSV
**Workflow:** SEO - 05 Ingesta Keywords CSV  
**Endpoint:** `/webhook-test/seo/ingesta/csv`  
**Requiere:** PostgreSQL

**Prueba:**
```powershell
.\test_workflow5.ps1
```

**Qué hace:**
- Importa keywords desde CSV de Google Keyword Planner
- 3 tests diferentes (simple, completo, con líneas vacías)
- Total: 11 keywords de prueba
- Verifica en PostgreSQL automáticamente

**Datos de prueba:**
```csv
Keyword,Avg. monthly searches,Competition
cafe organico,5400,Medium
cafe de hongo,1200,Low
beneficios del cafe,9900,High
```

---

### 9. `test_workflow6.ps1` - Ingesta Manual
**Workflow:** SEO - 06 Ingesta Keywords Manual  
**Endpoint:** `/webhook-test/seo/ingesta/manual`  
**Requiere:** PostgreSQL

**Prueba:**
```powershell
.\test_workflow6.ps1
```

**Qué hace:**
- Importa keywords manualmente (sin CSV)
- 5 keywords de prueba
- Verifica en PostgreSQL

**Datos de prueba:**
- Cluster: "Marketing para Emprendedores"
- Keywords: ["marketing digital para emprendedores", ...]

---

### 10. `test_workflow7.ps1` - Clustering de Keywords ⭐ **NUEVO**
**Workflow:** SEO - 07 Clustering de Keywords  
**Endpoint:** `/webhook-test/seo/clustering`  
**Requiere:** PostgreSQL + OpenAI API Key

**Prueba:**
```powershell
.\test_workflow7.ps1
```

**Qué hace:**
- Lee keywords pendientes de PostgreSQL
- Agrupa keywords en clusters temáticos usando IA
- Usa el Prompt #1 oficial
- Guarda clusters en PostgreSQL
- Archiva keywords originales
- Muestra clusters generados con principal + secundarias

**Datos de entrada:**
```json
{
  "project_name": "Proyecto X",  // Opcional
  "limit": 50                     // Opcional
}
```

**Respuesta:**
- Total keywords procesadas
- Total clusters creados
- Detalle de cada cluster (principal + secundarias)

**Nota importante:** Este workflow es parte de la **Tarea 5** y completa el flujo E2E:
```
Ingesta (Tarea 4) → Clustering (Tarea 5) → Ideas (Tarea 6)
```

---

### 11. `test_workflow8.ps1` - Generación de Ideas ⭐ **NUEVO**
**Workflow:** SEO - 08 Generación de Ideas  
**Endpoint:** `/webhook-test/seo/ideas-generation`  
**Requiere:** PostgreSQL + OpenAI API Key

**Prueba:**
```powershell
.\test_workflow8.ps1
```

**Qué hace:**
- Lee clusters procesados de PostgreSQL (Tarea 5)
- Genera 30 ideas de contenido únicas por cada cluster usando IA
- Usa el Prompt #2 oficial
- Clasifica ideas en "Requiere investigación" o "No requiere investigación"
- Guarda ideas en tabla `ideas` de PostgreSQL
- Muestra resumen con balance de categorías

**Datos de entrada:**
```json
{
  "keyword_cluster_id": "uuid",  // Opcional: cluster específico
  "limit": 3                      // Opcional: limitar clusters a procesar
}
```

**Respuesta:**
- Total clusters procesados
- Total ideas generadas (30 por cluster)
- Detalle por cluster: con/sin investigación
- Balance esperado: ~50% cada categoría

**Nota importante:** Este workflow es parte de la **Tarea 6** y continúa el flujo E2E:
```
Ingesta (Tarea 4) → Clustering (Tarea 5) → Ideas (Tarea 6) → Redacción (Tarea 7)
```

---

### 12. `test_workflow9.ps1` - Redacción Simple ⭐ **NUEVO**
**Workflow:** SEO - 09 Redacción Simple  
**Endpoint:** `/webhook-test/seo/redaccion/simple`  
**Requiere:** PostgreSQL + OpenAI API Key

**Prueba:**
```powershell
.\test_workflow9.ps1
```

**Qué hace:**
- Lee ideas pendientes con categoría "No requiere investigación"
- Genera drafts completos con contenido de 600+ palabras usando IA
- Usa el Prompt #3 oficial
- Extrae y guarda metadatos SEO (Meta Title, Meta Description, Tags)
- Calcula word count del contenido
- Guarda drafts en tabla `drafts` de PostgreSQL
- Actualiza status de ideas a `draft_created`

**Datos de entrada:**
```json
{
  "idea_id": "uuid",  // Opcional: idea específica
  "limit": 5          // Opcional: limitar ideas a procesar (default: 5)
}
```

**Respuesta:**
- Total ideas procesadas
- Total drafts creados
- Detalle de cada draft: título, palabras, meta title, tags

**Nota importante:** Este workflow es parte de la **Tarea 7** y continúa el flujo E2E:
```
Ingesta (T4) → Clustering (T5) → Ideas (T6) → Redacción (T7)
```

**Tiempo estimado:** 60-120 segundos por idea (OpenAI generando 600+ palabras)

---

### 13. `test_e2e_ingesta_clustering.ps1` - Test E2E (Tareas 4+5) ⭐
**Propósito:** Prueba el flujo completo de Tarea 4 + Tarea 5

**Prueba:**
```powershell
.\test_e2e_ingesta_clustering.ps1
```

**Qué hace:**
1. Limpia datos de tests anteriores
2. Importa 10 keywords de prueba (Workflow 5)
3. Verifica keywords pendientes en PostgreSQL
4. Ejecuta clustering (Workflow 7)
5. Muestra estadísticas completas
6. Lista todos los clusters generados

**Resultado esperado:**
- ✅ 10 keywords importadas
- ✅ 2-3 clusters creados
- ✅ Keywords originales archivadas
- ✅ Clusters con principal + secundarias

**Tiempo estimado:** 30-60 segundos (incluye llamadas a OpenAI)

---

### 14. `test_e2e_completo.ps1` - Test E2E Completo (Tareas 4+5+6) ⭐⭐
**Propósito:** Prueba el flujo completo de Tarea 4 + Tarea 5 + Tarea 6

**Prueba:**
```powershell
.\test_e2e_completo.ps1
```

**Qué hace:**
1. Limpia datos de tests anteriores
2. Importa 10 keywords de prueba (Workflow 5)
3. Ejecuta clustering (Workflow 7)
4. Genera ideas de contenido (Workflow 8)
5. Muestra estadísticas completas de todo el flujo
6. Verifica en PostgreSQL

**Resultado esperado:**
- ✅ 10 keywords importadas
- ✅ 2-3 clusters creados
- ✅ 60-90 ideas generadas (30 por cluster)
- ✅ Balance 50/50 en categorías de ideas
- ✅ Todas las relaciones FK correctas

**Tiempo estimado:** 2-3 minutos (incluye múltiples llamadas a OpenAI)

---

### 15. `test_e2e_completo_con_redaccion.ps1` - Test E2E COMPLETO (Tareas 4+5+6+7) ⭐⭐⭐ **NUEVO**
**Propósito:** Prueba el flujo completo E2E incluyendo redacción

**Prueba:**
```powershell
.\test_e2e_completo_con_redaccion.ps1
```

**Qué hace:**
1. Limpia datos de tests anteriores
2. Importa 10 keywords de prueba (Workflow 5)
3. Ejecuta clustering (Workflow 7)
4. Genera ideas de contenido (Workflow 8)
5. **Genera drafts para ideas sin investigación (Workflow 9)** ⭐ NUEVO
6. Muestra estadísticas completas del pipeline completo
7. Verifica relaciones en PostgreSQL

**Resultado esperado:**
- ✅ 10 keywords importadas
- ✅ 2-3 clusters creados
- ✅ 60-90 ideas generadas (30 por cluster)
- ✅ 3+ drafts de contenido (ideas sin investigación)
- ✅ Drafts con 600+ palabras
- ✅ Metadatos SEO completos
- ✅ Relaciones FK correctas en todo el pipeline

**Tiempo estimado:** 4-6 minutos (incluye generación de contenido largo)

**Este es el test más completo del proyecto:** Valida el pipeline completo desde ingesta de keywords hasta contenido redactado listo para publicar.

---

### 13. `test_workflow10.ps1` - Investigacion Deep Research ??? **NUEVO**
**Workflow:** SEO - 10 Investigacion Deep Research  
**Endpoint:** `/webhook/seo/investigacion`  
**Requiere:** OpenAI o4-mini-deep-research + Migraci?n `002_add_research_reports.sql`

**Prueba:**
```powershell
.	est_workflow10.ps1
```

**Qu? hace:**
- Detecta ideas con categor?a "Requiere investigaci?n" y sin reporte previo
- Llama al modelo o4-mini-deep-research para obtener datos, tendencias y fuentes
- Normaliza la respuesta a JSON y la guarda en la tabla `research_reports`
- Actualiza el estado de la idea a `research_ready`
- Permite reprocesar una idea con el flag `force = true`
- Registra tokens utilizados y costo estimado para seguimiento del consumo

**Datos de entrada (JSON):**
```json
{
  "limit": 1,
  "idea_id": "opcional",
  "force": false
}
```
## 📊 Flujo de Trabajo Recomendado

### 1️⃣ Primera vez (Verificación completa)
```powershell
# 1. Verificar que todo esté instalado
.\verificar_sistema.ps1

# 2. Verificar estructura del proyecto
.\verificar_sprint.ps1

# 3. Probar todos los workflows
.\test_workflows.ps1

# 4. Probar flujo E2E COMPLETO (Ingesta + Clustering + Ideas + Redacción)
.\test_e2e_completo_con_redaccion.ps1
```

### 2️⃣ Desarrollo diario
```powershell
# Probar workflow específico que estás editando
.\test_workflow9.ps1

# O probar el flujo E2E COMPLETO (Tareas 4 + 5 + 6 + 7)
.\test_e2e_completo_con_redaccion.ps1

# O probar solo hasta ideas (Tareas 4 + 5 + 6)
.\test_e2e_completo.ps1

# O probar solo Tareas 4 + 5
.\test_e2e_ingesta_clustering.ps1

# O probar todos rápidamente
.\test_workflows.ps1
```

### 3️⃣ Antes de commit
```powershell
# Verificación completa
.\verificar_sistema.ps1
.\test_workflows.ps1
.\test_e2e_completo_con_redaccion.ps1
```

---

## ⚠️ Notas Importantes

### Workflows con OpenAI (1, 2, 3, 7, 8, 9)
- Requieren `OPENAI_API_KEY` configurada en el archivo `.env`
- Un error de **timeout** o **API key** significa que el workflow **SÍ está activo**
- Solo un error **404** significa que el workflow está **inactivo**
- **Workflow 7 (Clustering):** Usa el Prompt #1 oficial (Tarea 5)
- **Workflow 8 (Ideas):** Usa el Prompt #2 oficial (Tarea 6), genera exactamente 30 ideas
- **Workflow 9 (Redacción):** Usa el Prompt #3 oficial (Tarea 7), genera contenido de 600+ palabras

### Workflows sin OpenAI (4, 5, 6)
- No requieren configuración adicional
- Deberían funcionar inmediatamente después de activarlos

### Endpoints de Producción vs Test
- **Test:** `/webhook-test/...` (para pruebas)
- **Producción:** `/webhook/...` (para uso real)

---

## 🔍 Troubleshooting

### Problema: "The requested webhook is not registered"
**Solución:** El workflow no está activo
1. Abre http://localhost:5678
2. Busca el workflow
3. Activa el toggle (debe estar en verde)

### Problema: "Timeout"
**Solución:** Normal en workflows con OpenAI
- Aumenta el timeout en el script si es necesario
- Verifica que la API key esté configurada

### Problema: "Docker not running"
**Solución:**
```powershell
cd ..\n8n
docker compose up -d
```

### Problema: "PostgreSQL connection refused"
**Solución:**
```powershell
cd ..\n8n
docker compose restart postgres
```

---

## 📁 Estructura Final

```
scripts/
├── README.md (este archivo)
│
├── Verificación (6)
│   ├── verificar_sistema.ps1
│   ├── verificar_sprint.ps1
│   ├── test_workflows.ps1
│   ├── test_e2e_ingesta_clustering.ps1
│   ├── test_e2e_completo.ps1
│   └── test_e2e_completo_con_redaccion.ps1  ⭐ NUEVO
│
└── Tests Individuales (10)
    ├── test_workflow1.ps1 (Keywords)
    ├── test_workflow2.ps1 (Ideas)
    ├── test_workflow3.ps1 (Redacción)
    ├── test_workflow4.ps1 (Formateo)
    ├── test_workflow5.ps1 (Ingesta CSV)
    ├── test_workflow6.ps1 (Ingesta Manual)
    ├── test_workflow7.ps1 (Clustering)
    ├── test_workflow8.ps1 (Ideas Generation)
    └── test_workflow9.ps1 (Redacción Simple) ⭐ NUEVO
```

**Total: 16 scripts organizados**

---

## 🚀 Quick Start

Para probar todo rápidamente:
```powershell
cd D:\Trabajo\Larabs - Novaly AI\MarketAi\seo-module\scripts
.\test_workflows.ps1
```

¡Listo! 🎉

