# ============================================
# TEST E2E: Ingesta + Clustering (Tarea 4 + 5)
# ============================================

Write-Host "`n" -NoNewline
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST E2E: Flujo Completo SEO" -ForegroundColor Cyan
Write-Host "  Ingesta → Clustering" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`n"

$baseUrl = "http://localhost:5678/webhook-test"

# ============================================
# PASO 1: Limpiar datos anteriores
# ============================================

Write-Host "[PASO 1/4] Limpiando datos de pruebas anteriores..." -ForegroundColor Yellow
Write-Host ""

try {
    cd ..\n8n
    docker compose exec -T postgres psql -U marketai_user -d marketai_seo -c "DELETE FROM keywords WHERE project_name='E2E Test' OR cluster_name LIKE '%Test%';" 2>&1 | Out-Null
    Write-Host "  ✓ Datos limpiados" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ No se pudieron limpiar datos (puede ser normal)" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# PASO 2: Importar keywords (Workflow 5 o 6)
# ============================================

Write-Host "[PASO 2/4] Importando keywords de prueba..." -ForegroundColor Yellow
Write-Host ""

$csvData = @"
Keyword,Avg. monthly searches,Competition
cafe organico,5400,Medium
cafe saludable,4200,Low
cafe sin pesticidas,1800,Low
mejores granos de cafe,3200,Medium
cultura cafetera,2100,Medium
recetas con cafe,8900,High
cafeterias modernas,1500,Low
beneficios del cafe,6700,High
cafe de comercio justo,900,Low
cafe sostenible,1200,Low
"@

$body = @{
    csv_data = $csvData
    cluster_name = "E2E Test Import"
    project_name = "E2E Test"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest `
        -Uri "$baseUrl/seo/ingesta/csv" `
        -Method Post `
        -Headers @{'Content-Type'='application/json'} `
        -Body $body `
        -UseBasicParsing `
        -TimeoutSec 30 `
        -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    Write-Host "  ✓ Keywords importadas: $($result.total_imported)" -ForegroundColor Green
    Write-Host "  Status: $($result.status)" -ForegroundColor White
    
    if ($result.total_imported -lt 5) {
        Write-Host "  ⚠ Se esperaban más keywords importadas" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ✗ Error al importar keywords:" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Abortando test E2E" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
# PASO 3: Verificar keywords pendientes
# ============================================

Write-Host "[PASO 3/4] Verificando keywords pendientes en DB..." -ForegroundColor Yellow
Write-Host ""

try {
    $query = "SELECT COUNT(*) as total FROM keywords WHERE status='pending' AND project_name='E2E Test';"
    $result = docker compose exec -T postgres psql -U marketai_user -d marketai_seo -t -c $query
    $total = $result.Trim()
    
    Write-Host "  ✓ Keywords pendientes en DB: $total" -ForegroundColor Green
    
    if ([int]$total -eq 0) {
        Write-Host "  ⚠ No hay keywords pendientes para clustering" -ForegroundColor Yellow
        Write-Host "Abortando test E2E" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "  ⚠ No se pudo verificar DB (continuando)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "  Esperando 3 segundos antes del clustering..." -ForegroundColor Gray
Start-Sleep -Seconds 3
Write-Host ""

# ============================================
# PASO 4: Ejecutar clustering (Workflow 7)
# ============================================

Write-Host "[PASO 4/4] Ejecutando clustering..." -ForegroundColor Yellow
Write-Host "  (Esto puede tardar 10-30 segundos con OpenAI)" -ForegroundColor Gray
Write-Host ""

$bodyCluster = @{
    project_name = "E2E Test"
    limit = 50
} | ConvertTo-Json

try {
    $responseCluster = Invoke-WebRequest `
        -Uri "$baseUrl/seo/clustering" `
        -Method Post `
        -Headers @{'Content-Type'='application/json'} `
        -Body $bodyCluster `
        -UseBasicParsing `
        -TimeoutSec 60 `
        -ErrorAction Stop
    
    $resultCluster = $responseCluster.Content | ConvertFrom-Json
    
    Write-Host "  ✓ Clustering completado" -ForegroundColor Green
    Write-Host ""
    
    # ============================================
    # RESULTADO FINAL
    # ============================================
    
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✓ TEST E2E EXITOSO" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "=== ESTADÍSTICAS ===" -ForegroundColor Cyan
    Write-Host "  Keywords procesadas: $($resultCluster.total_keywords_processed)" -ForegroundColor White
    Write-Host "  Clusters creados: $($resultCluster.total_clusters_created)" -ForegroundColor White
    Write-Host ""
    
    if ($resultCluster.clusters -and $resultCluster.clusters.Count -gt 0) {
        Write-Host "=== CLUSTERS GENERADOS ===" -ForegroundColor Cyan
        foreach ($cluster in $resultCluster.clusters) {
            Write-Host ""
            Write-Host "  📌 $($cluster.cluster_name)" -ForegroundColor Yellow
            Write-Host "     Principal: $($cluster.keyword_principal)" -ForegroundColor White
            Write-Host "     Secundarias: $($cluster.keywords_secundarias.Count)" -ForegroundColor White
            foreach ($sec in $cluster.keywords_secundarias) {
                Write-Host "       • $sec" -ForegroundColor Gray
            }
        }
    }
    
    Write-Host ""
    Write-Host "=== VERIFICAR EN POSTGRESQL ===" -ForegroundColor Yellow
    Write-Host "Ver clusters creados:" -ForegroundColor White
    Write-Host "  docker compose exec postgres psql -U marketai_user -d marketai_seo -c \"SELECT cluster_name, keyword_principal, keywords_secundarias FROM keywords WHERE project_name='E2E Test' AND status='processed';\"" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Ver keywords archivadas:" -ForegroundColor White
    Write-Host "  docker compose exec postgres psql -U marketai_user -d marketai_seo -c \"SELECT keyword_principal, status FROM keywords WHERE project_name='E2E Test' AND status='archived';\"" -ForegroundColor Gray
    
} catch {
    Write-Host "  ✗ Error en clustering:" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Message -like "*404*") {
        Write-Host "⚠ El Workflow 7 (Clustering) no está activo" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Solución:" -ForegroundColor White
        Write-Host "  1. Abre http://localhost:5678" -ForegroundColor Gray
        Write-Host "  2. Importa: seo-module\n8n\workflows\SEO - 07 Clustering de Keywords.json" -ForegroundColor Gray
        Write-Host "  3. Configura credenciales de PostgreSQL y OpenAI" -ForegroundColor Gray
        Write-Host "  4. Activa el workflow" -ForegroundColor Gray
    } elseif ($_.Exception.Message -like "*timeout*") {
        Write-Host "⚠ El clustering tardó más de 60 segundos" -ForegroundColor Yellow
        Write-Host "  Esto puede ser normal con muchas keywords" -ForegroundColor Gray
    } elseif ($_.Exception.Message -like "*API key*" -or $_.Exception.Message -like "*OpenAI*") {
        Write-Host "⚠ Falta configurar OpenAI API key" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Solución:" -ForegroundColor White
        Write-Host "  1. Configura OPENAI_API_KEY en n8n/.env" -ForegroundColor Gray
        Write-Host "  2. Reinicia n8n: docker compose restart n8n" -ForegroundColor Gray
        Write-Host "  3. Configura credenciales de OpenAI en n8n UI" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ✗ TEST E2E FALLIDO" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Flujo E2E completado exitosamente:" -ForegroundColor Green
Write-Host "  ✓ Tarea 4: Ingesta de keywords" -ForegroundColor White
Write-Host "  ✓ Tarea 5: Clustering de keywords" -ForegroundColor White
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "  → Tarea 6: Generar 30 ideas (Workflow 2)" -ForegroundColor White
Write-Host "  → Tarea 7: Redactar contenido (Workflow 3)" -ForegroundColor White
Write-Host ""

