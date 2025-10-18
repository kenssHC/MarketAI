# ============================================
# VERIFICACION: Sistema Completo
# ============================================

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "  VERIFICACION: Sistema MarketAI" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$todoOk = $true

# ============================================
# 1. Docker Desktop
# ============================================

Write-Host "[1/4] Verificando Docker Desktop..." -ForegroundColor Yellow

try {
    $dockerVersion = docker --version 2>&1
    if ($dockerVersion -match "Docker version") {
        Write-Host "  [OK] Docker instalado: $dockerVersion" -ForegroundColor Green
    } else {
        Write-Host "  [X] Docker no esta instalado o no responde" -ForegroundColor Red
        $todoOk = $false
    }
} catch {
    Write-Host "  [X] Docker no esta disponible" -ForegroundColor Red
    $todoOk = $false
}

Write-Host ""

# ============================================
# 2. Servicios Docker
# ============================================

Write-Host "[2/4] Verificando servicios Docker..." -ForegroundColor Yellow

cd "..\n8n"

try {
    $dockerOutput = docker compose ps 2>&1
    
    if ($dockerOutput -match "n8n.*Up" -or $dockerOutput -match "n8n.*running") {
        Write-Host "  [OK] n8n esta corriendo" -ForegroundColor Green
    } else {
        Write-Host "  [X] n8n NO esta corriendo" -ForegroundColor Red
        Write-Host "      Ejecuta: docker compose up -d" -ForegroundColor Gray
        $todoOk = $false
    }
    
    if ($dockerOutput -match "postgres.*Up" -or $dockerOutput -match "postgres.*running") {
        Write-Host "  [OK] PostgreSQL esta corriendo" -ForegroundColor Green
    } else {
        Write-Host "  [X] PostgreSQL NO esta corriendo" -ForegroundColor Red
        Write-Host "      Ejecuta: docker compose up -d" -ForegroundColor Gray
        $todoOk = $false
    }
} catch {
    Write-Host "  [X] No se pudo verificar servicios Docker" -ForegroundColor Red
    $todoOk = $false
}

Write-Host ""

# ============================================
# 3. n8n UI
# ============================================

Write-Host "[3/4] Verificando n8n UI..." -ForegroundColor Yellow

try {
    $n8nResponse = Invoke-WebRequest `
        -Uri "http://localhost:5678" `
        -UseBasicParsing `
        -TimeoutSec 5 `
        -ErrorAction Stop
    
    Write-Host "  [OK] n8n UI accesible (Status: $($n8nResponse.StatusCode))" -ForegroundColor Green
    Write-Host "      URL: http://localhost:5678" -ForegroundColor Gray
} catch {
    Write-Host "  [X] n8n UI no responde" -ForegroundColor Red
    Write-Host "      Verifica que el servicio este corriendo" -ForegroundColor Gray
    $todoOk = $false
}

Write-Host ""

# ============================================
# 4. PostgreSQL
# ============================================

Write-Host "[4/4] Verificando PostgreSQL..." -ForegroundColor Yellow

try {
    $pgCheck = docker compose exec -T postgres pg_isready -U marketai_user -d marketai_seo 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] PostgreSQL acepta conexiones" -ForegroundColor Green
        
        # Verificar tablas
        $tableCheck = docker compose exec -T postgres psql -U marketai_user -d marketai_seo -c "\dt" 2>&1
        
        if ($tableCheck -match "keywords") {
            Write-Host "  [OK] Tabla 'keywords' existe" -ForegroundColor Green
        } else {
            Write-Host "  [X] Tabla 'keywords' no existe" -ForegroundColor Red
            Write-Host "      Las migraciones pueden no haberse ejecutado" -ForegroundColor Gray
            $todoOk = $false
        }
    } else {
        Write-Host "  [X] PostgreSQL no acepta conexiones" -ForegroundColor Red
        $todoOk = $false
    }
} catch {
    Write-Host "  [X] No se pudo verificar PostgreSQL" -ForegroundColor Red
    $todoOk = $false
}

Write-Host ""

# ============================================
# RESULTADO FINAL
# ============================================

Write-Host "=====================================" -ForegroundColor Cyan

if ($todoOk) {
    Write-Host " [OK] SISTEMA FUNCIONANDO CORRECTAMENTE" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Todos los componentes estan operativos." -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximos pasos:" -ForegroundColor White
    Write-Host "  1. Importa workflows en n8n (http://localhost:5678)" -ForegroundColor Gray
    Write-Host "  2. Activa los workflows" -ForegroundColor Gray
    Write-Host "  3. Ejecuta: .\test_workflows.ps1" -ForegroundColor Gray
} else {
    Write-Host " [X] HAY PROBLEMAS CON EL SISTEMA" -ForegroundColor Red
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Revisa los errores arriba y sigue estos pasos:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Si Docker no esta corriendo:" -ForegroundColor White
    Write-Host "   - Inicia Docker Desktop" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Si los servicios no estan corriendo:" -ForegroundColor White
    Write-Host "   cd ..\n8n" -ForegroundColor Gray
    Write-Host "   docker compose up -d" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Si hay problemas con PostgreSQL:" -ForegroundColor White
    Write-Host "   docker compose restart postgres" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Documentacion: ..\docs\troubleshooting.md" -ForegroundColor Cyan
}

Write-Host ""

