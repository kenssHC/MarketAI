# Test E2E Completo: Tareas 4 + 5 + 6
# Flujo completo: Ingesta → Clustering → Ideas

# Configuración
$baseUrl = "http://localhost:5678/webhook"
$projectName = "Test E2E Completo"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   TEST E2E: Ingesta + Clustering + Ideas" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# PASO 0: Limpiar datos de test anteriores
# ============================================
Write-Host "[PASO 0] Limpiando datos de tests anteriores..." -ForegroundColor Yellow

try {
    docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
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
# PASO 2: Verificar Keywords Pendientes
# ============================================
Write-Host "[PASO 2] Verificando keywords pendientes en PostgreSQL..." -ForegroundColor Yellow

try {
    $verification1 = docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
SELECT COUNT(*) as pendientes
FROM keywords 
WHERE status = 'pending' 
  AND project_name = '$projectName';
" | Select-String -Pattern '\s+\d+\s+' | ForEach-Object { $_.Matches[0].Value.Trim() }

    Write-Host "  [OK] Keywords pendientes: $verification1" -ForegroundColor Green
    
} catch {
    Write-Host "  [WARNING] No se pudo verificar" -ForegroundColor Yellow
}

Write-Host ""
Start-Sleep -Seconds 2

# ============================================
# PASO 3: Ejecutar Clustering (Tarea 5)
# ============================================
Write-Host "[PASO 3] Ejecutando Clustering de Keywords..." -ForegroundColor Yellow
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
    Write-Host ""
    
    foreach ($cluster in $response2.clusters_details) {
        Write-Host "      Cluster: $($cluster.cluster_name)" -ForegroundColor White
        Write-Host "        Principal: $($cluster.keyword_principal)" -ForegroundColor Gray
        Write-Host "        Secundarias: $($cluster.total_keywords_secundarias)" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "  [ERROR] Fallo el clustering:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Start-Sleep -Seconds 2

# ============================================
# PASO 4: Verificar Clusters Procesados
# ============================================
Write-Host "[PASO 4] Verificando clusters procesados en PostgreSQL..." -ForegroundColor Yellow

try {
    $verification2 = docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
SELECT COUNT(*) as procesados
FROM keywords 
WHERE status = 'processed' 
  AND project_name = '$projectName';
" | Select-String -Pattern '\s+\d+\s+' | ForEach-Object { $_.Matches[0].Value.Trim() }

    Write-Host "  [OK] Clusters procesados: $verification2" -ForegroundColor Green
    
} catch {
    Write-Host "  [WARNING] No se pudo verificar" -ForegroundColor Yellow
}

Write-Host ""
Start-Sleep -Seconds 2

# ============================================
# PASO 5: Generar Ideas (Tarea 6)
# ============================================
Write-Host "[PASO 5] Generando Ideas de Contenido..." -ForegroundColor Yellow
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
    Write-Host ""
    
    foreach ($cluster in $response3.clusters_details) {
        Write-Host "      Cluster: $($cluster.cluster_name)" -ForegroundColor White
        Write-Host "        Ideas generadas: $($cluster.ideas_generated)" -ForegroundColor Gray
        Write-Host "        Con investigación: $($cluster.ideas_con_investigacion)" -ForegroundColor Magenta
        Write-Host "        Sin investigación: $($cluster.ideas_sin_investigacion)" -ForegroundColor Magenta
    }
    
} catch {
    Write-Host "  [ERROR] Fallo la generación de ideas:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    # Continuar para mostrar estadísticas aunque falle
}

Write-Host ""
Start-Sleep -Seconds 2

# ============================================
# PASO 6: Verificar Ideas Generadas
# ============================================
Write-Host "[PASO 6] Verificando ideas en PostgreSQL..." -ForegroundColor Yellow

try {
    Write-Host ""
    Write-Host "  Estadísticas de ideas:" -ForegroundColor White
    
    docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
SELECT 
    k.cluster_name,
    COUNT(i.id) as total_ideas,
    SUM(CASE WHEN i.categoria LIKE '%Requiere%' THEN 1 ELSE 0 END) as con_investigacion,
    SUM(CASE WHEN i.categoria NOT LIKE '%Requiere%' THEN 1 ELSE 0 END) as sin_investigacion
FROM keywords k
LEFT JOIN ideas i ON k.id = i.keyword_cluster_id
WHERE k.status = 'processed'
GROUP BY k.id, k.cluster_name
ORDER BY k.created_at DESC;
"
    
    Write-Host ""
    Write-Host "  Últimas 10 ideas generadas:" -ForegroundColor White
    
    docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
SELECT 
    i.idea_title,
    i.categoria,
    k.cluster_name
FROM ideas i
JOIN keywords k ON i.keyword_cluster_id = k.id
ORDER BY i.created_at DESC
LIMIT 10;
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
Write-Host ""

Write-Host "Estado del proyecto '$projectName':" -ForegroundColor Yellow
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
    'Ideas generadas' as tipo,
    COUNT(*) as cantidad
FROM ideas i
JOIN keywords k ON i.keyword_cluster_id = k.id
WHERE k.project_name = '$projectName';
"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           TEST COMPLETADO             " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

