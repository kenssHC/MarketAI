# 📊 Análisis Completo - Tarea 5: Job "Cluster de Keywords"

**Fecha:** 18 de Octubre, 2025  
**Estado:** Análisis previo a implementación

---

## 🎯 Objetivo de la Tarea 5

Crear un job/workflow que tome keywords importadas (Tarea 4) y las agrupe en clusters temáticos usando el Prompt #1, guardando los resultados en PostgreSQL.

---

## 📋 Estado Actual

### ✅ Lo que ya tenemos (Tarea 4 completada):
1. **Workflow 5 (Ingesta CSV):** Importa keywords desde Google Keyword Planner
2. **Workflow 6 (Ingesta Manual):** Importa keywords manualmente
3. **Tabla `keywords` en PostgreSQL** con estructura:
   ```sql
   - id (UUID)
   - project_name (VARCHAR)
   - cluster_name (VARCHAR) 
   - keyword_principal (VARCHAR) - UNIQUE
   - keywords_secundarias (JSONB) - Array de keywords
   - source (VARCHAR) - 'gkp' o 'manual'
   - search_volume (INTEGER)
   - competition (VARCHAR)
   - search_intent (VARCHAR)
   - status (VARCHAR) - 'pending', 'processed', 'used', 'archived'
   - processed_at (TIMESTAMP)
   - created_at, updated_at (TIMESTAMPS)
   ```

4. **Prompt #1 documentado:** En `prompts/v1/01_keywords_clustering.md`

### ⚠️ Lo que NO sirve:
- **Workflow 1 actual:** Es completamente diferente. Genera keywords nuevas en lugar de agrupar las existentes.
- **Necesita ser REEMPLAZADO completamente**

---

## 🔍 Análisis del Prompt #1

### Entrada esperada:
```json
{
  "keywords": [
    "café orgánico",
    "café saludable",
    "mejores granos de café",
    ...
  ]
}
```

### Salida esperada:
```json
{
  "Tema_1": {
    "Keyword_Principal": "café orgánico",
    "Keywords_Secundarias": ["café saludable", "café sin pesticidas", "mejores granos de café"]
  },
  "Tema_2": {
    "Keyword_Principal": "cultura cafetera",
    "Keywords_Secundarias": ["recetas con café", "cafeterías modernas"]
  }
}
```

### Características clave:
- **Temperature:** 0.7
- **Max Tokens:** 2000
- **Model:** GPT-4 o GPT-4o
- **Agrupa por similitud semántica**
- **Elimina keywords irrelevantes/duplicadas**
- **1 keyword principal + 2-5 secundarias por cluster**

---

## 🏗️ Diseño del Flujo (Workflow 1 Nuevo)

### Opción 1: Workflow Automático (Sin Webhook)
```
[Trigger Manual/Cron] 
    ↓
[Leer Keywords Pendientes de PostgreSQL]
    ↓ (Si hay keywords pendientes)
[Agrupar en Array Simple]
    ↓
[Construir Prompt #1]
    ↓
[Llamar OpenAI]
    ↓
[Parse JSON Response]
    ↓
[Para cada Cluster/Tema]
    ↓
[Guardar en PostgreSQL]
    - Insertar keyword_principal + keywords_secundarias
    - Actualizar cluster_name
    - Marcar como status='processed'
    - Set processed_at
```

### Opción 2: Workflow con Webhook (Manual + Automático)
```
[Webhook POST /seo/clustering] (opcional: con filtros project_name)
    ↓
[Leer Keywords Pendientes de PostgreSQL]
    ↓
[Agrupar en Array Simple]
    ↓
[Construir Prompt #1]
    ↓
[Llamar OpenAI]
    ↓
[Parse JSON Response]
    ↓
[Para cada Cluster/Tema]
    ↓
[Guardar en PostgreSQL]
    ↓
[Responder con Resumen]
```

**Recomendación:** **Opción 2** - Más flexible, permite clustering manual o automático

---

## 💾 Diseño de Guardado en PostgreSQL

### Problema de Diseño:

Actualmente en la tabla `keywords`:
- Cada fila tiene una `keyword_principal` y `keywords_secundarias[]`
- Al importar (Tarea 4), cada keyword se guarda como una fila individual

