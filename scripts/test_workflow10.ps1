# ============================================
# TEST: Workflow 10 - Investigacion Deep Research
# ============================================
$baseUrl = "http://localhost:5678/webhook-test"
$uri = "$baseUrl/seo/investigacion"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Test Workflow 10: Investigacion IA   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
function Show-ResearchResult {
    param($response, $testName)
    Write-Host ""
    Write-Host "[$testName]" -ForegroundColor Yellow
    Write-Host "Status: $($response.status)" -ForegroundColor $(if ($response.status -eq 'success') { 'Green' } elseif ($response.status -eq 'info') { 'Yellow' } else { 'Red' })
    if ($response.total_reports_created -gt 0) {
        Write-Host "Ideas investigadas: $($response.total_ideas_processed)" -ForegroundColor Cyan
        Write-Host "Reports generados: $($response.total_reports_created)" -ForegroundColor Cyan
        Write-Host ""
        foreach ($report in $response.reports_details) {
            Write-Host "  ▶ Idea: $($report.idea_title)" -ForegroundColor White
            Write-Host "    Report ID: $($report.research_report_id)" -ForegroundColor Gray
            Write-Host "    Cluster: $($report.cluster_name)" -ForegroundColor Gray
            Write-Host "    Datos clave: $($report.datos_clave.Count)" -ForegroundColor Green
            Write-Host "    Tendencias: $($report.tendencias.Count)" -ForegroundColor Green
            Write-Host "    Fuentes: $($report.fuentes.Count)" -ForegroundColor Green
            Write-Host "    Updated at: $($report.updated_at)" -ForegroundColor Gray
            Write-Host ""
        }
    } else {
        Write-Host "Mensaje: $($response.message)" -ForegroundColor Yellow
    }
}
# Test 1: Ejecutar investigacion para una idea pendiente
Write-Host "Test 1: Generar research report para ideas pendientes (límite 1)" -ForegroundColor Yellow
Write-Host "Endpoint: $uri" -ForegroundColor Gray
try {
    $body = @{
        limit = 1
    } | ConvertTo-Json
    Write-Host "Body: $body" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Ejecutando (modelo o4-mini-deep-research, puede tardar 60-120 segundos)..." -ForegroundColor Yellow
    Write-Host ""
    $response = Invoke-RestMethod `
        -Uri $uri `
        -Method Post `
        -Headers @{'Content-Type'='application/json'} `
        -Body $body `
        -TimeoutSec 600
    Show-ResearchResult -response $response -testName "Test 1 - Límite 1"
    if ($response.total_reports_created -gt 0) {
        Write-Host "Verificando research_reports en PostgreSQL..." -ForegroundColor Yellow
        Write-Host @"
docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
SELECT 
    rr.id,
    rr.idea_id,
    i.idea_title,
    rr.status,
    jsonb_array_length(rr.key_statistics) as datos_clave,
    jsonb_array_length(rr.trends) as tendencias,
    jsonb_array_length(rr.sources) as fuentes,
    rr.updated_at
FROM research_reports rr
JOIN ideas i ON i.id = rr.idea_id
ORDER BY rr.updated_at DESC
LIMIT 5;
"
"@ -ForegroundColor DarkGray
    }
    Write-Host ""
    Write-Host "[SUCCESS] Test 1 completado" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "[ERROR] Test 1 falló:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        try {
            $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host ""
            Write-Host "Detalles del error:" -ForegroundColor Yellow
            Write-Host ($errorObj | ConvertTo-Json -Depth 10) -ForegroundColor Gray
        } catch {
            Write-Host ""
            Write-Host "Respuesta de error:" -ForegroundColor Yellow
            Write-Host $_.ErrorDetails.Message -ForegroundColor Gray
        }
    }
}
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "        Pruebas Adicionales             " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
# Test 2: Ejecutar para todos los pendientes
Write-Host "Test 2: Generar research para todas las ideas pendientes" -ForegroundColor Yellow
Write-Host "Comando:" -ForegroundColor Gray
Write-Host @"
Invoke-RestMethod `
  -Uri '$uri' `
  -Method Post `
  -Headers @{'Content-Type'='application/json'} `
  -Body '{}'
"@ -ForegroundColor DarkGray
Write-Host ""
# Test 3: Forzar recomputo para una idea (force = true)
Write-Host "Test 3: Reprocesar una idea específica (force=true)" -ForegroundColor Yellow
Write-Host "Comando (reemplaza UUID):" -ForegroundColor Gray
Write-Host @"
Invoke-RestMethod `
  -Uri '$uri' `
  -Method Post `
  -Headers @{'Content-Type'='application/json'} `
  -Body '{"idea_id":"AQUI-UUID","force":true}'
"@ -ForegroundColor DarkGray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Verificación manual en PostgreSQL    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ver reports completos (research_json truncado):" -ForegroundColor Yellow
Write-Host @"
docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
SELECT 
    rr.id,
    i.idea_title,
    rr.status,
    LEFT(rr.summary, 120) as resumen_preview,
    rr.updated_at
FROM research_reports rr
JOIN ideas i ON i.id = rr.idea_id
ORDER BY rr.updated_at DESC
LIMIT 5;
"
"@ -ForegroundColor DarkGray
Write-Host ""
Write-Host "Ver idea y estado después de la investigación:" -ForegroundColor Yellow
Write-Host @"
docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
SELECT 
    i.id,
    i.idea_title,
    i.categoria,
    i.status,
    i.processed_at
FROM ideas i
WHERE i.status = 'research_ready'
ORDER BY i.processed_at DESC
LIMIT 10;
"
"@ -ForegroundColor DarkGray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "         Notas importantes              " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "- Requiere configurar OPENAI_API_KEY con acceso a o4-mini-deep-research." -ForegroundColor Gray
Write-Host "- Antes de ejecutar, asegúrate de aplicar la migración 002_add_research_reports.sql." -ForegroundColor Gray
Write-Host "- El workflow actualiza ideas a estado 'research_ready' cuando se guarda el reporte." -ForegroundColor Gray
Write-Host "- Usa el flag 'force': true para recalcular un reporte existente." -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           Test completado              " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
