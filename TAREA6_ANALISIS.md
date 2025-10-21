# 📊 Análisis Completo - Tarea 6: Job "30 Ideas y Clasificación"

**Fecha:** 18 de Octubre, 2025  
**Estado:** Análisis previo a implementación

---

## 🎯 Objetivo de la Tarea 6

Crear un job/workflow que tome clusters de keywords procesados (Tarea 5) y genere **30 ideas de contenido únicas** por cada cluster, clasificándolas según si requieren investigación o no, guardando todo en PostgreSQL.

---

## 📋 Estado Actual

### ✅ Lo que ya tenemos (Tarea 5 completada):
1. **Workflow 7 (Clustering):** Genera clusters de keywords con status='processed'
2. **Tabla `keywords` en PostgreSQL** con clusters:
   ```sql
   - id (UUID)
   - cluster_name (VARCHAR)
   - keyword_principal (VARCHAR)
   - keywords_secundarias (JSONB array)
   - status ('processed')
   ```

3. **Tabla `ideas` en PostgreSQL** lista para usar:
   ```sql
   - id (UUID)
   - keyword_cluster_id (UUID FK)
   - idea_title (VARCHAR 500)
   - categoria (VARCHAR 100)
   - status ('pending', 'in_progress', 'draft_created', ...)
   - priority (INTEGER)
   - created_at, updated_at
   ```

4. **Prompt #2 documentado:** En `prompts/v1/02_ideas_generator.md`

### ⚠️ Lo que NO sirve:
- **Workflow 2 actual:** Es básico, no lee de DB, no usa Prompt #2, no guarda en PostgreSQL
- **Necesita ser REEMPLAZADO por un Workflow 8 nuevo**

---

## 🔍 Análisis del Prompt #2

### Entrada esperada:
```json
{
  "keywords": [
    "café orgánico",
    "café saludable",
    "café sin pesticidas",
    "mejores granos de café"
  ]
}
```

### Salida esperada:
```json
{
  "Ideas": [
    {
      "Idea": "Estadísticas globales de consumo de café sostenible",
      "Categoria": "Requiere investigación"
    },
    {
      "Idea": "Cómo diferenciar café orgánico del convencional",
      "Categoria": "No requiere investigación"
    },
    ...
    // Total: 30 ideas
  ]
}
```

### Características clave:
- **Temperature:** 0.8 (más creatividad)
- **Max Tokens:** 2500
- **Model:** GPT-4 o GPT-4o
- **Cantidad:** EXACTAMENTE 30 ideas
- **Clasificación:** "Requiere investigación" o "No requiere investigación"
- **Brevedad:** Máx. 12 palabras por idea
- **Mix balanceado:** ~50% con investigación, ~50% sin

---

## 🏗️ Diseño del Flujo (Workflow 8 Nuevo)

### Opción 1: Un Cluster a la Vez (Webhook Manual)
```
[Webhook POST /seo/ideas-generation] (con keyword_cluster_id)
    ↓
[Leer Cluster de PostgreSQL]
    ↓
[Extraer keyword_principal + keywords_secundarias]
    ↓
[Construir Prompt #2]
    ↓
[Llamar OpenAI]
    ↓
[Parse JSON Response (30 ideas)]
    ↓
[Para cada Idea (30)]
    ↓
[Guardar en tabla ideas]
    ↓
[Responder con Resumen]
```

### Opción 2: Todos los Clusters Pendientes (Automático)
```
[Webhook POST /seo/ideas-generation] (sin parámetros o con filtros)
    ↓
[Leer Clusters con status='processed' y sin ideas generadas]
    ↓
[Para CADA Cluster]
    ↓
  [Extraer keywords]
    ↓
  [Construir Prompt #2]
    ↓
  [Llamar OpenAI]
    ↓
  [Parse 30 Ideas]
    ↓
  [Guardar 30 Ideas en tabla ideas]
    ↓
[Agregar Resultados]
    ↓
[Responder con Resumen de Todos los Clusters]
```

**Recomendación:** **Opción 2** - Más automático, procesa múltiples clusters en una ejecución

---

## 💾 Diseño de Guardado en PostgreSQL

### Flujo de Datos:

**Entrada (de Workflow 7):**
```sql
SELECT id, cluster_name, keyword_principal, keywords_secundarias, status
FROM keywords 
WHERE status = 'processed'
  AND id NOT IN (SELECT DISTINCT keyword_cluster_id FROM ideas WHERE keyword_cluster_id IS NOT NULL)
-- Solo clusters que aún NO tienen ideas generadas
```

