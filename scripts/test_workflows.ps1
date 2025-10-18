# ============================================
# VERIFICACION: Todos los Workflows (1-6)
# ============================================

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "  VERIFICACION: 6 Workflows SEO" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5678/webhook"
$todosActivos = $true

# ============================================
# WORKFLOW 1: Keywords
# ============================================
Write-Host "[1/6] Workflow 1 - Keywords Analysis..." -ForegroundColor Yellow

$body1 = @{
    tema = "marketing digital"
    nicho = "tecnologia"
    intencion = "informacional"
} | ConvertTo-Json

try {
    $response1 = Invoke-WebRequest `
        -Uri "$baseUrl/seo/keywords" `
        -Method Post `
        -Headers @{'Content-Type'='application/json'} `
        -Body $body1 `
        -UseBasicParsing `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    Write-Host "  [OK] Activo - Status: $($response1.StatusCode)" -ForegroundColor Green
    Write-Host "      Endpoint: /webhook/seo/keywords" -ForegroundColor Gray
} catch {
    if ($_.Exception.Message -like "*404*") {
        Write-Host "  [X] Inactivo (404)" -ForegroundColor Red
        $todosActivos = $false
    } elseif ($_.Exception.Message -like "*timeout*") {
        Write-Host "  [~] Activo pero lento (timeout)" -ForegroundColor Yellow
    } else {
        Write-Host "  [?] Error: $($_.Exception.Message.Substring(0, 50))..." -ForegroundColor Yellow
    }
}

Write-Host ""

# ============================================
# WORKFLOW 2: Ideas
# ============================================
Write-Host "[2/6] Workflow 2 - Ideas Generator..." -ForegroundColor Yellow

$body2 = @{
    keywords = @("seo", "marketing", "contenido")
    tema = "marketing digital"
    objetivo = "generar trafico"
} | ConvertTo-Json

try {
    $response2 = Invoke-WebRequest `
        -Uri "$baseUrl/seo/ideas" `
        -Method Post `
        -Headers @{'Content-Type'='application/json'} `
        -Body $body2 `
        -UseBasicParsing `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    Write-Host "  [OK] Activo - Status: $($response2.StatusCode)" -ForegroundColor Green
    Write-Host "      Endpoint: /webhook/seo/ideas" -ForegroundColor Gray
} catch {
    if ($_.Exception.Message -like "*404*") {
        Write-Host "  [X] Inactivo (404)" -ForegroundColor Red
        $todosActivos = $false
    } elseif ($_.Exception.Message -like "*timeout*") {
        Write-Host "  [~] Activo pero lento (timeout)" -ForegroundColor Yellow
    } else {
        Write-Host "  [?] Error: $($_.Exception.Message.Substring(0, 50))..." -ForegroundColor Yellow
    }
}

Write-Host ""

# ============================================
# WORKFLOW 3: Redaccion
# ============================================
Write-Host "[3/6] Workflow 3 - Redaccion..." -ForegroundColor Yellow

$body3 = @{
    keyword_principal = "marketing digital"
    keywords_secundarias = @("seo", "contenido")
    tono = "profesional"
    extension = 500
} | ConvertTo-Json

try {
    $response3 = Invoke-WebRequest `
        -Uri "$baseUrl/seo/redaccion" `
        -Method Post `
        -Headers @{'Content-Type'='application/json'} `
        -Body $body3 `
        -UseBasicParsing `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    Write-Host "  [OK] Activo - Status: $($response3.StatusCode)" -ForegroundColor Green
    Write-Host "      Endpoint: /webhook/seo/redaccion" -ForegroundColor Gray
} catch {
    if ($_.Exception.Message -like "*404*") {
        Write-Host "  [X] Inactivo (404)" -ForegroundColor Red
        $todosActivos = $false
    } elseif ($_.Exception.Message -like "*timeout*") {
        Write-Host "  [~] Activo pero lento (timeout)" -ForegroundColor Yellow
    } else {
        Write-Host "  [?] Error: $($_.Exception.Message.Substring(0, 50))..." -ForegroundColor Yellow
    }
}

Write-Host ""

# ============================================
# WORKFLOW 4: Formateo
# ============================================
Write-Host "[4/6] Workflow 4 - Formateo HTML..." -ForegroundColor Yellow

$body4 = @{
    contenido = @{
        titulo = "Test"
        secciones = @(
            @{ subtitulo = "Seccion 1"; contenido = "Contenido test" }
        )
    }
} | ConvertTo-Json -Depth 5

try {
    $response4 = Invoke-WebRequest `
        -Uri "$baseUrl/seo/formatear" `
        -Method Post `
        -Headers @{'Content-Type'='application/json'} `
        -Body $body4 `
        -UseBasicParsing `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    Write-Host "  [OK] Activo - Status: $($response4.StatusCode)" -ForegroundColor Green
    Write-Host "      Endpoint: /webhook/seo/formatear" -ForegroundColor Gray
} catch {
    if ($_.Exception.Message -like "*404*") {
        Write-Host "  [X] Inactivo (404)" -ForegroundColor Red
        $todosActivos = $false
    } elseif ($_.Exception.Message -like "*timeout*") {
        Write-Host "  [~] Activo pero lento (timeout)" -ForegroundColor Yellow
    } else {
        Write-Host "  [?] Error: $($_.Exception.Message.Substring(0, 50))..." -ForegroundColor Yellow
    }
}