**Ejemplo después de Tarea 4:**
```
id | keyword_principal | keywords_secundarias | cluster_name | status
---|-------------------|---------------------|--------------|--------
1  | café orgánico     | []                  | Import 1     | pending
2  | café saludable    | []                  | Import 1     | pending
3  | café sin pesticidas| []                 | Import 1     | pending
```

### Solución Propuesta:

**Después del clustering (Tarea 5):**
```
id | keyword_principal | keywords_secundarias              | cluster_name    | status
---|-------------------|-----------------------------------|-----------------|----------
1  | café orgánico     | ["café saludable","café sin..."] | Café Orgánico   | processed
   (keywords 2 y 3 se eliminarían o marcarían como 'archived')
```

### Estrategia de Guardado:

**Opción A: Consolidar (Recomendada)**
1. Crear una NUEVA fila con la keyword principal y sus secundarias
2. Marcar las keywords secundarias originales como `status='archived'`
3. Mantener trazabilidad

**Opción B: Actualizar en Lugar**
1. Actualizar UNA de las keywords para ser la principal
2. Agregar las demás como secundarias
3. Eliminar/archivar las otras filas

**Decisión: Opción A** - Más limpio, mantiene historia

---

## 🎨 Estructura JSON de Salida del Workflow

### Response del Workflow:
```json
{
  "status": "success",
  "total_keywords_processed": 15,
  "total_clusters_created": 3,
  "clusters": [
    {
      "cluster_name": "Café Orgánico",
      "keyword_principal": "café orgánico",
      "keywords_secundarias": ["café saludable", "café sin pesticidas"],
      "total_keywords": 3,
      "id": "uuid-1234"
    },
    {
      "cluster_name": "Cultura Cafetera",
      "keyword_principal": "cultura cafetera",
      "keywords_secundarias": ["recetas con café"],
      "total_keywords": 2,
      "id": "uuid-5678"
    }
  ],
  "keywords_archived": 12,
  "processing_time": "5.2s"
}
```

---

## 🔄 Flujo Detallado del Workflow 1 (Nuevo)

### Nodo 1: Webhook
- **Tipo:** Webhook
- **Path:** `/seo/clustering`
- **Method:** POST
- **Body (opcional):**
  ```json
  {
    "project_name": "Proyecto X",  // Opcional: filtrar por proyecto
    "limit": 50  // Opcional: limitar keywords a procesar
  }
  ```

### Nodo 2: Leer Keywords Pendientes
- **Tipo:** PostgreSQL
- **Operación:** Query
- **SQL:**
  ```sql
  SELECT 
    id,
    keyword_principal,
    search_volume,
    competition,
    source,
    project_name
  FROM keywords 
  WHERE status = 'pending'
    {{ $json.body?.project_name ? "AND project_name = '" + $json.body.project_name + "'" : "" }}
  ORDER BY search_volume DESC NULLS LAST
  {{ $json.body?.limit ? "LIMIT " + $json.body.limit : "LIMIT 100" }}
  ```

### Nodo 3: Check Si Hay Keywords
- **Tipo:** IF
- **Condición:** `{{ $json.length > 0 }}`
- **True:** Continuar
- **False:** Responder "No hay keywords pendientes"

### Nodo 4: Preparar Array de Keywords
- **Tipo:** Code
- **Código:**
  ```javascript
  const keywords = $input.all().map(item => item.json.keyword_principal);
  
  return [{
    json: {
      keywords: keywords,
      metadata: {
        total: keywords.length,
        source: 'postgresql'
      }
    }
  }];
  ```

### Nodo 5: Construir Prompt
- **Tipo:** Code
- **Código:**
  ```javascript
  const keywords = $json.keywords;
  
  const prompt = `Actúa como un especialista en SEO y estrategia de contenidos.

Recibirás un listado de keywords provenientes de Google Keyword Planner o ingreso manual.

