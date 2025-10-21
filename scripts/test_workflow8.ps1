# Test del Workflow 8: Generación de Ideas desde Clusters
# Este script prueba la generación de 30 ideas por cada cluster procesado

# Configuración
$baseUrl = "http://localhost:5678/webhook"
$uri = "$baseUrl/seo/ideas-generation"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Test Workflow 8: Generación Ideas   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Función para mostrar resultados
function Show-TestResult {
    param($response, $testName)
    
    Write-Host ""
    Write-Host "[$testName]" -ForegroundColor Yellow
    Write-Host "Status: $($response.status)" -ForegroundColor $(if ($response.status -eq 'success') { 'Green' } elseif ($response.status -eq 'info') { 'Yellow' } else { 'Red' })
    
    if ($response.total_clusters_processed -gt 0) {
        Write-Host "Clusters procesados: $($response.total_clusters_processed)" -ForegroundColor Cyan
        Write-Host "Ideas generadas total: $($response.total_ideas_generated)" -ForegroundColor Cyan
        Write-Host ""
        
        foreach ($cluster in $response.clusters_details) {
            Write-Host "  Cluster: $($cluster.cluster_name)" -ForegroundColor White
            Write-Host "    Keyword Principal: $($cluster.keyword_principal)" -ForegroundColor Gray
            Write-Host "    Ideas generadas: $($cluster.ideas_generated)" -ForegroundColor Green
            Write-Host "    Con investigación: $($cluster.ideas_con_investigacion)" -ForegroundColor Magenta
            Write-Host "    Sin investigación: $($cluster.ideas_sin_investigacion)" -ForegroundColor Magenta
            Write-Host ""
        }
    } else {
        Write-Host "Mensaje: $($response.message)" -ForegroundColor Yellow
    }
}

# Test 1: Generar ideas para todos los clusters pendientes (límite 3)
Write-Host "Test 1: Generar ideas para clusters pendientes (límite 3)" -ForegroundColor Yellow
Write-Host "Endpoint: $uri" -ForegroundColor Gray

try {
    $body = @{
        limit = 3
    } | ConvertTo-Json
    
    Write-Host "Body: $body" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Ejecutando (esto puede tardar 30-60 segundos por cluster)..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod `
        -Uri $uri `
        -Method Post `
        -Headers @{'Content-Type'='application/json'} `
        -Body $body
    
    Show-TestResult -response $response -testName "Test 1 - Múltiples Clusters"
    
    # Si hay ideas, mostrar algunas
    if ($response.total_ideas_generated -gt 0) {
        Write-Host "Verificando ideas en PostgreSQL..." -ForegroundColor Yellow
        
        $verification = @"
docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
SELECT 
    i.idea_title, 
    i.categoria, 
    i.priority,
    k.cluster_name
FROM ideas i
JOIN keywords k ON i.keyword_cluster_id = k.id
ORDER BY i.created_at DESC
LIMIT 10;
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

# Test 2: Generar ideas para todos los clusters sin límite
Write-Host "Test 2: Generar para TODOS los clusters pendientes" -ForegroundColor Yellow
Write-Host "Comando:" -ForegroundColor Gray
Write-Host @"
Invoke-RestMethod ``
  -Uri '$uri' ``
  -Method Post ``
  -Headers @{'Content-Type'='application/json'} ``
  -Body '{}'
"@ -ForegroundColor DarkGray

Write-Host ""

# Test 3: Generar para un cluster específico
Write-Host "Test 3: Generar ideas para cluster específico" -ForegroundColor Yellow
Write-Host "Comando (reemplazar UUID):" -ForegroundColor Gray
Write-Host @"
Invoke-RestMethod ``
  -Uri '$uri' ``
  -Method Post ``
  -Headers @{'Content-Type'='application/json'} ``
  -Body '{"keyword_cluster_id":"AQUI-UUID-DEL-CLUSTER"}'
"@ -ForegroundColor DarkGray

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Verificación Manual en PostgreSQL   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Ver todos los clusters procesados:" -ForegroundColor Yellow
Write-Host @"
docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
SELECT id, cluster_name, keyword_principal, status
FROM keywords
WHERE status = 'processed'
ORDER BY created_at DESC;
"
"@ -ForegroundColor DarkGray

Write-Host ""

Write-Host "Ver ideas generadas con sus clusters:" -ForegroundColor Yellow
Write-Host @"
docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
SELECT 
    k.cluster_name,
    COUNT(i.id) as total_ideas,
    SUM(CASE WHEN i.categoria LIKE '%Requiere%' THEN 1 ELSE 0 END) as con_investigacion,
    SUM(CASE WHEN i.categoria NOT LIKE '%Requiere%' THEN 1 ELSE 0 END) as sin_investigacion
FROM keywords k
LEFT JOIN ideas i ON k.id = i.keyword_cluster_id
WHERE k.status = 'processed'
GROUP BY k.id, k.cluster_name
ORDER BY k.created_at DESC;
"
"@ -ForegroundColor DarkGray

Write-Host ""

Write-Host "Ver últimas 20 ideas generadas:" -ForegroundColor Yellow
Write-Host @"
docker compose -f ../n8n/docker-compose.yml exec -T postgres psql -U marketai_user -d marketai_seo -c "
SELECT 
    i.idea_title,
    i.categoria,
    i.priority,
    k.cluster_name,
    i.created_at
FROM ideas i
JOIN keywords k ON i.keyword_cluster_id = k.id
ORDER BY i.created_at DESC
LIMIT 20;
"
"@ -ForegroundColor DarkGray

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           Test Completado             " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