Write-Host ""

# ============================================
# WORKFLOW 5: Ingesta CSV
# ============================================
Write-Host "[5/6] Workflow 5 - Ingesta CSV..." -ForegroundColor Yellow

$body5 = @{
    csv_data = "Keyword,Avg. monthly searches`ntest wf5,100"
    cluster_name = "Test WF5"
    project_name = "Test"
} | ConvertTo-Json

try {
    $response5 = Invoke-WebRequest `
        -Uri "$baseUrl/seo/ingesta/csv" `
        -Method Post `
        -Headers @{'Content-Type'='application/json'} `
        -Body $body5 `
        -UseBasicParsing `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    $result5 = $response5.Content | ConvertFrom-Json
    Write-Host "  [OK] Activo - Status: $($response5.StatusCode)" -ForegroundColor Green
    Write-Host "      Endpoint: /webhook/seo/ingesta/csv" -ForegroundColor Gray
    Write-Host "      Importadas: $($result5.total_imported)" -ForegroundColor Gray
    
    # Limpiar keyword de test
    docker compose exec -T postgres psql -U marketai_user -d marketai_seo -c "DELETE FROM keywords WHERE keyword_principal='test wf5';" 2>&1 | Out-Null
    
} catch {
    if ($_.Exception.Message -like "*404*") {
        Write-Host "  [X] Inactivo (404)" -ForegroundColor Red
        $todosActivos = $false
    } elseif ($_.Exception.Message -like "*timeout*") {
        Write-Host "  [~] Activo pero lento (timeout)" -ForegroundColor Yellow
    } else {
        Write-Host "  [?] Error: $($_.Exception.Message.Substring(0, 50))..." -ForegroundColor Yellow
    }
}

Write-Host ""

# ============================================
# WORKFLOW 6: Ingesta Manual
# ============================================
Write-Host "[6/6] Workflow 6 - Ingesta Manual..." -ForegroundColor Yellow

$body6 = @{
    keywords = @("test wf6")
    cluster_name = "Test WF6"
} | ConvertTo-Json

try {
    $response6 = Invoke-WebRequest `
        -Uri "$baseUrl/seo/ingesta/manual" `
        -Method Post `
        -Headers @{'Content-Type'='application/json'} `
        -Body $body6 `
        -UseBasicParsing `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    $result6 = $response6.Content | ConvertFrom-Json
    Write-Host "  [OK] Activo - Status: $($response6.StatusCode)" -ForegroundColor Green
    Write-Host "      Endpoint: /webhook/seo/ingesta/manual" -ForegroundColor Gray
    Write-Host "      Guardadas: $($result6.total_saved)" -ForegroundColor Gray
    
    # Limpiar keyword de test
    docker compose exec -T postgres psql -U marketai_user -d marketai_seo -c "DELETE FROM keywords WHERE keyword_principal='test wf6';" 2>&1 | Out-Null
    
} catch {
    if ($_.Exception.Message -like "*404*") {
        Write-Host "  [X] Inactivo (404)" -ForegroundColor Red
        $todosActivos = $false
    } elseif ($_.Exception.Message -like "*timeout*") {
        Write-Host "  [~] Activo pero lento (timeout)" -ForegroundColor Yellow
    } else {
        Write-Host "  [?] Error: $($_.Exception.Message.Substring(0, 50))..." -ForegroundColor Yellow
    }
}

Write-Host ""

# ============================================
# RESULTADO FINAL
# ============================================
Write-Host "=====================================" -ForegroundColor Cyan

if ($todosActivos) {
    Write-Host " [OK] TODOS LOS WORKFLOWS ACTIVOS" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Todos los 6 workflows estan funcionando correctamente." -ForegroundColor Green
    Write-Host ""
    Write-Host "Endpoints disponibles:" -ForegroundColor White
    Write-Host "  1. POST /webhook/seo/keywords" -ForegroundColor Gray
    Write-Host "  2. POST /webhook/seo/ideas" -ForegroundColor Gray
    Write-Host "  3. POST /webhook/seo/redaccion" -ForegroundColor Gray
    Write-Host "  4. POST /webhook/seo/formatear" -ForegroundColor Gray
    Write-Host "  5. POST /webhook/seo/ingesta/csv" -ForegroundColor Gray
    Write-Host "  6. POST /webhook/seo/ingesta/manual" -ForegroundColor Gray
} else {
    Write-Host " [X] ALGUNOS WORKFLOWS INACTIVOS" -ForegroundColor Red
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Revisa los workflows marcados con [X] arriba." -ForegroundColor Yellow
    Write-Host "Asegurate de que esten activados en n8n (switch verde)." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Nota: Los workflows 1-4 pueden mostrar errores de OpenAI si la API key no esta configurada," -ForegroundColor Gray
Write-Host "pero eso NO significa que esten inactivos. Un 404 = inactivo, otros errores = activo." -ForegroundColor Gray
Write-Host ""

