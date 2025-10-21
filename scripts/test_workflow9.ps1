# Test del Workflow 9: Redacción Simple (Sin Investigación)
# Este script prueba la generación de drafts para ideas sin investigación

# Configuración
$baseUrl = "http://localhost:5678/webhook"
$uri = "$baseUrl/seo/redaccion/simple"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Test Workflow 9: Redacción Simple   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Función para mostrar resultados
function Show-TestResult {
    param($response, $testName)
    
    Write-Host ""
    Write-Host "[$testName]" -ForegroundColor Yellow
    Write-Host "Status: $($response.status)" -ForegroundColor $(if ($response.status -eq 'success') { 'Green' } elseif ($response.status -eq 'info') { 'Yellow' } else { 'Red' })
    
    if ($response.total_drafts_created -gt 0) {
        Write-Host "Ideas procesadas: $($response.total_ideas_processed)" -ForegroundColor Cyan
        Write-Host "Drafts creados: $($response.total_drafts_created)" -ForegroundColor Cyan
        Write-Host ""
        
        foreach ($draft in $response.drafts_details) {
            Write-Host "  📄 Draft: $($draft.title)" -ForegroundColor White
            Write-Host "    ID: $($draft.draft_id)" -ForegroundColor Gray
            Write-Host "    Idea ID: $($draft.idea_id)" -ForegroundColor Gray
            Write-Host "    Palabras: $($draft.word_count)" -ForegroundColor Green
            Write-Host "    Meta Title: $($draft.meta_title)" -ForegroundColor Gray
            Write-Host "    Tags: $($draft.tags_count)" -ForegroundColor Gray
            Write-Host ""
        }
    } else {
        Write-Host "Mensaje: $($response.message)" -ForegroundColor Yellow
    }
}

# Test 1: Generar drafts para ideas pendientes sin investigación (límite 3)
Write-Host "Test 1: Generar drafts para ideas sin investigación (límite 3)" -ForegroundColor Yellow
Write-Host "Endpoint: $uri" -ForegroundColor Gray

try {
    $body = @{
        limit = 3
    } | ConvertTo-Json
    
    Write-Host "Body: $body" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Ejecutando (esto puede tardar 60-120 segundos por idea)..." -ForegroundColor Yellow
    Write-Host "  OpenAI generando contenido de 600+ palabras..." -ForegroundColor Gray
    
    $response = Invoke-RestMethod `
        -Uri $uri `
        -Method Post `
        -Headers @{'Content-Type'='application/json'} `
        -Body $body `
        -TimeoutSec 300
    
    Show-TestResult -response $response -testName "Test 1 - Ideas Sin Investigación"
    
    # Si hay drafts, mostrar verificación
    if ($response.total_drafts_created -gt 0) {
        Write-Host "Verificando drafts en PostgreSQL..." -ForegroundColor Yellow
        
        $verification = @"
docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
SELECT 
    d.id,
    d.title,
    d.word_count,
    d.meta_title,
    array_length(d.tags, 1) as tags_count,
    i.idea_title,
    i.status as idea_status,
    d.created_at
FROM drafts d
JOIN ideas i ON d.idea_id = i.id
ORDER BY d.created_at DESC
LIMIT 5;
"
"@
        Write-Host $verification -ForegroundColor DarkGray
    }
    
    Write-Host ""
    Write-Host "[SUCCESS] Test 1 completado" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "[ERROR] Test 1 falló:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    # Mostrar detalles si están disponibles
    if ($_.ErrorDetails.Message) {
        $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host ""
        Write-Host "Detalles del error:" -ForegroundColor Yellow
        Write-Host ($errorObj | ConvertTo-Json -Depth 10) -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Pruebas Adicionales Disponibles     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 2: Generar para todas las ideas sin investigación pendientes
Write-Host "Test 2: Generar para TODAS las ideas sin investigación" -ForegroundColor Yellow
Write-Host "Comando:" -ForegroundColor Gray
Write-Host @"
Invoke-RestMethod ``
  -Uri '$uri' ``
  -Method Post ``
  -Headers @{'Content-Type'='application/json'} ``
  -Body '{}'
"@ -ForegroundColor DarkGray

Write-Host ""

# Test 3: Generar para una idea específica
Write-Host "Test 3: Generar draft para idea específica" -ForegroundColor Yellow
Write-Host "Comando (reemplazar UUID):" -ForegroundColor Gray
Write-Host @"
Invoke-RestMethod ``
  -Uri '$uri' ``
  -Method Post ``
  -Headers @{'Content-Type'='application/json'} ``
  -Body '{"idea_id":"AQUI-UUID-DE-LA-IDEA"}'
"@ -ForegroundColor DarkGray

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Verificación Manual en PostgreSQL   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Ver ideas pendientes sin investigación:" -ForegroundColor Yellow
Write-Host @"
docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
SELECT 
    i.id,
    i.idea_title,
    i.categoria,
    i.status,
    k.cluster_name
FROM ideas i
JOIN keywords k ON i.keyword_cluster_id = k.id
WHERE i.categoria = 'No requiere investigación'
  AND i.status = 'pending'
ORDER BY i.created_at DESC
LIMIT 10;
"
"@ -ForegroundColor DarkGray

Write-Host ""

Write-Host "Ver drafts generados con sus metadatos:" -ForegroundColor Yellow
Write-Host @"
docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
SELECT 
    d.title,
    d.word_count,
    d.meta_title,
    d.meta_description,
    array_length(d.tags, 1) as tags_count,
    d.status,
    d.created_at
FROM drafts d
ORDER BY d.created_at DESC
LIMIT 10;
"
"@ -ForegroundColor DarkGray

Write-Host ""

Write-Host "Ver contenido de un draft específico:" -ForegroundColor Yellow
Write-Host @"
docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
SELECT 
    title,
    meta_title,
    meta_description,
    tags,
    word_count,
    LEFT(content_markdown, 500) as preview
FROM drafts
ORDER BY created_at DESC
LIMIT 1;
"
"@ -ForegroundColor DarkGray

Write-Host ""

Write-Host "Ver relación completa ideas → drafts:" -ForegroundColor Yellow
Write-Host @"
docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
SELECT 
    k.cluster_name,
    COUNT(DISTINCT i.id) as total_ideas,
    COUNT(DISTINCT CASE WHEN i.status = 'pending' THEN i.id END) as ideas_pendientes,
    COUNT(DISTINCT CASE WHEN i.status = 'draft_created' THEN i.id END) as ideas_con_draft,
    COUNT(DISTINCT d.id) as total_drafts
FROM keywords k
LEFT JOIN ideas i ON i.keyword_cluster_id = k.id
LEFT JOIN drafts d ON d.idea_id = i.id
WHERE k.status = 'processed'
GROUP BY k.cluster_name
ORDER BY k.created_at DESC;
"
"@ -ForegroundColor DarkGray

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           Test Completado             " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

