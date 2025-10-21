# ============================================
# TEST: Workflow 7 - Clustering de Keywords
# ============================================

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  TEST: Workflow 7 - Clustering" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5678/webhook"

# ============================================
# TEST: Clustering de Keywords Pendientes
# ============================================

Write-Host "[TEST] Ejecutando clustering de keywords..." -ForegroundColor Yellow
Write-Host ""

# Opción 1: Sin filtros (procesa todas las keywords pendientes)
$body = @{} | ConvertTo-Json

# Opción 2: Con filtros (descomenta para usar)
# $body = @{
#     project_name = "Test Workflow 6"  # Filtrar por proyecto
#     limit = 50                         # Limitar cantidad
# } | ConvertTo-Json

Write-Host "Configuracion:" -ForegroundColor White
Write-Host "  Filtros: ninguno (procesar todas las keywords pendientes)" -ForegroundColor Gray
Write-Host "  Límite: 100 keywords máximo" -ForegroundColor Gray
Write-Host ""

try {
    Write-Host "Enviando request..." -ForegroundColor White
    Write-Host "  (Esto puede tardar 10-30 segundos por OpenAI)" -ForegroundColor Gray
    Write-Host ""
    
    $response = Invoke-WebRequest `
        -Uri "$baseUrl/seo/clustering" `
        -Method Post `
        -Headers @{'Content-Type'='application/json'} `
        -Body $body `
        -UseBasicParsing `
        -TimeoutSec 60 `
        -ErrorAction Stop
    
    Write-Host "  [OK] Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    
    # Parsear respuesta
    $result = $response.Content | ConvertFrom-Json
    
    # Mostrar resultado
    Write-Host "=== RESPUESTA ===" -ForegroundColor Cyan
    Write-Host ""
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
    Write-Host ""
    
    Write-Host "=== RESUMEN ===" -ForegroundColor Green
    Write-Host "  Status: $($result.status)" -ForegroundColor White
    Write-Host "  Keywords procesadas: $($result.total_keywords_processed)" -ForegroundColor White
    Write-Host "  Clusters creados: $($result.total_clusters_created)" -ForegroundColor White
    
    if ($result.clusters_details -and $result.clusters_details.Count -gt 0) {
        Write-Host ""
        Write-Host "=== CLUSTERS GENERADOS ===" -ForegroundColor Cyan
        foreach ($cluster in $result.clusters_details) {
            Write-Host ""
            Write-Host ("  [CLUSTER] {0}" -f $cluster.cluster_name) -ForegroundColor Yellow
            Write-Host "     Principal: $($cluster.keyword_principal)" -ForegroundColor White
            Write-Host "     Secundarias ($($cluster.total_keywords_secundarias)):" -ForegroundColor White
            foreach ($sec in $cluster.keywords_secundarias) {
                Write-Host "       • $sec" -ForegroundColor Gray
            }
        }
    }
    
    Write-Host ""
    Write-Host "=== VERIFICAR EN POSTGRESQL ===" -ForegroundColor Yellow
    Write-Host "Ejecuta desde seo-module/n8n:" -ForegroundColor White
    Write-Host '  docker compose exec postgres psql -U marketai_user -d marketai_seo -c "SELECT cluster_name, keyword_principal, keywords_secundarias, status FROM keywords WHERE status=''processed'' ORDER BY created_at DESC LIMIT 5;"' -ForegroundColor Gray
    
} catch {
    Write-Host "  [ERROR] $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Message -like "*404*") {
        Write-Host "ALERTA: El workflow NO esta activo" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Solución:" -ForegroundColor White
        Write-Host "  1. Abre http://localhost:5678" -ForegroundColor Gray
        Write-Host "  2. Importa el archivo:" -ForegroundColor Gray
        Write-Host "     seo-module\n8n\workflows\SEO - 07 Clustering de Keywords.json" -ForegroundColor Gray
        Write-Host "  3. Configura credenciales de PostgreSQL y OpenAI" -ForegroundColor Gray
        Write-Host "  4. Activa el workflow (toggle en verde)" -ForegroundColor Gray
    } elseif ($_.Exception.Message -like "*timeout*") {
        Write-Host "⚠ El workflow tardó más de 60 segundos" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Esto puede ser normal si:" -ForegroundColor White
        Write-Host "  - Hay muchas keywords para procesar (>50)" -ForegroundColor Gray
        Write-Host "  - OpenAI está lento" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Prueba con un límite menor:" -ForegroundColor White
        Write-Host "  {\"limit\": 20}" -ForegroundColor Gray
    } elseif ($_.Exception.Message -like "*API key*" -or $_.Exception.Message -like "*OpenAI*") {
        Write-Host "⚠ Falta configurar API key de OpenAI" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "El workflow ESTÁ activo, pero necesita:" -ForegroundColor White
        Write-Host "  1. Configura OPENAI_API_KEY en .env" -ForegroundColor Gray
        Write-Host "  2. Reinicia n8n: docker compose restart n8n" -ForegroundColor Gray
        Write-Host "  3. En n8n, configura las credenciales de OpenAI" -ForegroundColor Gray
    } else {
        Write-Host "Detalles del error:" -ForegroundColor Yellow
        Write-Host $_.Exception.Message -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Prueba completada" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Nota: Este workflow requiere OpenAI API key" -ForegroundColor Gray
Write-Host "      Agrupa keywords pendientes en clusters temáticos" -ForegroundColor Gray
Write-Host ""
Write-Host "Flujo E2E completo:" -ForegroundColor Yellow
Write-Host "  1. Importar keywords: .\test_workflow5.ps1 o .\test_workflow6.ps1" -ForegroundColor White
Write-Host "  2. Hacer clustering: .\test_workflow7.ps1 (este script)" -ForegroundColor White
Write-Host "  3. Verificar resultados en PostgreSQL" -ForegroundColor White
Write-Host ""