**Salida (a tabla ideas):**
```sql
INSERT INTO ideas (
  keyword_cluster_id,
  idea_title,
  categoria,
  status,
  estimated_word_count,
  priority
) VALUES (
  'uuid-del-cluster',
  'Título de la idea',
  'Requiere investigación' -- o 'No requiere investigación',
  'pending',
  600,
  0
)
```

**Resultado:**
- Por cada cluster: 30 filas en tabla `ideas`
- Relación FK: `keyword_cluster_id` → `keywords.id`
- Status inicial: 'pending' (listas para Tarea 7 - redacción)

---

## 🎨 Estructura JSON de Salida del Workflow

### Response del Workflow:
```json
{
  "status": "success",
  "total_clusters_processed": 3,
  "total_ideas_generated": 90,
  "clusters_details": [
    {
      "cluster_id": "uuid-123",
      "cluster_name": "Café Orgánico",
      "keyword_principal": "cafe organico",
      "ideas_generated": 30,
      "ideas_con_investigacion": 15,
      "ideas_sin_investigacion": 15
    }
  ],
  "processing_time": "45s"
}
```

---

## 🔄 Flujo Detallado del Workflow 8 (Nuevo)

### Nodo 1: Webhook
- **Tipo:** Webhook
- **Path:** `/seo/ideas-generation`
- **Method:** POST
- **Body (opcional):**
  ```json
  {
    "keyword_cluster_id": "uuid",  // Opcional: un cluster específico
    "limit": 5  // Opcional: limitar clusters a procesar
  }
  ```

### Nodo 2: Leer Clusters Procesados
- **Tipo:** PostgreSQL
- **Operación:** Query
- **SQL:**
  ```sql
  SELECT 
    k.id,
    k.cluster_name,
    k.keyword_principal,
    k.keywords_secundarias,
    k.project_name
  FROM keywords k
  WHERE k.status = 'processed'
    {{ $json.body?.keyword_cluster_id ? "AND k.id = '" + $json.body.keyword_cluster_id + "'" : "" }}
    -- Solo clusters sin ideas ya generadas
    AND k.id NOT IN (
      SELECT DISTINCT keyword_cluster_id 
      FROM ideas 
      WHERE keyword_cluster_id IS NOT NULL
    )
  ORDER BY k.created_at DESC
  {{ $json.body?.limit ? "LIMIT " + $json.body.limit : "LIMIT 10" }}
  ```

### Nodo 3: Check Si Hay Clusters
- **Tipo:** IF
- **Condición:** `{{ $json.length > 0 }}`
- **True:** Continuar
- **False:** Responder "No hay clusters pendientes"

### Nodo 4: Preparar Keywords por Cluster
- **Tipo:** Code
- **Código:**
  ```javascript
  // Construir array de todas las keywords del cluster
  const keywordPrincipal = $json.keyword_principal;
  const keywordsSecundarias = JSON.parse($json.keywords_secundarias || '[]');
  
  // Combinar todas las keywords
  const allKeywords = [keywordPrincipal, ...keywordsSecundarias];
  
  return [{
    json: {
      cluster_id: $json.id,
      cluster_name: $json.cluster_name,
      keyword_principal: keywordPrincipal,
      keywords: allKeywords,
      project_name: $json.project_name
    }
  }];
  ```

### Nodo 5: Construir Prompt #2
- **Tipo:** Code
- **Código:**
  ```javascript
  const keywords = $json.keywords;
  
  const prompt = `Actúa como un estratega de contenidos y generador de ideas para blog.

Recibirás un conjunto de keywords principales y secundarias seleccionadas previamente.

Tu objetivo es:
1. Analizar el conjunto total de keywords y encontrar temas en común o tendencias.
2. Generar **30 ideas de contenido únicas** para blog, videos o guías, basadas en el conjunto total (no en cada keyword por separado).
3. Cada idea debe ser breve (máx. 12 palabras) y clara en su enfoque.
4. Clasificar cada idea en dos categorías:
   - **Requiere investigación** → temas que necesitan datos actualizados, estudios recientes o estadísticas.
   - **No requiere investigación** → temas que pueden desarrollarse con conocimiento general, sin datos recientes.
5. Entregar el resultado en formato JSON.

**Entrada:**
${JSON.stringify({keywords: keywords}, null, 2)}

**Formato de salida (JSON válido, sin markdown):**
{
  "Ideas": [
    {
      "Idea": "título de la idea (máx 12 palabras)",
      "Categoria": "Requiere investigación"
    },
    {
      "Idea": "título de la idea (máx 12 palabras)",
      "Categoria": "No requiere investigación"
    }
  ]
}

