# ============================================
# TEST: Workflow 5 Corregido
# ============================================

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "  TEST: Workflow 5" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5678/webhook"

# ============================================
# TEST 1: CSV Simple (3 keywords)
# ============================================

Write-Host "[TEST 1] CSV Simple - 3 keywords" -ForegroundColor Yellow
Write-Host ""

$csv1 = @"
Keyword,Avg. monthly searches,Competition
cafe organico,5400,Medium
cafe de hongo,1200,Low
beneficios del cafe,9900,High
"@

$body1 = @{
    csv_data = $csv1
    cluster_name = "Test Corregido Simple"
    project_name = "Proyecto Test"
} | ConvertTo-Json

Write-Host "Enviando..." -ForegroundColor White

try {
    $response1 = Invoke-WebRequest `
        -Uri "$baseUrl/seo/ingesta/csv" `
        -Method Post `
        -Headers @{'Content-Type'='application/json'} `
        -Body $body1 `
        -UseBasicParsing `
        -TimeoutSec 30 `
        -ErrorAction Stop
    
    Write-Host "  [OK] Status: $($response1.StatusCode)" -ForegroundColor Green
    
    # Parsear respuesta
    $result1 = $response1.Content | ConvertFrom-Json
    
    # Mostrar respuesta
    Write-Host "  Respuesta:" -ForegroundColor Cyan
    $response1.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
    
} catch {
    Write-Host "  [ERROR] $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Message -like "*404*") {
        Write-Host "  → El workflow NO esta activo" -ForegroundColor Yellow
    }
}

Write-Host ""
Start-Sleep -Seconds 2

# ============================================
# TEST 2: CSV con más columnas (5 keywords)
# ============================================

Write-Host "[TEST 2] CSV Completo - 5 keywords" -ForegroundColor Yellow
Write-Host ""

$csv2 = @"
Keyword,Avg. monthly searches,Competition,Top of page bid
marketing digital,45000,High,2.50
seo empresarial,12000,Medium,1.80
email marketing,8500,Low,1.20
marketing contenido,6200,Medium,1.50
publicidad google ads,15000,High,3.00
"@

$body2 = @{
    csv_data = $csv2
    cluster_name = "Test Corregido Completo"
    project_name = "Marketing 2025"
} | ConvertTo-Json

Write-Host "Enviando..." -ForegroundColor White

try {
    $response2 = Invoke-WebRequest `
        -Uri "$baseUrl/seo/ingesta/csv" `
        -Method Post `
        -Headers @{'Content-Type'='application/json'} `
        -Body $body2 `
        -UseBasicParsing `
        -TimeoutSec 30 `
        -ErrorAction Stop
    
    Write-Host "  [OK] Status: $($response2.StatusCode)" -ForegroundColor Green
    
    $result2 = $response2.Content | ConvertFrom-Json
    Write-Host "  Respuesta:" -ForegroundColor Cyan
    $response2.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
    
} catch {
    Write-Host "  [ERROR] $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Start-Sleep -Seconds 2

# ============================================
# TEST 3: CSV con líneas vacías (debería ignorarlas)
# ============================================

Write-Host "[TEST 3] CSV con lineas vacias" -ForegroundColor Yellow
Write-Host ""

$csv3 = @"
Keyword,Avg. monthly searches,Competition
inteligencia artificial,89000,High

machine learning,56000,High

deep learning,34000,Medium
"@

$body3 = @{
    csv_data = $csv3
    cluster_name = "Test Lineas Vacias"
} | ConvertTo-Json

Write-Host "Enviando..." -ForegroundColor White

try {
    $response3 = Invoke-WebRequest `
        -Uri "$baseUrl/seo/ingesta/csv" `
        -Method Post `
        -Headers @{'Content-Type'='application/json'} `
        -Body $body3 `
        -UseBasicParsing `
        -TimeoutSec 30 `
        -ErrorAction Stop
    
    Write-Host "  [OK] Status: $($response3.StatusCode)" -ForegroundColor Green
    Write-Host "  (Deberia haber ignorado las lineas vacias)" -ForegroundColor Gray
    
    $result3 = $response3.Content | ConvertFrom-Json
    Write-Host "  Respuesta:" -ForegroundColor Cyan
    $response3.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
    
} catch {
    Write-Host "  [ERROR] $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ============================================
# VERIFICACION EN POSTGRESQL
# ============================================

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Verificacion en PostgreSQL" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

cd "..\n8n"

try {
    Write-Host "Keywords importadas (clusters de test):" -ForegroundColor Yellow
    docker compose exec postgres psql -U marketai_user -d marketai_seo -c "SELECT keyword_principal, search_volume, cluster_name, created_at FROM keywords WHERE cluster_name LIKE 'Test Corregido%' OR cluster_name LIKE 'Test Lineas%' ORDER BY created_at DESC LIMIT 15;"
} catch {
    Write-Host "[X] No se pudo conectar a PostgreSQL" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# RESULTADO FINAL
# ============================================

Write-Host "=====================================" -ForegroundColor Green
Write-Host "  PRUEBAS COMPLETADAS" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Tests ejecutados:" -ForegroundColor White
Write-Host "  1. CSV simple (3 keywords)" -ForegroundColor Gray
Write-Host "  2. CSV completo (5 keywords)" -ForegroundColor Gray
Write-Host "  3. CSV con lineas vacias (3 keywords)" -ForegroundColor Gray
Write-Host ""
Write-Host "Total esperado: 11 keywords importadas" -ForegroundColor Cyan
Write-Host ""
Write-Host "Siguiente paso:" -ForegroundColor Yellow
Write-Host "  1. Verifica que las keywords esten en PostgreSQL" -ForegroundColor White
Write-Host "  2. Si funciona, cambia a URL de produccion:" -ForegroundColor White
Write-Host "     /webhook/seo/ingesta/csv (sin -test)" -ForegroundColor Gray
Write-Host ""

