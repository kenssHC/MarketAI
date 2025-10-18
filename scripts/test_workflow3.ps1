# ============================================
# TEST: Workflow 3 - Redacción de Contenido
# ============================================

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "  TEST: Workflow 3 - Redacción" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5678/webhook"

# ============================================
# TEST: Redacción de Contenido
# ============================================

Write-Host "[TEST] Generando contenido SEO..." -ForegroundColor Yellow
Write-Host ""

$body = @{
    keyword_principal = "marketing digital"
    keywords_secundarias = @("seo", "contenido", "estrategias")
    tono = "profesional"
    extension = 500
} | ConvertTo-Json

Write-Host "Datos enviados:" -ForegroundColor White
Write-Host "  Keyword principal: marketing digital" -ForegroundColor Gray
Write-Host "  Keywords secundarias: seo, contenido, estrategias" -ForegroundColor Gray
Write-Host "  Tono: profesional" -ForegroundColor Gray
Write-Host "  Extensión: 500 palabras" -ForegroundColor Gray
Write-Host ""

try {
    Write-Host "Enviando request..." -ForegroundColor White
    
    $response = Invoke-WebRequest `
        -Uri "$baseUrl/seo/redaccion" `
        -Method Post `
        -Headers @{'Content-Type'='application/json'} `
        -Body $body `
        -UseBasicParsing `
        -TimeoutSec 90 `
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
    if ($result.contenido) {
        $palabras = ($result.contenido -split '\s+').Count
        Write-Host "  Contenido generado: $palabras palabras" -ForegroundColor White
    } else {
        Write-Host "  Respuesta recibida correctamente" -ForegroundColor White
    }
    
} catch {
    Write-Host "  [ERROR] $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Message -like "*404*") {
        Write-Host "⚠ El workflow NO está activo" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Solución:" -ForegroundColor White
        Write-Host "  1. Abre http://localhost:5678" -ForegroundColor Gray
        Write-Host "  2. Busca 'SEO - 03 Redacción de Contenido'" -ForegroundColor Gray
        Write-Host "  3. Activa el workflow (toggle en verde)" -ForegroundColor Gray
    } elseif ($_.Exception.Message -like "*timeout*") {
        Write-Host "⚠ El workflow tardó más de 90 segundos" -ForegroundColor Yellow
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