IMPORTANTE: 
- Responde SOLO con el JSON, sin bloques de código markdown.
- Genera EXACTAMENTE 30 ideas.
- Mix balanceado: aproximadamente 15 con investigación y 15 sin investigación.`;

  return [{
    json: {
      ...$json,
      prompt: prompt
    }
  }];
  ```

### Nodo 6: OpenAI Chat
- **Tipo:** OpenAI (Chat Model)
- **Model:** gpt-4o o gpt-4
- **Temperature:** 0.8
- **Max Tokens:** 2500
- **Message:** `{{ $json.prompt }}`

### Nodo 7: Parse JSON Response
- **Tipo:** Code
- **Código:**
  ```javascript
  let response = $json.message?.content || $json.text || $json.response;
  
  // Limpiar respuesta (remover markdown code blocks)
  response = response.trim();
  if (response.startsWith('```json')) {
    response = response.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
  } else if (response.startsWith('```')) {
    response = response.replace(/```\n?/g, '');
  }
  
  // Parse JSON
  let ideasResponse;
  try {
    ideasResponse = JSON.parse(response);
  } catch (error) {
    throw new Error('Error al parsear respuesta de OpenAI: ' + error.message + '\nRespuesta: ' + response);
  }
  
  const ideas = ideasResponse.Ideas || ideasResponse.ideas || [];
  
  // Validar que haya 30 ideas
  if (ideas.length !== 30) {
    console.warn(`Advertencia: Se esperaban 30 ideas, se recibieron ${ideas.length}`);
  }
  
  // Agregar metadata del cluster a cada idea
  const ideasConMetadata = ideas.map((idea, index) => ({
    cluster_id: $input.first().json.cluster_id,
    cluster_name: $input.first().json.cluster_name,
    idea_title: idea.Idea || idea.idea,
    categoria: idea.Categoria || idea.categoria,
    priority: index,  // Orden de generación
    keyword_principal: $input.first().json.keyword_principal
  }));
  
  return ideasConMetadata.map(idea => ({json: idea}));
  ```

### Nodo 8: Guardar Idea en PostgreSQL
- **Tipo:** PostgreSQL
- **Operación:** Insert
- **SQL:**
  ```sql
  INSERT INTO ideas (
    keyword_cluster_id,
    idea_title,
    categoria,
    status,
    estimated_word_count,
    priority
  )
  VALUES (
    '{{ $json.cluster_id }}',
    '{{ $json.idea_title.replace(/'/g, "''") }}',
    '{{ $json.categoria }}',
    'pending',
    600,
    {{ $json.priority }}
  )
  RETURNING id, idea_title, categoria;
  ```

### Nodo 9: Aggregate Ideas por Cluster
- **Tipo:** Aggregate
- **Operación:** Aggregate All
- **Field Name:** all_ideas

### Nodo 10: Preparar Resumen por Cluster
- **Tipo:** Code
- **Código:**
  ```javascript
  const ideas = $json.all_ideas || [];
  
  const conInvestigacion = ideas.filter(i => 
    (i.categoria || '').toLowerCase().includes('requiere')
  ).length;
  
  const sinInvestigacion = ideas.length - conInvestigacion;
  
  return [{
    json: {
      cluster_id: ideas[0]?.cluster_id || 'unknown',
      cluster_name: ideas[0]?.cluster_name || 'Unknown',
      keyword_principal: ideas[0]?.keyword_principal || '',
      ideas_generated: ideas.length,
      ideas_con_investigacion: conInvestigacion,
      ideas_sin_investigacion: sinInvestigacion
    }
  }];
  ```

### Nodo 11: Aggregate Todos los Clusters
- **Tipo:** Aggregate
- **Operación:** Aggregate All
- **Field Name:** all_clusters

### Nodo 12: Preparar Respuesta Final
- **Tipo:** Code
- **Código:**
  ```javascript
  const clusters = $json.all_clusters || [];
  
  return [{
    json: {
      status: 'success',
      total_clusters_processed: clusters.length,
      total_ideas_generated: clusters.reduce((sum, c) => sum + (c.ideas_generated || 0), 0),
      clusters_details: clusters,
      processing_time: new Date().toISOString()
    }
  }];
  ```

### Nodo 13: Respond to Webhook Success
- **Tipo:** Respond to Webhook
- **Response:** `{{ $json }}`

### Nodo 14: Mensaje No Clusters
- **Tipo:** Code (cuando no hay clusters)
- **Código:**
  ```javascript
  return [{
    json: {
      status: 'info',
      message: 'No hay clusters procesados pendientes para generar ideas',
      total_clusters_processed: 0,
      total_ideas_generated: 0,
      clusters_details: []
    }
  }];
  ```

### Nodo 15: Respond to Webhook No Clusters
- **Tipo:** Respond to Webhook
- **Response:** `{{ $json }}`

---

## 🧪 Plan de Pruebas

### Test 1: Generar Ideas para Un Cluster
```powershell
# 1. Tener al menos 1 cluster procesado (de Tarea 5)
.\test_workflow7.ps1  # O usar clusters existentes

# 2. Generar ideas para todos los clusters pendientes
Invoke-WebRequest `
  -Uri "http://localhost:5678/webhook-test/seo/ideas-generation" `
  -Method Post `
  -Headers @{'Content-Type'='application/json'} `
  -Body '{}'

# 3. Verificar en PostgreSQL
docker compose exec postgres psql -U marketai_user -d marketai_seo -c "
  SELECT i.idea_title, i.categoria, k.cluster_name
  FROM ideas i
  JOIN keywords k ON i.keyword_cluster_id = k.id
  ORDER BY i.created_at DESC
  LIMIT 10;
"
```

### Test 2: Generar Ideas para Cluster Específico
```powershell
# Con keyword_cluster_id específico
Invoke-WebRequest `
  -Uri "http://localhost:5678/webhook-test/seo/ideas-generation" `
  -Method Post `
  -Headers @{'Content-Type'='application/json'} `
  -Body '{"keyword_cluster_id":"uuid-del-cluster"}'
```

### Test 3: E2E Completo (Tarea 4 + 5 + 6)
```powershell
# 1. Importar keywords
.\test_workflow5.ps1

# 2. Hacer clustering
.\test_workflow7.ps1

# 3. Generar ideas
.\test_workflow8.ps1

# Verificar todo el flujo
```

---

## 📈 Métricas de Éxito

- ✅ Workflow ejecuta sin errores
- ✅ Genera EXACTAMENTE 30 ideas por cluster
- ✅ Ideas tienen máx. 12 palabras
- ✅ Mix balanceado: ~50% con/sin investigación
- ✅ Todas las ideas se guardan en PostgreSQL
- ✅ Relación FK correcta con keyword_cluster_id
- ✅ Response JSON válido y completo
- ✅ No procesa el mismo cluster dos veces
- ✅ Ideas son únicas y relevantes

---

## 🚀 Plan de Implementación

1. ✅ Análisis completo (este documento)
2. ⏳ Crear nuevo Workflow 8 en n8n
3. ⏳ Probar cada nodo individualmente
4. ⏳ Probar flujo completo E2E
5. ⏳ Crear script test_workflow8.ps1
6. ⏳ Crear script test_e2e_completo.ps1 (Tareas 4+5+6)
7. ⏳ Documentar en README
8. ⏳ Marcar Tarea 6 como completada

---

## ⚠️ Consideraciones Importantes

1. **30 Ideas Exactas:** El prompt debe enfatizar que son EXACTAMENTE 30
2. **Cost de OpenAI:** Cada cluster consume ~500-800 tokens de salida
3. **Duplicados:** Query SQL evita procesar clusters que ya tienen ideas
4. **Relación FK:** ON DELETE CASCADE si se borra un cluster, se borran sus ideas
5. **Performance:** Limitar a 10 clusters por defecto para evitar timeouts largos
6. **Temperature 0.8:** Más creatividad que en clustering (0.7)
7. **Max Tokens 2500:** Suficiente para 30 ideas + metadata
8. **Idempotencia:** Si falla a mitad, puede reintentar (solo procesa clusters sin ideas)

---

## 🔗 Relación con Otras Tareas

```
Tarea 4 (Ingesta)
    ↓
Tarea 5 (Clustering) → keywords.status='processed'
    ↓
Tarea 6 (Ideas) → 30 ideas en tabla ideas con status='pending'
    ↓
Tarea 7 (Redacción) → Lee ideas.status='pending' y genera drafts
```

---

## 📊 Diferencias con Prompt #2 Original

El Prompt #2 está muy bien definido. Solo ajustes menores:
- ✅ Enfatizar 30 ideas exactas
- ✅ Recordar máx 12 palabras
- ✅ Balance 50/50 en categorías
- ✅ Sin markdown en respuesta

---

**Próximo paso:** Implementar el Workflow 8 nuevo siguiendo este diseño

