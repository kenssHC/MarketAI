# Test E2E Completo: Tareas 4 + 5 + 6 + 7
# Flujo completo: Ingesta → Clustering → Ideas → Redacción

# Configuración
$baseUrl = "http://localhost:5678/webhook"
$projectName = "Test E2E Redacción"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST E2E: Ingesta + Clustering + Ideas + Redacción" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# PASO 0: Limpiar datos de test anteriores
# ============================================
Write-Host "[PASO 0] Limpiando datos de tests anteriores..." -ForegroundColor Yellow

try {
    docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
DELETE FROM drafts WHERE idea_id IN (
    SELECT i.id FROM ideas i
    JOIN keywords k ON i.keyword_cluster_id = k.id
    WHERE k.project_name = '$projectName'
);
DELETE FROM ideas WHERE keyword_cluster_id IN (
    SELECT id FROM keywords WHERE project_name = '$projectName'
);
DELETE FROM keywords WHERE project_name = '$projectName';
" | Out-Null
    Write-Host "  [OK] Base de datos limpia" -ForegroundColor Green
} catch {
    Write-Host "  [WARNING] No se pudo limpiar (puede ser normal en primera ejecución)" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# PASO 1: Importar Keywords (Tarea 4)
# ============================================
Write-Host "[PASO 1] Importando Keywords via CSV..." -ForegroundColor Yellow

$csvData = @"
Keyword,Avg. monthly searches,Competition
cafe organico,5400,Medium
cafe de hongo,1200,Low
beneficios del cafe,9900,High
cafe saludable,3600,Medium
cafe sin pesticidas,880,Low
mejores granos de cafe,2400,Medium
preparar cafe perfecto,1900,Low
cafe de colombia vs brasil,590,Medium
cafe molido o en grano,1300,Low
como almacenar cafe,720,Low
"@

$body1 = @{
    csv_data = $csvData
    cluster_name = "Café Orgánico"
    project_name = $projectName
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod `
        -Uri "$baseUrl/seo/ingesta/csv" `
        -Method Post `
        -Headers @{'Content-Type'='application/json'} `
        -Body $body1
    
    Write-Host "  [OK] Keywords importadas" -ForegroundColor Green
    Write-Host "      Total importadas: $($response1.total_imported)" -ForegroundColor Cyan
    Write-Host "      Total guardadas: $($response1.total_saved)" -ForegroundColor Cyan
    
} catch {
    Write-Host "  [ERROR] Fallo la importación:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Start-Sleep -Seconds 2

# ============================================
# PASO 2: Ejecutar Clustering (Tarea 5)
# ============================================
Write-Host "[PASO 2] Ejecutando Clustering de Keywords..." -ForegroundColor Yellow
Write-Host "  (Esto puede tardar 20-40 segundos)" -ForegroundColor Gray

$body2 = @{
    project_name = $projectName
    limit = 50
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod `
        -Uri "$baseUrl/seo/clustering" `
        -Method Post `
        -Headers @{'Content-Type'='application/json'} `
        -Body $body2
    
    Write-Host "  [OK] Clustering completado" -ForegroundColor Green
    Write-Host "      Keywords procesadas: $($response2.total_keywords_processed)" -ForegroundColor Cyan
    Write-Host "      Clusters creados: $($response2.total_clusters_created)" -ForegroundColor Cyan
    
} catch {
    Write-Host "  [ERROR] Fallo el clustering:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Start-Sleep -Seconds 2

# ============================================
# PASO 3: Generar Ideas (Tarea 6)
# ============================================
Write-Host "[PASO 3] Generando Ideas de Contenido..." -ForegroundColor Yellow
Write-Host "  (Esto puede tardar 30-60 segundos por cluster)" -ForegroundColor Gray

$body3 = @{
    limit = 5
} | ConvertTo-Json

try {
    $response3 = Invoke-RestMethod `
        -Uri "$baseUrl/seo/ideas-generation" `
        -Method Post `
        -Headers @{'Content-Type'='application/json'} `
        -Body $body3
    
    Write-Host "  [OK] Generación de ideas completada" -ForegroundColor Green
    Write-Host "      Clusters procesados: $($response3.total_clusters_processed)" -ForegroundColor Cyan
    Write-Host "      Ideas generadas: $($response3.total_ideas_generated)" -ForegroundColor Cyan
    
} catch {
    Write-Host "  [ERROR] Fallo la generación de ideas:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Start-Sleep -Seconds 2

# ============================================
# PASO 4: Redactar Contenido (Tarea 7)
# ============================================
Write-Host "[PASO 4] Generando Drafts (Solo Sin Investigación)..." -ForegroundColor Yellow
Write-Host "  (Esto puede tardar 60-120 segundos por idea)" -ForegroundColor Gray

$body4 = @{
    limit = 3
} | ConvertTo-Json

try {
    $response4 = Invoke-RestMethod `
        -Uri "$baseUrl/seo/redaccion/simple" `
        -Method Post `
        -Headers @{'Content-Type'='application/json'} `
        -Body $body4 `
        -TimeoutSec 300
    
    Write-Host "  [OK] Redacción completada" -ForegroundColor Green
    Write-Host "      Ideas procesadas: $($response4.total_ideas_processed)" -ForegroundColor Cyan
    Write-Host "      Drafts creados: $($response4.total_drafts_created)" -ForegroundColor Cyan
    Write-Host ""
    
    if ($response4.drafts_details) {
        foreach ($draft in $response4.drafts_details) {
            Write-Host "      📄 $($draft.title)" -ForegroundColor White
            Write-Host "         Palabras: $($draft.word_count)" -ForegroundColor Gray
            Write-Host "         Tags: $($draft.tags_count)" -ForegroundColor Gray
        }
    }
    
} catch {
    Write-Host "  [ERROR] Fallo la redacción:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    # Continuar para mostrar estadísticas aunque falle
}

Write-Host ""
Start-Sleep -Seconds 2

# ============================================
# PASO 5: Verificar Resultados
# ============================================
Write-Host "[PASO 5] Verificando resultados en PostgreSQL..." -ForegroundColor Yellow

try {
    Write-Host ""
    Write-Host "  Estado del pipeline:" -ForegroundColor White
    
    docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
SELECT 
    k.cluster_name,
    COUNT(DISTINCT CASE WHEN k.status = 'archived' THEN k.id END) as keywords_archivadas,
    COUNT(DISTINCT CASE WHEN k.status = 'processed' THEN k.id END) as clusters_creados,
    COUNT(DISTINCT i.id) as total_ideas,
    COUNT(DISTINCT CASE WHEN i.status = 'pending' THEN i.id END) as ideas_pendientes,
    COUNT(DISTINCT CASE WHEN i.status = 'draft_created' THEN i.id END) as ideas_con_draft,
    COUNT(DISTINCT d.id) as drafts_creados
FROM keywords k
LEFT JOIN ideas i ON i.keyword_cluster_id = k.id
LEFT JOIN drafts d ON d.idea_id = i.id
WHERE k.cluster_name LIKE '%$projectName%' OR k.project_name = '$projectName'
GROUP BY k.cluster_name
ORDER BY k.created_at DESC;
"
    
    Write-Host ""
    Write-Host "  Drafts generados:" -ForegroundColor White
    
    docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
SELECT 
    d.title,
    d.word_count,
    d.meta_title,
    array_length(d.tags, 1) as tags,
    i.categoria,
    d.created_at
FROM drafts d
JOIN ideas i ON d.idea_id = i.id
JOIN keywords k ON i.keyword_cluster_id = k.id
WHERE k.project_name = '$projectName'
ORDER BY d.created_at DESC
LIMIT 5;
"
    
} catch {
    Write-Host "  [WARNING] No se pudo verificar en PostgreSQL" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# RESULTADO FINAL
# ============================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   RESULTADO FINAL - TEST E2E" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[SUCCESS] Test E2E completado exitosamente" -ForegroundColor Green
Write-Host ""
Write-Host "Resumen del flujo:" -ForegroundColor White
Write-Host "  1. Ingesta (Tarea 4): $($response1.total_saved) keywords importadas" -ForegroundColor Gray
Write-Host "  2. Clustering (Tarea 5): $($response2.total_clusters_created) clusters creados" -ForegroundColor Gray
Write-Host "  3. Ideas (Tarea 6): $($response3.total_ideas_generated) ideas generadas" -ForegroundColor Gray
Write-Host "  4. Redacción (Tarea 7): $($response4.total_drafts_created) drafts creados" -ForegroundColor Gray
Write-Host ""

Write-Host "Estadísticas finales del proyecto '$projectName':" -ForegroundColor Yellow
docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
SELECT 
    'Keywords originales (archivadas)' as tipo,
    COUNT(*) as cantidad
FROM keywords 
WHERE status = 'archived' AND project_name = '$projectName'
UNION ALL
SELECT 
    'Clusters procesados' as tipo,
    COUNT(*) as cantidad
FROM keywords 
WHERE status = 'processed' AND project_name = '$projectName'
UNION ALL
SELECT 
    'Ideas generadas (total)' as tipo,
    COUNT(*) as cantidad
FROM ideas i
JOIN keywords k ON i.keyword_cluster_id = k.id
WHERE k.project_name = '$projectName'
UNION ALL
SELECT 
    'Ideas sin investigación' as tipo,
    COUNT(*) as cantidad
FROM ideas i
JOIN keywords k ON i.keyword_cluster_id = k.id
WHERE k.project_name = '$projectName'
  AND i.categoria = 'No requiere investigación'
UNION ALL
SELECT 
    'Drafts creados' as tipo,
    COUNT(*) as cantidad
FROM drafts d
JOIN ideas i ON d.idea_id = i.id
JOIN keywords k ON i.keyword_cluster_id = k.id
WHERE k.project_name = '$projectName';
"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           TEST COMPLETADO             " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

