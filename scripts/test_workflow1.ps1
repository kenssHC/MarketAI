# ============================================
# TEST: Workflow 1 - Keywords Analysis
# ============================================

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "  TEST: Workflow 1 - Keywords" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5678/webhook"

# ============================================
# TEST: Generación de Keywords
# ============================================

Write-Host "[TEST] Generando keywords para 'marketing digital'..." -ForegroundColor Yellow
Write-Host ""

$body = @{
    tema = "marketing digital"
    nicho = "tecnologia"
    intencion = "informacional"
} | ConvertTo-Json

Write-Host "Datos enviados:" -ForegroundColor White
Write-Host "  Tema: marketing digital" -ForegroundColor Gray
Write-Host "  Nicho: tecnologia" -ForegroundColor Gray
Write-Host "  Intención: informacional" -ForegroundColor Gray
Write-Host ""

try {
    Write-Host "Enviando request..." -ForegroundColor White
    
    $response = Invoke-WebRequest `
        -Uri "$baseUrl/seo/keywords" `
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
    if ($result.keywords) {
        Write-Host "  Keywords generadas: $($result.keywords.Count)" -ForegroundColor White
    } elseif ($result.cluster_principal) {
        Write-Host "  Cluster principal: $($result.cluster_principal)" -ForegroundColor White
    } else {
        Write-Host "  Estructura de respuesta personalizada" -ForegroundColor White
    }
    
} catch {
    Write-Host "  [ERROR] $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Message -like "*404*") {
        Write-Host "⚠ El workflow NO está activo" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Solución:" -ForegroundColor White
        Write-Host "  1. Abre http://localhost:5678" -ForegroundColor Gray
        Write-Host "  2. Busca 'SEO - 01 Generación de Keywords'" -ForegroundColor Gray
        Write-Host "  3. Activa el workflow (toggle en verde)" -ForegroundColor Gray
    } elseif ($_.Exception.Message -like "*timeout*") {
        Write-Host "⚠ El workflow tardó más de 60 segundos" -ForegroundColor Yellow
        Write-Host "  Esto puede ser normal si usa OpenAI" -ForegroundColor Gray
    } elseif ($_.Exception.Message -like "*API key*" -or $_.Exception.Message -like "*OpenAI*") {
        Write-Host "⚠ Falta configurar API key de OpenAI" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "El workflow ESTÁ activo, pero necesita:" -ForegroundColor White
        Write-Host "  1. Configura OPENAI_API_KEY en .env" -ForegroundColor Gray
        Write-Host "  2. Reinicia n8n: docker compose restart n8n" -ForegroundColor Gray
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
Write-Host "      Un error de timeout o API key significa que el workflow SÍ está activo" -ForegroundColor Gray
Write-Host ""

