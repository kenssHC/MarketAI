# ============================================
# TEST: Workflow 11 - Redaccion Investigada
# ============================================

$baseUrl = "http://localhost:5678/webhook-test"
$uri = "$baseUrl/seo/redaccion/investigada"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Test Workflow 11: Redaccion Investigada" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Show-RedaccionResult {
    param($response, $testName)

    Write-Host ""
    Write-Host "[$testName]" -ForegroundColor Yellow
    Write-Host "Status: $($response.status)" -ForegroundColor $(if ($response.status -eq 'success') { 'Green' } elseif ($response.status -eq 'info') { 'Yellow' } else { 'Red' })

    if ($response.total_drafts_created -gt 0) {
        Write-Host "Ideas procesadas: $($response.total_ideas_processed)" -ForegroundColor Cyan
        Write-Host "Drafts generados: $($response.total_drafts_created)" -ForegroundColor Cyan
        Write-Host ""

        foreach ($draft in $response.drafts_details) {
            Write-Host "  • Idea: $($draft.idea_title)" -ForegroundColor White
            Write-Host "    Draft ID: $($draft.draft_id)" -ForegroundColor Gray
            Write-Host "    Reporte usado: $($draft.research_report_id)" -ForegroundColor Gray
            Write-Host "    Cluster: $($draft.cluster_name)" -ForegroundColor Gray
            Write-Host "    Keyword: $($draft.keyword_principal)" -ForegroundColor Gray
            Write-Host "    Palabras: $($draft.word_count)" -ForegroundColor Green
            Write-Host "    Meta Title: $($draft.meta_title)" -ForegroundColor DarkGray
            if ($draft.job_log_id) {
                Write-Host "    Job Log: $($draft.job_log_id)" -ForegroundColor DarkGray
            }
            Write-Host ""
        }
    } else {
        Write-Host "Mensaje: $($response.message)" -ForegroundColor Yellow
    }
}

# Test principal: generar un draft investigado (limite 1)
Write-Host "Test 1: Generar draft investigado (limit = 1)" -ForegroundColor Yellow
Write-Host "Endpoint: $uri" -ForegroundColor Gray
Write-Host ""

$body = @{
    limit = 1
} | ConvertTo-Json

Write-Host "Body enviado: $body" -ForegroundColor Gray
Write-Host ""

try {
    Write-Host "Ejecutando workflow..." -ForegroundColor White
    Write-Host "  (se requiere al menos una idea con research_ready + research_report completado)" -ForegroundColor Gray
    Write-Host ""

    $response = Invoke-RestMethod `
        -Uri $uri `
        -Method Post `
        -Headers @{'Content-Type'='application/json'} `
        -Body $body `
        -TimeoutSec 180

    Show-RedaccionResult -response $response -testName "Test 1 - limit 1"

    if ($response.total_drafts_created -gt 0) {
        Write-Host ""
        Write-Host "Verifica el draft generado en PostgreSQL:" -ForegroundColor Yellow
        Write-Host @"
docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
SELECT 
    d.id,
    d.idea_id,
    i.idea_title,
    d.word_count,
    d.status,
    d.created_at
FROM drafts d
JOIN ideas i ON i.id = d.idea_id
ORDER BY d.created_at DESC
LIMIT 5;
"
"@ -ForegroundColor DarkGray
    }

    Write-Host ""
    Write-Host "[SUCCESS] Test 1 completado" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "[ERROR] Test 1 fallo:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        try {
            $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host ""
            Write-Host "Detalles del error:" -ForegroundColor Yellow
            Write-Host ($errorObj | ConvertTo-Json -Depth 10) -ForegroundColor Gray
        } catch {
            Write-Host ""
            Write-Host "Respuesta de error bruta:" -ForegroundColor Yellow
            Write-Host $_.ErrorDetails.Message -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "        Pruebas adicionales             " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Procesar todos los disponibles:" -ForegroundColor Yellow
Write-Host @"
Invoke-RestMethod `
  -Uri '$uri' `
  -Method Post `
  -Headers @{'Content-Type'='application/json'} `
  -Body '{}'
"@ -ForegroundColor DarkGray
Write-Host ""

Write-Host "Procesar una idea especifica (reemplaza UUID):" -ForegroundColor Yellow
Write-Host @"
Invoke-RestMethod `
  -Uri '$uri' `
  -Method Post `
  -Headers @{'Content-Type'='application/json'} `
  -Body '{"idea_id":"UUID-IDEA"}'
"@ -ForegroundColor DarkGray
Write-Host ""

Write-Host "Forzar crear draft aunque exista (usa force = true):" -ForegroundColor Yellow
Write-Host @"
Invoke-RestMethod `
  -Uri '$uri' `
  -Method Post `
  -Headers @{'Content-Type'='application/json'} `
  -Body '{"idea_id":"UUID-IDEA","force":true}'
"@ -ForegroundColor DarkGray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       Checks manuales recomendados     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Ver redaccion con metadatos y research:" -ForegroundColor Yellow
Write-Host @"
docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
SELECT 
    d.id,
    d.meta_title,
    d.word_count,
    jsonb_array_length(d.research_sources) AS fuentes,
    d.created_at
FROM drafts d
ORDER BY d.created_at DESC
LIMIT 5;
"
"@ -ForegroundColor DarkGray
Write-Host ""

Write-Host "Verificar estado de la idea luego de redactar:" -ForegroundColor Yellow
Write-Host @"
docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
SELECT 
    i.id,
    i.idea_title,
    i.status,
    i.processed_at
FROM ideas i
WHERE i.status = 'draft_created'
ORDER BY i.processed_at DESC
LIMIT 10;
"
"@ -ForegroundColor DarkGray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "            Notas importantes           " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "- Requiere ideas con categoria 'Requiere investigacion' y status research_ready." -ForegroundColor Gray
Write-Host "- Debe existir un research_report completado (workflow 10) para cada idea." -ForegroundColor Gray
Write-Host "- Requiere OPENAI_API_KEY con acceso a modelos GPT 4o/4.1." -ForegroundColor Gray
Write-Host "- Registra cada ejecucion en la tabla jobs_log (job_type = draft_creation)." -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           Test completado              " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
