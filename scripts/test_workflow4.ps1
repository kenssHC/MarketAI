# ============================================
# TEST: Workflow 4 - Formateo a HTML
# ============================================

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "  TEST: Workflow 4 - Formateo" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5678/webhook"

# ============================================
# TEST: Formateo a HTML
# ============================================

Write-Host "[TEST] Formateando contenido a HTML..." -ForegroundColor Yellow
Write-Host ""

$body = @{
    contenido = @{
        titulo = "Guía de Marketing Digital"
        introduccion = "El marketing digital es esencial para cualquier negocio moderno."
        secciones = @(
            @{ 
                subtitulo = "¿Qué es el Marketing Digital?"
                contenido = "El marketing digital engloba todas las estrategias de promoción en medios digitales."
            },
            @{ 
                subtitulo = "Beneficios del SEO"
                contenido = "El SEO mejora la visibilidad orgánica de tu sitio web en buscadores."
            }
        )
        conclusion = "El marketing digital es clave para el éxito empresarial."
    }
} | ConvertTo-Json -Depth 5

Write-Host "Datos enviados:" -ForegroundColor White
Write-Host "  Título: Guía de Marketing Digital" -ForegroundColor Gray
Write-Host "  Secciones: 2" -ForegroundColor Gray
Write-Host ""

try {
    Write-Host "Enviando request..." -ForegroundColor White
    
    $response = Invoke-WebRequest `
        -Uri "$baseUrl/seo/formatear" `
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
    if ($result.html) {
        Write-Host "  HTML generado: $($result.html.Length) caracteres" -ForegroundColor White
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
        Write-Host "  2. Busca 'SEO - 04 Formateo a HTML'" -ForegroundColor Gray
        Write-Host "  3. Activa el workflow (toggle en verde)" -ForegroundColor Gray
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
Write-Host "      Debería funcionar sin configuración adicional" -ForegroundColor Gray
Write-Host ""