Tu objetivo es:
1. Analizar todas las keywords y eliminar las irrelevantes, duplicadas o con muy poca intención de búsqueda.
2. Detectar las que tienen mayor potencial para crear contenido que atraiga tráfico orgánico.
3. Agruparlas por temáticas basadas en similitud semántica.
4. Dentro de cada grupo, seleccionar:
   - Keyword principal: la más representativa y con mejor potencial.
   - Keywords secundarias: complementos y variaciones (2-5 por cluster).
5. Mantener el idioma original de las keywords.

**Entrada:**
${JSON.stringify({keywords: keywords}, null, 2)}

**Formato de salida (JSON válido, sin markdown):**
{
  "Tema_1": {
    "Keyword_Principal": "palabra clave principal",
    "Keywords_Secundarias": ["keyword1", "keyword2", "keyword3"]
  },
  "Tema_2": {
    "Keyword_Principal": "palabra clave principal",
    "Keywords_Secundarias": ["keyword4", "keyword5"]
  }
}

IMPORTANTE: Responde SOLO con el JSON, sin bloques de código markdown.`;

  return [{
    json: {
      prompt: prompt,
      original_keywords: keywords
    }
  }];
  ```

### Nodo 6: OpenAI
- **Tipo:** OpenAI (Chat Model)
- **Model:** gpt-4o o gpt-4
- **Temperature:** 0.7
- **Max Tokens:** 2000
- **Message:** `{{ $json.prompt }}`

