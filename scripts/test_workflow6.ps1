# ============================================
# TEST: Workflow 6 - Ingesta Manual
# ============================================

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "  TEST: Workflow 6 - Ingesta Manual" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5678/webhook"

# ============================================
# TEST: Ingesta Manual de Keywords
# ============================================

Write-Host "[TEST] Guardando keywords manuales..." -ForegroundColor Yellow
Write-Host ""

$body = @{
    keywords = @(
        "marketing digital para emprendedores",
        "estrategias de marketing online",
        "publicidad en redes sociales",
        "email marketing efectivo",
        "seo para pequeños negocios"
    )
    cluster_name = "Marketing para Emprendedores"
    project_name = "Test Workflow 6"
} | ConvertTo-Json

Write-Host "Datos enviados:" -ForegroundColor White
Write-Host "  Cluster: Marketing para Emprendedores" -ForegroundColor Gray
Write-Host "  Proyecto: Test Workflow 6" -ForegroundColor Gray
Write-Host "  Total keywords: 5" -ForegroundColor Gray
Write-Host ""
Write-Host "Keywords:" -ForegroundColor Cyan
@(
    "  • marketing digital para emprendedores",
    "  • estrategias de marketing online",
    "  • publicidad en redes sociales",
    "  • email marketing efectivo",
    "  • seo para pequeños negocios"
) | ForEach-Object { Write-Host $_ -ForegroundColor White }
Write-Host ""

try {
    Write-Host "Enviando request..." -ForegroundColor White
    
    $response = Invoke-WebRequest `
        -Uri "$baseUrl/seo/ingesta/manual" `
        -Method Post `
        -Headers @{'Content-Type'='application/json'} `
        -Body $body `
        -UseBasicParsing `
        -TimeoutSec 30 `
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
    if ($result.total_saved) {
        Write-Host "  Keywords guardadas: $($result.total_saved)" -ForegroundColor White
    }
    if ($result.cluster_name) {
        Write-Host "  Cluster: $($result.cluster_name)" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "=== VERIFICAR EN POSTGRESQL ===" -ForegroundColor Yellow
    Write-Host "Ejecuta desde seo-module/n8n:" -ForegroundColor White
    Write-Host "  docker compose exec postgres psql -U marketai_user -d marketai_seo -c \"SELECT keyword_principal, cluster_name, source FROM keywords WHERE cluster_name='Marketing para Emprendedores';\"" -ForegroundColor Gray
    
} catch {
    Write-Host "  [ERROR] $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Message -like "*404*") {
        Write-Host "⚠ El workflow NO está activo" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Solución:" -ForegroundColor White
        Write-Host "  1. Abre http://localhost:5678" -ForegroundColor Gray
        Write-Host "  2. Busca 'SEO - 06 Ingesta Keywords Manual'" -ForegroundColor Gray
        Write-Host "  3. Activa el workflow (toggle en verde)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  4. Verifica que el nodo 'Parse Keywords' use:" -ForegroundColor Gray
        Write-Host "     const webhookBody = inputData.body || inputData;" -ForegroundColor Gray
    } elseif ($_.Exception.Message -like "*timeout*") {
        Write-Host "⚠ El workflow tardó más de 30 segundos" -ForegroundColor Yellow
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
Write-Host "Nota: Este workflow NO requiere OpenAI" -ForegroundColor Gray
Write-Host "      Guarda las keywords directamente en PostgreSQL" -ForegroundColor Gray
Write-Host ""