### Nodo 7: Parse JSON Response
- **Tipo:** Code
- **Código:**
  ```javascript
  let response = $json.message?.content || $json.text || $json.response;
  
  // Limpiar respuesta (remover markdown code blocks si existen)
  response = response.trim();
  if (response.startsWith('```json')) {
    response = response.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
  } else if (response.startsWith('```')) {
    response = response.replace(/```\n?/g, '');
  }
  
  // Parse JSON
  let clusters;
  try {
    clusters = JSON.parse(response);
  } catch (error) {
    throw new Error('Error al parsear respuesta de OpenAI: ' + error.message + '\nRespuesta: ' + response);
  }
  
  // Convertir a array de clusters
  const clustersArray = [];
  for (const [temaKey, temaData] of Object.entries(clusters)) {
    clustersArray.push({
      cluster_name: temaKey.replace('Tema_', 'Cluster '),
      keyword_principal: temaData.Keyword_Principal,
      keywords_secundarias: temaData.Keywords_Secundarias
    });
  }
  
  return [{
    json: {
      clusters: clustersArray,
      total_clusters: clustersArray.length
    }
  }];
  ```

### Nodo 8: Split Into Items
- **Tipo:** Split In Batches
- **Batch Size:** 1
- **Opciones:** Reset

### Nodo 9: Guardar Cluster en PostgreSQL
- **Tipo:** Code (ejecuta múltiples queries)
- **Código:**
  ```javascript
  const cluster = $json;
  const clusterName = cluster.cluster_name;
  const keywordPrincipal = cluster.keyword_principal;
  const keywordsSecundarias = cluster.keywords_secundarias;
  
  // Queries a ejecutar (se harán en el siguiente nodo PostgreSQL)
  return [{
    json: {
      cluster_name: clusterName,
      keyword_principal: keywordPrincipal,
      keywords_secundarias: JSON.stringify(keywordsSecundarias),
      all_keywords: [keywordPrincipal, ...keywordsSecundarias]
    }
  }];
  ```

### Nodo 10: Insertar Cluster
- **Tipo:** PostgreSQL
- **Operación:** Insert
- **SQL:**
  ```sql
  INSERT INTO keywords (
    cluster_name,
    keyword_principal,
    keywords_secundarias,
    status,
    processed_at,
    source
  )
  VALUES (
    '{{ $json.cluster_name }}',
    '{{ $json.keyword_principal }}',
    '{{ $json.keywords_secundarias }}'::jsonb,
    'processed',
    CURRENT_TIMESTAMP,
    'clustering'
  )
  ON CONFLICT (keyword_principal) 
  DO UPDATE SET
    cluster_name = EXCLUDED.cluster_name,
    keywords_secundarias = EXCLUDED.keywords_secundarias,
    status = 'processed',
    processed_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
  RETURNING id, keyword_principal, cluster_name;
  ```

### Nodo 11: Archivar Keywords Originales
- **Tipo:** PostgreSQL
- **Operación:** Update
- **SQL:**
  ```sql
  UPDATE keywords
  SET 
    status = 'archived',
    updated_at = CURRENT_TIMESTAMP
  WHERE 
    keyword_principal = ANY(ARRAY[{{ $json.all_keywords.map(k => "'" + k + "'").join(',') }}])
    AND id != '{{ $json.id }}'
    AND status = 'pending';
  ```

### Nodo 12: Aggregate Results
- **Tipo:** Aggregate
- **Operación:** Aggregate All
- **Field Name:** all_clusters

### Nodo 13: Preparar Respuesta
- **Tipo:** Code
- **Código:**
  ```javascript
  const clusters = $json.all_clusters || [];
  
  return [{
    json: {
      status: 'success',
      total_keywords_processed: clusters.reduce((sum, c) => sum + (c.all_keywords?.length || 0), 0),
      total_clusters_created: clusters.length,
      clusters: clusters.map(c => ({
        cluster_name: c.cluster_name,
        keyword_principal: c.keyword_principal,
        keywords_secundarias: JSON.parse(c.keywords_secundarias),
        id: c.id
      })),
      processing_time: new Date().toISOString()
    }
  }];
  ```

### Nodo 14: Respond to Webhook
- **Tipo:** Respond to Webhook
- **Response:** `{{ $json }}`

---

## 🧪 Plan de Pruebas

### Test 1: Clustering Básico
```powershell
# 1. Importar keywords de prueba
.\test_workflow5.ps1  # O test_workflow6.ps1

# 2. Ejecutar clustering
Invoke-WebRequest `
  -Uri "http://localhost:5678/webhook-test/seo/clustering" `
  -Method Post `
  -Headers @{'Content-Type'='application/json'} `
  -Body '{}'

# 3. Verificar en PostgreSQL
docker compose exec postgres psql -U marketai_user -d marketai_seo -c "
  SELECT cluster_name, keyword_principal, keywords_secundarias, status 
  FROM keywords 
  WHERE status='processed' 
  ORDER BY created_at DESC 
  LIMIT 5;
"
```

### Test 2: Clustering por Proyecto
```powershell
# Filtrar solo un proyecto específico
Invoke-WebRequest `
  -Uri "http://localhost:5678/webhook-test/seo/clustering" `
  -Method Post `
  -Headers @{'Content-Type'='application/json'} `
  -Body '{"project_name":"Test Workflow 6"}'
```

### Test 3: E2E Completo
```powershell
# 1. Limpiar datos
# 2. Importar 15 keywords
# 3. Ejecutar clustering
# 4. Verificar que se crearon 3-5 clusters
# 5. Verificar que todas las keywords están procesadas o archivadas
```

---

## 📈 Métricas de Éxito

- ✅ Workflow ejecuta sin errores
- ✅ Keywords se agrupan correctamente
- ✅ Cada cluster tiene 1 principal + 2-5 secundarias
- ✅ Status se actualiza a 'processed'
- ✅ Keywords originales se archivan
- ✅ Response JSON es válido y completo
- ✅ Se puede ejecutar múltiples veces sin duplicar

---

## 🚀 Plan de Implementación

1. ✅ Análisis completo (este documento)
2. ⏳ Crear nuevo Workflow 1 en n8n
3. ⏳ Probar cada nodo individualmente
4. ⏳ Probar flujo completo E2E
5. ⏳ Crear script test_workflow1_clustering.ps1
6. ⏳ Documentar en README
7. ⏳ Marcar Tarea 5 como completada

---

## ⚠️ Consideraciones Importantes

1. **Límite de Keywords:** Por defecto 100, para evitar prompts muy largos
2. **Cost de OpenAI:** Cada ejecución consume tokens
3. **Duplicados:** El UNIQUE constraint en `keyword_principal` previene duplicados
4. **Idempotencia:** Se puede ejecutar múltiples veces con ON CONFLICT
5. **Performance:** Para miles de keywords, considerar batching

---

**Próximo paso:** Implementar el Workflow 1 nuevo siguiendo este diseño

